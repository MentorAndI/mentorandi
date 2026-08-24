import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  alias: {
    "@": process.cwd(),
  },
});

await jiti.import("../tests/crisis-safety.test.ts");
