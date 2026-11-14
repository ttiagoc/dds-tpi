import { fileURLToPath } from "node:url";
import concurrently from "concurrently";

const API_URL = "http://localhost:3000";
const carpeta = (nombre) => fileURLToPath(new URL(`../${nombre}`, import.meta.url));

const { result } = concurrently(
  [
    {
      name: "back",
      command: "npm start",
      cwd: carpeta("backend"),
      env: { NODE_ENV: "test" },
      prefixColor: "blue",
    },
    {
      name: "web",
      command: "npx expo start --web",
      cwd: carpeta("frontend"),
      env: { EXPO_PUBLIC_API_URL: API_URL, BROWSER: "none" },
      prefixColor: "magenta",
    },
  ],
  { killOthersOn: ["failure", "success"] },
);

result.then(
  () => process.exit(0),
  () => process.exit(1),
);
