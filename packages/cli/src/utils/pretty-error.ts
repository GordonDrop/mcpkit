import chalk from 'chalk';

export function printError(err: unknown, label?: string): void {
  const prefix = label ? `[${label}]` : '[Error]';

  if (err instanceof Error) {
    console.error(chalk.red(`${prefix} ${err.message}`));

    if (err.stack) {
      const stackLines = err.stack.split('\n').slice(1);
      for (const line of stackLines) {
        console.error(chalk.gray(`  ${line.trim()}`));
      }
    }
  } else if (typeof err === 'string') {
    console.error(chalk.red(`${prefix} ${err}`));
  } else {
    console.error(chalk.red(`${prefix} Unknown error occurred`));
    console.error(chalk.gray(`  ${String(err)}`));
  }

  console.error();
}
