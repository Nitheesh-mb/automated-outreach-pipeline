import axios from 'axios';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import { callWithRetry } from '../utils/rateLimiter.js';

export async function runStage1(seedDomain) {
  logger.info(`Searching for lookalikes of ${logger.highlight(seedDomain)} via Ocean.io...`);

  const apiCall = () => 
    axios.post(
      'https://api.ocean.io/v3/search/companiesDynamic',
      {
        size: 8,
        fields: ['domain', 'name', 'companySize', 'primaryCountry'],
        companiesFilters: {
          lookalikeDomains: [seedDomain]
        }
      },
      {
        headers: {
          'X-Api-Token': config.oceanApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

  try {
    const response = await callWithRetry(apiCall);
    const results = response.data?.results || [];
    
    const companies = results.map(item => ({
      domain: item.domain,
      name: item.name || item.domain,
      size: item.companySize || 'Unknown',
      country: item.primaryCountry || 'Unknown'
    })).filter(c => c.domain && c.domain !== seedDomain);

    logger.success(`Found ${companies.length} lookalike companies!`);
    companies.forEach((c, idx) => {
      logger.info(`  [${idx + 1}] ${c.name} (${c.domain}) - Size: ${c.size}`);
    });
    
    return companies;
  } catch (error) {
    logger.error(`Ocean.io search failed: ${error.message}`);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      logger.warn('Ocean.io API key is invalid/expired.');
    }
    
    // Fallback lookalike list to run the demo locally
    logger.warn('Using fallback lookalike list for the demo run.');
    const mockCompanies = [
      { domain: 'razorpay.com', name: 'Razorpay', size: '1000-5000', country: 'India' },
      { domain: 'checkout.com', name: 'Checkout.com', size: '1000-5000', country: 'United Kingdom' },
      { domain: 'adyen.com', name: 'Adyen', size: '1000-5000', country: 'Netherlands' },
      { domain: 'chargebee.com', name: 'Chargebee', size: '500-1000', country: 'India' }
    ];
    return mockCompanies.filter(c => c.domain !== seedDomain);
  }
}
