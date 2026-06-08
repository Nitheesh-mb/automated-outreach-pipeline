import axios from 'axios';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import { callWithRetry, sleep } from '../utils/rateLimiter.js';
import { outreachTemplates } from '../templates/outreach.js';

export async function runStage4(contacts) {
  logger.info(`Sending outreach emails to ${contacts.length} recipients...`);
  
  const stats = { sent: 0, failed: 0, details: [] };

  for (const contact of contacts) {
    const templateData = outreachTemplates.partnership(contact);
    
    let htmlContent = templateData.htmlContent
      .replace('{{senderName}}', config.senderName)
      .replace('{{senderEmail}}', config.senderEmail);

    logger.info(`Sending email to ${logger.highlight(contact.fullName)} <${contact.email}>...`);

    const apiCall = () =>
      axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: config.senderName,
            email: config.senderEmail
          },
          to: [
            {
              email: contact.email,
              name: contact.fullName
            }
          ],
          subject: templateData.subject,
          htmlContent: htmlContent
        },
        {
          headers: {
            'api-key': config.brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

    try {
      const response = await callWithRetry(apiCall);
      logger.success(`  Sent! Message ID: ${response.data.messageId}`);
      stats.sent++;
      stats.details.push({
        name: contact.fullName,
        email: contact.email,
        status: 'SENT',
        messageId: response.data.messageId
      });
    } catch (error) {
      logger.error(`  Failed to send to ${contact.email}: ${error.message}`);
      
      if (error.response?.data?.message) {
        logger.error(`  Brevo response: ${error.response.data.message}`);
      }

      stats.failed++;
      stats.details.push({
        name: contact.fullName,
        email: contact.email,
        status: 'FAILED',
        error: error.message
      });
      
      if (error.response?.status === 400) {
        logger.warn('  Make sure SENDER_EMAIL is verified in your Brevo account dashboard.');
      }
    }

    await sleep(1000);
  }

  logger.success(`Outreach complete. Sent: ${stats.sent} | Failed: ${stats.failed}`);
  return stats;
}
