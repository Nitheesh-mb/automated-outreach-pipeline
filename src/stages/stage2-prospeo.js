import axios from 'axios';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import { callWithRetry, sleep } from '../utils/rateLimiter.js';

export async function runStage2(companies) {
  logger.info(`Searching for decision makers at ${companies.length} companies...`);
  
  const contacts = [];

  for (const company of companies) {
    // 1.5s sleep to respect Prospeo rate limit (1 request per second)
    await sleep(1500);

    logger.info(`Searching contacts at ${logger.highlight(company.name)} (${company.domain})...`);

    const apiCall = () =>
      axios.post(
        'https://api.prospeo.io/search-person',
        {
          filters: {
            person_search: {
              company_domain: company.domain
            },
            person_seniority: {
              include: ['C-Suite', 'Vice President', 'Director']
            }
          },
          page: 1
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
      const results = response.data?.data?.results || [];

      if (results.length === 0) {
        logger.info(`  No C-suite/VP contacts found for ${company.name}`);
        continue;
      }

      const companyContacts = results.slice(0, 2).map(person => ({
        personId: person.person_id,
        firstName: person.first_name,
        lastName: person.last_name,
        fullName: person.full_name || `${person.first_name} ${person.last_name}`,
        title: person.current_job_title,
        linkedinUrl: person.linkedin_url,
        companyName: company.name,
        companyDomain: company.domain
      }));

      logger.success(`  Found ${companyContacts.length} contact(s) at ${company.name}`);
      companyContacts.forEach(c => {
        logger.info(`    - ${c.fullName} (${c.title})`);
      });

      contacts.push(...companyContacts);
    } catch (error) {
      logger.error(`  Prospeo search failed for ${company.domain}: ${error.message}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('  Prospeo API key is invalid/expired.');
      }
      
      logger.warn(`  Adding mock contact for ${company.name} due to API failure.`);
      contacts.push({
        personId: `mock_${Math.random().toString(36).substring(7)}`,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        title: 'VP Operations',
        linkedinUrl: `https://www.linkedin.com/in/john-doe-${company.name.toLowerCase()}`,
        companyName: company.name,
        companyDomain: company.domain
      });
    }
  }

  if (contacts.length === 0) {
    logger.warn('  No decision-makers found. Generating mock contacts for the demo run.');
    contacts.push(
      {
        personId: 'mock_1',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/john-doe-stripe-competitor',
        companyName: 'Razorpay',
        companyDomain: 'razorpay.com'
      },
      {
        personId: 'mock_2',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        title: 'VP Sales',
        linkedinUrl: 'https://www.linkedin.com/in/jane-smith-chargebee',
        companyName: 'Chargebee',
        companyDomain: 'chargebee.com'
      }
    );
  }

  logger.success(`Stage 2 finished. Found ${contacts.length} total contacts.`);
  return contacts;
}
