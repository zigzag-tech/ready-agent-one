import { generateResponseOllama } from "./generateResponseOllama";
import { PROMPT } from "./test-prompt";

if (require.main === module) {
  (async () => {
    const response = await generateResponseOllama(PROMPT);
    console.log("========= Response: ==========");
    console.log(response);
  })();
}
