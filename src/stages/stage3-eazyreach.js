import axios from 'axios';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import { callWithRetry, sleep } from '../utils/rateLimiter.js';

export async function runStage3(contacts) {
  logger.info(`Resolving email addresses for ${contacts.length} contacts...`);
  logger.warn('Skipping Eazyreach (no public API). Using Prospeo enrichment instead.');

  const resolvedContacts = [];

  for (const contact of contacts) {
    await sleep(1500);

    logger.info(`Resolving email for ${logger.highlight(contact.fullName)} at ${contact.companyName}...`);

    if (contact.personId.startsWith('mock_')) {
      const email = `${contact.firstName.toLowerCase()}.${contact.lastName.toLowerCase()}@${contact.companyDomain}`;
      resolvedContacts.push({
        ...contact,
        email: email,
        emailStatus: 'verified (mocked)'
      });
      logger.success(`  Resolved email (mocked): ${email}`);
      continue;
    }

    const apiCall = () =>
      axios.post(
        'https://api.prospeo.io/enrich-person',
        {
          person_id: contact.personId
        },
        {
          headers: {
            'X-KEY': config.prospeoApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

    try {
      const response = await callWithRetry(apiCall);
      const personData = response.data?.data?.person || {};
      
      const email = personData.email;
      const emailStatus = personData.email_status;

      if (!email) {
        logger.warn(`  No email found for ${contact.fullName}. Skipping...`);
        continue;
      }

      if (emailStatus !== 'verified' && emailStatus !== 'catch-all') {
        logger.warn(`  Email found (${email}) but status is ${emailStatus}. Skipping...`);
        continue;
      }

      logger.success(`  Resolved email: ${email} (${emailStatus})`);
      resolvedContacts.push({
        ...contact,
        email,
        emailStatus
      });
    } catch (error) {
      logger.error(`  Email resolving failed for ${contact.fullName}: ${error.message}`);
      
      const email = `${contact.firstName.toLowerCase()}@${contact.companyDomain}`;
      logger.warn(`  Using fallback email: ${email}`);
      resolvedContacts.push({
        ...contact,
        email,
        emailStatus: 'fallback'
      });
    }
  }

  logger.success(`Resolved ${resolvedContacts.length} total emails.`);
  return resolvedContacts;
}
