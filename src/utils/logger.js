import chalk from 'chalk';

// Simple logger so we don't have to write chalk in every single file
export const logger = {
  info: (msg) => console.log(chalk.blue('[INFO] ') + msg),
  success: (msg) => console.log(chalk.green('[SUCCESS] ') + msg),
  warn: (msg) => console.log(chalk.yellow('[WARNING] ') + msg),
  error: (msg) => console.log(chalk.red('[ERROR] ') + msg),
  
  step: (number, title) => {
    console.log('\n' + chalk.cyan.bold(`--- Stage ${number}: ${title} ---`));
  },
  
  divider: () => console.log(chalk.gray('--------------------------------------------------')),
  highlight: (msg) => chalk.yellow(msg),
  bold: (msg) => chalk.bold(msg)
};
