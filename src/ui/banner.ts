import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";

export function printBanner() {
  const title = figlet.textSync("Claude-Agent-CLI", { font: "Standard" });
  const panel = boxen(
    chalk.cyan("The Claude Agent SDK\n") +
      chalk.dim("Full Production Ready"),
    { padding: 1, borderColor: "cyan" },
  );

  console.log(title);
  console.log(panel);
}
