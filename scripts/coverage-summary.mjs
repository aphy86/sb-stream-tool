// Writes the Vitest coverage summary as a Markdown table into the GitHub Actions job summary.
import { appendFileSync, readFileSync } from "node:fs";
import { relative } from "node:path";

const summary = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf8"));
const pct = (m) => `${m.pct.toFixed(1)}%`;
const rows = Object.entries(summary)
  .filter(([file]) => file !== "total")
  .map(([file, m]) => `| \`${relative(process.cwd(), file)}\` | ${pct(m.statements)} | ${pct(m.branches)} | ${pct(m.functions)} | ${pct(m.lines)} |`);
const t = summary.total;
const md = [
  "## Unit test coverage",
  "",
  "| File | Statements | Branches | Functions | Lines |",
  "| --- | --- | --- | --- | --- |",
  ...rows,
  `| **Total** | **${pct(t.statements)}** | **${pct(t.branches)}** | **${pct(t.functions)}** | **${pct(t.lines)}** |`,
  "",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(md);
