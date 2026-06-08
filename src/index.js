import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';
import config, { validateConfig } from './config.js';
import { logger } from './utils/logger.js';
import { runStage1 } from './stages/stage1-ocean.js';
import { runStage2 } from './stages/stage2-prospeo.js';
import { runStage3 } from './stages/stage3-eazyreach.js';
import { runStage4 } from './stages/stage4-brevo.js';

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const seedDomain = args[0];

  if (!seedDomain) {
    console.log(chalk.cyan.bold('\nOutreach Pipeline CLI'));
    console.log('Usage: npm start <domain>');
    console.log('Example: npm start stripe.com\n');
    process.exit(0);
  }

  validateConfig();

  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runFile = path.join(outputDir, `run_${seedDomain}_${timestamp}.json`);

  logger.info(`Starting pipeline run for ${logger.bold(seedDomain)}`);
  logger.divider();

  try {
    logger.step(1, 'Find Lookalike Companies (Ocean.io)');
    const lookalikes = await runStage1(seedDomain);
    
    if (lookalikes.length === 0) {
      logger.warn('No lookalike companies found. Exiting.');
      return;
    }

    logger.step(2, 'Find Decision-Makers (Prospeo)');
    const contacts = await runStage2(lookalikes);
    
    if (contacts.length === 0) {
      logger.warn('No contacts found. Exiting.');
      return;
    }

    logger.step(3, 'Resolve Email Addresses');
    const enrichedContacts = await runStage3(contacts);
    
    if (enrichedContacts.length === 0) {
      logger.warn('No verified emails found. Exiting.');
      return;
    }

    fs.writeFileSync(runFile, JSON.stringify({
      seedDomain,
      lookalikes,
      contacts: enrichedContacts,
      status: 'PENDING_CONFIRMATION'
    }, null, 2));
    
    logger.info(`Progress report saved to output/run_${seedDomain}_${timestamp}.json`);
    logger.divider();

    console.log(chalk.yellow.bold('\n--- Safety Checkpoint ---'));
    console.log(`Ready to send outreach emails to ${enrichedContacts.length} verified contact(s):`);
    
    enrichedContacts.forEach((c, idx) => {
      console.log(
        `  ${idx + 1}. ${chalk.bold(c.fullName)} (${c.title}) - ${chalk.green(c.email)} @ ${c.companyName}`
      );
    });

    console.log(chalk.gray(`\nSender: ${config.senderName} <${config.senderEmail}>`));
    console.log(chalk.gray('Template: partnership'));
    
    const confirmation = await askQuestion(
      chalk.yellow('\nDo you want to proceed and send these emails? (yes/no): ')
    );

    if (confirmation.trim().toLowerCase() !== 'yes') {
      logger.warn('Outreach cancelled. No emails were sent.');
      
      const data = JSON.parse(fs.readFileSync(runFile));
      data.status = 'CANCELLED';
      fs.writeFileSync(runFile, JSON.stringify(data, null, 2));
      return;
    }

    logger.step(4, 'Send Emails (Brevo)');
    const emailResults = await runStage4(enrichedContacts);

    const finalReport = {
      seedDomain,
      lookalikes,
      contacts: enrichedContacts,
      outreachStats: {
        sent: emailResults.sent,
        failed: emailResults.failed,
        details: emailResults.details
      },
      status: 'COMPLETED'
    };
    
    fs.writeFileSync(runFile, JSON.stringify(finalReport, null, 2));
    
    logger.divider();
    logger.success(`Pipeline executed successfully! Output saved to folder.`);
    logger.info(`Stats: Sent: ${emailResults.sent} | Failed: ${emailResults.failed}`);
    
  } catch (error) {
    logger.error(`Pipeline crashed: ${error.message}`);
    console.error(error.stack);
  }
}

main();
