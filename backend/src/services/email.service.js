import { createTransporter, EMAIL_CONFIG } from "../config/email.js";
import { IMAP_CONFIG } from "../config/constants.js";
import imaps from "imap-simple";
import { parseEmail, extractRFPId } from "../utils/emailParser.js";
import Proposal from "../models/Proposal.js";
import RFP from "../models/RFP.js";
import Vendor from "../models/Vendor.js";
import { parseProposal } from "./parser.service.js";

/**
 * Send RFP to multiple vendors via email
 */
export const sendRFPToVendors = async (rfp, vendorIds) => {
  try {
    const transporter = createTransporter();

    // Get vendor details
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    if (vendors.length === 0) {
      throw new Error("No valid vendors found");
    }

    // Get RFP details
    const rfpDoc = await RFP.findById(rfp._id || rfp);
    if (!rfpDoc) {
      throw new Error("RFP not found");
    }

    // Create email content
    const emailSubject = `RFP: ${rfpDoc.title} - ${rfpDoc.rfpId}`;

    const emailBody = `
Dear Vendor,

We are requesting a proposal for the following procurement:

RFP ID: ${rfpDoc.rfpId}
Title: ${rfpDoc.title}

Description:
${rfpDoc.description}

Requirements:
${rfpDoc.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.quantity}x ${item.name}${
        item.specifications ? ` - ${item.specifications}` : ""
      }`
  )
  .join("\n")}

Budget: $${rfpDoc.budget}
Timeline: ${rfpDoc.timeline}
Payment Terms: ${rfpDoc.paymentTerms}
Warranty: ${rfpDoc.warranty}

Please reply to this email with your proposal. Include:
- Detailed pricing for each item
- Delivery timeline
- Payment terms
- Warranty information
- Any additional terms or conditions

Please include the RFP ID (${rfpDoc.rfpId}) in your response subject line.

Thank you for your interest.

Best regards,
RFP Management System
`;

    const emailHtml = `
<html>
<body>
  <h2>Request for Proposal</h2>
  <p><strong>RFP ID:</strong> ${rfpDoc.rfpId}</p>
  <p><strong>Title:</strong> ${rfpDoc.title}</p>
  
  <h3>Description:</h3>
  <p>${rfpDoc.description}</p>
  
  <h3>Requirements:</h3>
  <ul>
    ${rfpDoc.items
      .map(
        (item) =>
          `<li>${item.quantity}x ${item.name}${
            item.specifications ? ` - ${item.specifications}` : ""
          }</li>`
      )
      .join("")}
  </ul>
  
  <h3>Terms:</h3>
  <ul>
    <li><strong>Budget:</strong> $${rfpDoc.budget}</li>
    <li><strong>Timeline:</strong> ${rfpDoc.timeline}</li>
    <li><strong>Payment Terms:</strong> ${rfpDoc.paymentTerms}</li>
    <li><strong>Warranty:</strong> ${rfpDoc.warranty}</li>
  </ul>
  
  <p>Please reply to this email with your proposal. Include the RFP ID (<strong>${
    rfpDoc.rfpId
  }</strong>) in your response subject line.</p>
