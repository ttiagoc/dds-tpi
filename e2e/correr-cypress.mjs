import { spawnSync } from "node:child_process";

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const { status } = spawnSync("npx", ["cypress", ...process.argv.slice(2), ...(["run", "open"].includes(process.argv[2]) ? ["--project", "e2e"] : [])], {
  stdio: "inherit",
  shell: true,
  env,
});
process.exit(status ?? 1);
