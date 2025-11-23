import chalk from "chalk";

export type LogLevel = "info" | "warn" | "error" | "success";

export function createLogger(scope = "blobsea") {
  const prefix = chalk.blue(`[${scope}]`);

  return {
    info(message: string) {
      console.log(prefix, message);
    },
    warn(message: string) {
      console.warn(prefix, chalk.yellow(message));
    },
    error(message: string) {
      console.error(prefix, chalk.red(message));
    },
    success(message: string) {
      console.log(prefix, chalk.green(message));
    },
  };
}
