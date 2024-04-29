import { generateResponseOllamaByMessages } from "./generateResponseOllama";
import { MESSAGES } from "./test-prompt";

if (require.main === module) {
  (async () => {
    const response = await generateResponseOllamaByMessages(MESSAGES);
    console.log("========= Response: ==========");
    console.log(response);
  })();
}