</body>
</html>
`;

    // Send emails to all vendors
    const results = [];
    for (const vendor of vendors) {
      try {
        const info = await transporter.sendMail({
          from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
          to: vendor.email,
          subject: emailSubject,
          text: emailBody,
          html: emailHtml,
        });

        results.push({
          vendorId: vendor._id,
          vendorEmail: vendor.email,
          success: true,
          messageId: info.messageId,
        });
      } catch (error) {
        results.push({
          vendorId: vendor._id,
          vendorEmail: vendor.email,
          success: false,
          error: error.message,
        });
      }
    }

    // Update RFP status
    rfpDoc.status = "sent";
    await rfpDoc.save();

    return {
      success: true,
      results,
      rfpId: rfpDoc.rfpId,
    };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

/**
 * Check for new emails and process proposals
 */

/**
 * Build IMAP search criteria for multiple vendor emails
 * Uses nested OR structure: ['OR', ['FROM', 'a'], ['OR', ['FROM', 'b'], ['FROM', 'c']]]
 */
const buildVendorSearchCriteria = (vendorEmails) => {
  if (vendorEmails.length === 0) return null;
  if (vendorEmails.length === 1) {
    return ["UNSEEN", ["FROM", vendorEmails[0]]];
  }

  // Build nested OR for multiple vendors
  const buildOrCriteria = (emails) => {
    if (emails.length === 1) {
      return ["FROM", emails[0]];
    }
    if (emails.length === 2) {
      return ["OR", ["FROM", emails[0]], ["FROM", emails[1]]];
    }
    // Recursively build: OR(first, OR(rest...))
    return ["OR", ["FROM", emails[0]], buildOrCriteria(emails.slice(1))];
  };

  return ["UNSEEN", buildOrCriteria(vendorEmails)];
};

export const checkIncomingEmails = async () => {
  try {
    // Fetch all vendor emails from database
    const vendors = (await Vendor.find({}, { email: 1 })) || [];
    const vendorEmails =
      vendors?.map((v) => v.email?.toLowerCase()).filter(Boolean) || [];

    if (vendorEmails.length === 0) {
      return {
        success: true,
        processed: 0,
        emails: [],
        message: "No vendors in database to filter emails from",
      };
    }

    console.log(
      `Searching for emails from ${vendorEmails.length} vendors:`,
      vendorEmails
    );

    const connection = await imaps.connect(IMAP_CONFIG);
    await connection.openBox("INBOX");

    // Build optimized search criteria - IMAP server filters by FROM
    const searchCriteria = buildVendorSearchCriteria(vendorEmails);
    console.log("IMAP Search Criteria:", JSON.stringify(searchCriteria));

    const fetchOptions = {
      bodies: ["HEADER", "TEXT", ""],
      struct: true,
    };

    // Search directly for UNSEEN emails FROM vendor addresses
    // This is much faster than fetching all emails and filtering in JS
    let messages = [];
    try {
      messages = await connection.search(searchCriteria, fetchOptions);
    } catch (searchError) {
      // Fallback: Some IMAP servers don't support complex OR queries
      // Search for each vendor individually
      console.log(
        "Complex OR search failed, falling back to individual searches..."
      );
      for (const vendorEmail of vendorEmails) {
        try {
          const vendorMessages = await connection.search(
            ["UNSEEN", ["FROM", vendorEmail]],
            fetchOptions
          );
          messages.push(...vendorMessages);
        } catch (err) {
          console.error(`Failed to search for ${vendorEmail}:`, err.message);
        }
      }
    }

    console.log(`Found ${messages.length} unseen emails from known vendors`);

    if (messages.length === 0) {
      connection.end();
      return {
        success: true,
        processed: 0,
        emails: [],
        message: "No new emails from vendors found",
      };
    }

    console.log(`Fetched full content of ${messages.length} vendor emails`);

    const processedEmails = [];

    for (const message of messages) {
      try {
        // Extract email parts
        const allParts = imaps.getParts(message.attributes.struct || []);
        const messageParts = message.parts || [];

        let fullBody = "";
        let htmlBody = "";
        let attachments = [];
        let subject = "";
        let from = "";
        let date = "";
        let messageId = "";

        // Get header info
        const headerPart = messageParts.find((p) => p.which === "HEADER");
        if (headerPart) {
          subject = headerPart.body.subject?.[0] || "";
          from = headerPart.body.from?.[0] || "";
          date = headerPart.body.date?.[0] || "";
          // Extract unique message ID for duplicate detection
          messageId = headerPart.body["message-id"]?.[0] || "";
        }

        // Get body content - try TEXT part first
        const textPart = messageParts.find((p) => p.which === "TEXT");
        if (textPart && textPart.body) {
          fullBody =
            typeof textPart.body === "string"
              ? textPart.body
              : textPart.body.toString("utf8");
        }

        // Fallback: get from empty-which part (full raw message)
        if (!fullBody) {
          const fullPart = messageParts.find((p) => p.which === "");
          if (fullPart && fullPart.body) {
            const rawBody =
              typeof fullPart.body === "string"
                ? fullPart.body
                : fullPart.body.toString("utf8");

            // Extract body from raw email (after headers)
            const bodyMatch = rawBody.match(/\r?\n\r?\n([\s\S]*)/);
            if (bodyMatch) {
              fullBody = bodyMatch[1];
            } else {
              fullBody = rawBody;
            }
          }
        }

        // Try to fetch body using getPartData if still empty
        if (!fullBody && allParts.length > 0) {
          for (const part of allParts) {
            // Look for text/plain or text/html parts
            if (
              part.type === "text" &&
              (part.subtype === "plain" || part.subtype === "html")
            ) {
              try {
                const partData = await connection.getPartData(message, part);
                if (part.subtype === "html") {
                  htmlBody = partData;
                  // Also extract plain text from HTML
                  if (!fullBody) {
                    fullBody = partData
                      .replace(/<[^>]*>/g, " ")
                      .replace(/\s+/g, " ")
                      .trim();
                  }
                } else {
                  fullBody = partData;
                }
              } catch (partErr) {
                console.error("Error fetching part data:", partErr.message);
              }
            }
          }
        }

        // Extract sender email from "Name <email@domain.com>" format
        const emailMatch = from.match(/<([^>]+)>/) || [null, from];
        const senderEmail = (emailMatch[1] || from).toLowerCase().trim();

        console.log(
          `Processing email - Subject: "${subject}", From: "${senderEmail}", Body length: ${fullBody.length}`
        );
        console.log(`Email body preview: ${fullBody.substring(0, 200)}...`);

        // Get attachments from struct
        for (const part of allParts) {
          if (
            part.disposition &&
            part.disposition.type?.toUpperCase() === "ATTACHMENT"
          ) {
            try {
              const attData = await connection.getPartData(message, part);
              attachments.push({
                filename: part.disposition.params?.filename || "attachment",
                contentType: part.type,
                size: part.size,
                content: attData,
              });
            } catch (attErr) {
              console.error("Error fetching attachment:", attErr.message);
            }
          }
        }

        // Find vendor by email
        let vendor = await Vendor.findOne({
          email: { $regex: new RegExp(senderEmail.split("@")[0], "i") },
        });

        if (!vendor) {
          // Create vendor if not found
          vendor = await Vendor.create({
            name: senderEmail.split("@")[0],
            email: senderEmail,
          });
          console.log(`Created new vendor: ${vendor.name}`);
        }

        // Try to extract RFP ID from subject/body
        let rfpIdString = extractRFPId(subject, fullBody);
        let rfp = null;

        console.log(`Extracted RFP ID: ${rfpIdString || "none"}`);

        if (rfpIdString) {
          rfp = await RFP.findOne({ rfpId: rfpIdString });
          if (rfp) {
            console.log(`Found RFP by ID: ${rfp.rfpId}`);
          }
        }

        // If no RFP ID found or RFP not found, try smart matching
        if (!rfp) {
          console.log("No RFP ID in email, using smart matching...");

          // First: Try to find RFPs with status 'sent'
          let recentRFPs = await RFP.find({ status: "sent" })
            .sort({ createdAt: -1 })
            .limit(5);

          // Fallback: If no sent RFPs, get any recent RFP
          if (recentRFPs.length === 0) {
            console.log("No sent RFPs found, looking for any recent RFP...");
            recentRFPs = await RFP.find({}).sort({ createdAt: -1 }).limit(5);
          }

          if (recentRFPs.length > 0) {
            // Use the most recent RFP
            rfp = recentRFPs[0];
            console.log(`Auto-matched to RFP: ${rfp.rfpId} (${rfp.title})`);
          }
        }

        // If still no RFP, create a placeholder or skip
        if (!rfp) {
          console.log("No RFPs exist in system. Cannot process email.");
          processedEmails.push({
            success: false,
            vendorEmail: senderEmail,
            subject,
            error: "No RFPs exist in system to match this email",
          });
          continue;
        }

        // Check for duplicate email by messageId
        if (messageId) {
          const existingByMessageId = await Proposal.findOne({
            emailMessageId: messageId,
          });
          if (existingByMessageId) {
            console.log(
              `⏭️ Skipping duplicate email (already processed): ${messageId}`
            );
            // Mark as seen even if skipped to avoid reprocessing
            await connection.addFlags(message.attributes.uid, "\\Seen");
            continue;
          }
        }

        // Count existing proposals from this vendor for this RFP
        const existingCount = await Proposal.countDocuments({
          rfpId: rfp._id,
          vendorId: vendor._id,
        });

        // Always create NEW proposal with incremented number
        const proposalNumber = existingCount + 1;
        const proposal = await Proposal.create({
          rfpId: rfp._id,
          vendorId: vendor._id,
          proposalNumber,
          emailMessageId: messageId || null, // Store for duplicate detection
          emailContent: {
            subject,
            from: senderEmail,
            body: fullBody,
            html: htmlBody,
          },
          attachments: attachments.length > 0 ? attachments : [],
          status: "pending",
        });

        console.log(
          `Created proposal #${proposalNumber} from ${vendor.name} for RFP: ${rfp.rfpId}`
        );

        // Auto-parse proposal using AI
        let parseResult = null;
        let extractedData = null;
        try {
          console.log(`Parsing proposal ${proposal._id} with AI...`);
          console.log(
            `Email body to parse (${
              fullBody.length
            } chars): ${fullBody.substring(0, 300)}...`
          );

          parseResult = await parseProposal(proposal._id);

          // Get updated proposal with extracted data
          const updatedProposal = await Proposal.findById(proposal._id);
          extractedData = updatedProposal?.extractedData;

          console.log(
            "AI parsing successful:",
            JSON.stringify(extractedData, null, 2)
          );
        } catch (parseErr) {
          console.error("Auto-parsing failed:", parseErr.message);
        }

        processedEmails.push({
          proposalId: proposal._id,
          proposalNumber,
          rfpId: rfp.rfpId,
          rfpTitle: rfp.title,
          vendorId: vendor._id,
          vendorName: vendor.name,
          vendorEmail: vendor.email,
          subject,
          success: true,
          parsed: !!extractedData,
          extractedData: extractedData || null,
        });

        console.log(
          `Successfully processed proposal #${proposalNumber} from ${vendor.name} for RFP: ${rfp.rfpId}`
        );

        // Mark email as seen
        await connection.addFlags(message.attributes.uid, "\\Seen");
      } catch (processingError) {
        console.error("Error processing email:", processingError);
        processedEmails.push({
          success: false,
          error: processingError.message,
        });
      }
    }

    connection.end();

    // Count successful and failed
    const successCount = processedEmails.filter((e) => e.success).length;
    const failedCount = processedEmails.filter((e) => !e.success).length;

    return {
      success: true,
      processed: successCount,
      failed: failedCount,
      emails: processedEmails,
      message:
        successCount > 0
          ? `Processed ${successCount} proposal(s) from vendor emails`
          : "No new proposals found from vendor emails",
    };
  } catch (imapError) {
    console.error("IMAP error:", imapError);
    throw imapError;
  }
};
