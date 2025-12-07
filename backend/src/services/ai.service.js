import { ai, GEMINI_MODEL, Type } from "../config/ai.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Extract structured RFP data from natural language description
 */
export const extractRFPFromNaturalLanguage = async (naturalLanguageText) => {
  try {
    const config = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: [
          "title",
          "description",
          "items",
          "budget",
          "timeline",
          "paymentTerms",
          "warranty",
        ],
        properties: {
          title: {
            type: Type.STRING,
          },
          description: {
            type: Type.STRING,
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["name", "quantity"],
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                specifications: { type: Type.STRING },
              },
            },
          },
          budget: {
            type: Type.INTEGER,
          },
          timeline: {
            type: Type.STRING,
          },
          paymentTerms: {
            type: Type.STRING,
          },
          warranty: {
            type: Type.STRING,
          },
        },
      },
    };

    const model = GEMINI_MODEL;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `You are an expert procurement assistant. Extract structured information from the following RFP description.

RFP Description:
${naturalLanguageText}

Extract the following information:
- title: A concise title for the RFP
- description: The full description
- items: Array of items with name, quantity, specifications (if mentioned)
- budget: Total budget amount (number)
- timeline: Delivery timeline (e.g., "30 days", "2 weeks")
- paymentTerms: Payment terms (e.g., "Net 30", "50% upfront")
- warranty: Warranty requirements (e.g., "1 year", "2 years")

If information is not available, use appropriate defaults (empty strings, 0, empty arrays).`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullResponse = "";
    for await (const chunk of response) {
      if (chunk.text) {
        fullResponse += chunk.text;
      } else if (typeof chunk === "string") {
        fullResponse += chunk;
      } else if (
        chunk.candidates &&
        chunk.candidates[0] &&
        chunk.candidates[0].content
      ) {
        const parts = chunk.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].text) {
          fullResponse += parts[0].text;
        }
      } else if (chunk.content && chunk.content.parts) {
        const parts = chunk.content.parts;
        if (parts && parts[0] && parts[0].text) {
          fullResponse += parts[0].text;
        }
      }
    }

    if (!fullResponse || fullResponse.trim() === "") {
      throw new Error("Empty response from Gemini API");
    }

    let jsonContent = fullResponse.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/g, "").trim();
    }

    const extractedData = JSON.parse(jsonContent);

    return {
      success: true,
      data: extractedData,
      tokensUsed: 0,
    };
  } catch (error) {
    console.error("AI Extraction Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response || "No response object",
    });
    throw new AppError(`Failed to extract RFP data: ${error.message}`, 500);
  }
};

/**
 * Parse vendor proposal response from email content and attachments
 */
export const parseProposalResponse = async (emailContent, attachments = []) => {
  try {
    let fullText = emailContent.body || emailContent.text || "";

    if (emailContent.html) {
      fullText += "\n\n" + emailContent.html.replace(/<[^>]*>/g, " ");
    }

    attachments.forEach((attachment) => {
      if (attachment.extractedText) {
        fullText += "\n\n" + attachment.extractedText;
      }
    });

    const config = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: [
          "items",
          "paymentTerms",
          "deliveryTerms",
          "warranty",
          "compliance",
        ],
        properties: {
          totalPrice: {
            type: Type.NUMBER,
            nullable: true,
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                unitPrice: { type: Type.NUMBER },
                totalPrice: { type: Type.NUMBER },
                specifications: { type: Type.STRING },
              },
            },
          },
          paymentTerms: {
            type: Type.STRING,
          },
          deliveryTerms: {
            type: Type.STRING,
          },
          warranty: {
            type: Type.STRING,
          },
          compliance: {
            type: Type.OBJECT,
            properties: {
              meetsBudget: { type: Type.BOOLEAN },
              meetsTimeline: { type: Type.BOOLEAN },
              meetsSpecs: { type: Type.BOOLEAN },
            },
          },
          notes: {
            type: Type.STRING,
          },
        },
      },
    };

    const model = GEMINI_MODEL;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `You are an expert procurement assistant. Extract structured proposal information from the following vendor response email.

Email Content:
${fullText}

Extract the following information:
- totalPrice: Total price quoted (number). IMPORTANT: Only include if a specific price/quote is mentioned. Use null if no price is quoted.
- items: Array of line items with name, quantity, unitPrice, totalPrice, specifications. Use null for prices if not specified.
- paymentTerms: Payment terms offered (e.g., "Net 30", "50% upfront")
- deliveryTerms: Delivery timeline/terms (e.g., "30 days", "2 weeks")
- warranty: Warranty information (e.g., "1 year", "2 years")
- compliance: Object with compliance flags (meetsBudget, meetsTimeline, meetsSpecs)
- notes: Any additional notes, conditions, or observations about this response

IMPORTANT: 
- If no price/quote is provided in the email, set totalPrice to null (not 0).
- Only set totalPrice to a number if a specific monetary amount is clearly stated.
- If this is a requirements document or inquiry (not a vendor quote), note this in the notes field.`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullResponse = "";
    for await (const chunk of response) {
      if (chunk.text) {
        fullResponse += chunk.text;
      } else if (typeof chunk === "string") {
        fullResponse += chunk;
      } else if (
        chunk.candidates &&
        chunk.candidates[0] &&
        chunk.candidates[0].content
      ) {
        const parts = chunk.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].text) {
          fullResponse += parts[0].text;
        }
      }
    }

    if (!fullResponse || fullResponse.trim() === "") {
      throw new Error("Empty response from Gemini API");
    }

    let jsonContent = fullResponse.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/g, "").trim();
    }

    const extractedData = JSON.parse(jsonContent);

    return {
      success: true,
      data: extractedData,
      tokensUsed: 0,
    };
  } catch (error) {
    console.error("AI Parsing Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response || "No response object",
    });
    throw new AppError(`Failed to parse proposal: ${error.message}`, 500);
  }
};

