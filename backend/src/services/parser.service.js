import Proposal from '../models/Proposal.js';
import { parseProposalResponse } from './ai.service.js';
import { extractPDFText } from '../utils/pdfParser.js';

/**
 * Parse a proposal and update it with extracted data
 */
export const parseProposal = async (proposalId) => {
  try {
    const proposal = await Proposal.findById(proposalId)
      .populate('rfpId')
      .populate('vendorId');
    
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const attachments = [];
    for (const attachment of proposal.attachments || []) {
      if (attachment.contentType === 'application/pdf' && attachment.content) {
        try {
          const extractedText = await extractPDFText(attachment.content);
          attachments.push({
            ...attachment.toObject(),
            extractedText
          });
        } catch (error) {
          console.error('Error extracting PDF text:', error);
          attachments.push(attachment);
        }
      } else {
        attachments.push(attachment);
      }
    }

    const parseResult = await parseProposalResponse(
      proposal.emailContent,
      attachments
    );

    proposal.extractedData = parseResult.data;
    proposal.status = 'parsed';
    proposal.parsingError = null;

    await proposal.save();

    return {
      success: true,
      data: proposal,
      tokensUsed: parseResult.tokensUsed
    };
  } catch (error) {
    const proposal = await Proposal.findById(proposalId);
    if (proposal) {
      proposal.status = 'pending';
      proposal.parsingError = error.message;
      await proposal.save();
    }

    throw error;
  }
};
