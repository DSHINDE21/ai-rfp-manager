import { simpleParser } from 'mailparser';

/**
 * Parse email content from raw email source
 */
export const parseEmail = async (emailSource) => {
  try {
    const parsed = await simpleParser(emailSource);
    
    return {
      subject: parsed.subject || '',
      from: parsed.from?.text || parsed.from?.value?.[0]?.address || '',
      body: parsed.text || '',
      html: parsed.html || '',
      attachments: parsed.attachments || []
    };
  } catch (error) {
    console.error('Email parsing error:', error);
    throw new Error(`Failed to parse email: ${error.message}`);
  }
};

/**
 * Extract RFP ID from email subject or body
 * Format: RFP-{timestamp}-{random}
 */
export const extractRFPId = (subject, body) => {
  const subjectMatch = subject.match(/RFP-[A-Za-z0-9-]+/);
  if (subjectMatch) {
    return subjectMatch[0];
  }

  const bodyMatch = body.match(/RFP-[A-Za-z0-9-]+/);
  if (bodyMatch) {
    return bodyMatch[0];
  }

  return null;
};