/**
 * Generate comparison and recommendation for proposals
 */
export const generateComparison = async (rfp, proposals) => {
  try {
    const rfpSummary = `
Title: ${rfp.title}
Budget: $${rfp.budget}
Timeline: ${rfp.timeline}
Payment Terms: ${rfp.paymentTerms}
Warranty Required: ${rfp.warranty}
Items: ${rfp.items
      .map((item) => `${item.quantity}x ${item.name} (${item.specifications})`)
      .join(", ")}
`;

    const proposalsSummary = proposals
      .map((proposal, index) => {
        const vendor = proposal.vendorId?.name || "Unknown Vendor";
        const extracted = proposal.extractedData || {};
        return `
Proposal ${index + 1} - ${vendor}:
- Total Price: $${extracted.totalPrice || 0}
- Payment Terms: ${extracted.paymentTerms || "N/A"}
- Delivery Terms: ${extracted.deliveryTerms || "N/A"}
- Warranty: ${extracted.warranty || "N/A"}
- Compliance: ${JSON.stringify(extracted.compliance || {})}
- Notes: ${extracted.notes || "None"}
`;
      })
      .join("\n");

    const config = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["summary", "recommendation", "scores"],
        properties: {
          summary: {
            type: Type.STRING,
          },
          recommendation: {
            type: Type.OBJECT,
            required: ["vendorIndex", "reasoning", "confidence"],
            properties: {
              vendorIndex: { type: Type.INTEGER },
              reasoning: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
            },
          },
          scores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: [
                "proposalIndex",
                "priceScore",
                "complianceScore",
                "termsScore",
                "completenessScore",
                "overallScore",
              ],
              properties: {
                proposalIndex: { type: Type.INTEGER },
                priceScore: { type: Type.INTEGER },
                complianceScore: { type: Type.INTEGER },
                termsScore: { type: Type.INTEGER },
                completenessScore: { type: Type.INTEGER },
                overallScore: { type: Type.INTEGER },
              },
            },
          },
        },
      },
    };

    const model = GEMINI_MODEL;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `You are an expert procurement analyst. Compare the following proposals against the RFP requirements and provide:
1. A comprehensive summary comparing all proposals
2. A recommendation for which vendor to choose
3. Reasoning for the recommendation
4. Scores for each proposal (0-100) based on:
   - Price competitiveness (lower is better, but consider value)
   - Compliance with requirements
   - Payment terms favorability
   - Completeness of response

RFP Requirements:
${rfpSummary}

Proposals:
${proposalsSummary}`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullResponse = "";
    for await (const chunk of response) {
      if (chunk.text) {
        fullResponse += chunk.text;
      } else if (typeof chunk === "string") {
        fullResponse += chunk;
      } else if (
        chunk.candidates &&
        chunk.candidates[0] &&
        chunk.candidates[0].content
      ) {
        const parts = chunk.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].text) {
          fullResponse += parts[0].text;
        }
      }
    }

    if (!fullResponse || fullResponse.trim() === "") {
      throw new Error("Empty response from Gemini API");
    }

    let jsonContent = fullResponse.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/g, "").trim();
    }

    const comparisonData = JSON.parse(jsonContent);

    return {
      success: true,
      data: comparisonData,
      tokensUsed: 0,
    };
  } catch (error) {
    console.error("AI Comparison Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response || "No response object",
    });
    throw new AppError(`Failed to generate comparison: ${error.message}`, 500);
  }
};
