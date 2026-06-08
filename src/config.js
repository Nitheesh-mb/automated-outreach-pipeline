import dotenv from 'dotenv';

dotenv.config();

const config = {
  oceanApiKey: process.env.OCEAN_API_KEY,
  prospeoApiKey: process.env.PROSPEO_API_KEY,
  brevoApiKey: process.env.BREVO_API_KEY,
  senderEmail: process.env.SENDER_EMAIL,
  senderName: process.env.SENDER_NAME
};

// Make sure everything is configured before running
export function validateConfig() {
  const missing = [];
  if (!config.oceanApiKey) missing.push('OCEAN_API_KEY');
  if (!config.prospeoApiKey) missing.push('PROSPEO_API_KEY');
  if (!config.brevoApiKey) missing.push('BREVO_API_KEY');
  if (!config.senderEmail) missing.push('SENDER_EMAIL');
  if (!config.senderName) missing.push('SENDER_NAME');

  if (missing.length > 0) {
    console.log('Error: Missing config in your .env file!');
    missing.forEach(field => {
      console.log(`- Need to add: ${field}`);
    });
    process.exit(1);
  }
}

export default config;
