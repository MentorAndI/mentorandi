import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  alias: {
    "@": process.cwd(),
  },
});

await jiti.import("../tests/mentor-display-name.test.ts");
await jiti.import("../tests/mentor-response-formatting.test.ts");
