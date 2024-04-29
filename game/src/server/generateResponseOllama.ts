import { Message, Ollama } from "ollama";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const ollama = new Ollama({ host: OLLAMA_HOST });
// export const CONVO_MODEL = "command-r";
export const CONVO_MODEL_LLAMA3 = "llama3:instruct";
// export const CONVO_MODEL = "starling-lm";

// export async function generateResponseOllama(prompt: string) {
//   try {
//     const response = await ollama.chat({
//       options: {
//         temperature: 1.2,
//       },
//       stream: true,
//       format: "json",
//       model: CONVO_MODEL,
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//     });
//     let message = "";
//     process.stdout.write("Response:  ");
//     // console.log("Response:  ");
//     for await (const part of response) {
//       process.stdout.write(
//         part.message.content.replace("\n", " ").replace("\r", " ")
//       );
//       message += part.message.content;
//     }
//     // erase all of what was written
//     // Move the cursor to the beginning of the line
//     process.stdout.write("\r");
//     process.stdout.write("\r\n");
//     // Clear the entire line
//     process.stdout.write("\x1b[2K");
//     return message;
//   } catch (e) {
//     console.log(e);
//     // await sleep(200);
//     return null;
//   }
// }

export async function generateResponseOllamaByMessages(messages: Message[]) {
  try {
    const response = await ollama.chat({
      options: {
        temperature: 1.2,
      },
      stream: true,
      model: CONVO_MODEL_LLAMA3,
      messages,
    });
    let message = "";
    process.stdout.write("Response:  ");
    // console.log("Response:  ");
    for await (const part of response) {
      process.stdout.write(
        part.message.content.replace("\n", " ").replace("\r", " ")
      );
      message += part.message.content;
    }
    // erase all of what was written
    // Move the cursor to the beginning of the line
    process.stdout.write("\r");
    process.stdout.write("\r\n");
    // Clear the entire line
    process.stdout.write("\x1b[2K");
    return message;
  } catch (e) {
    console.log(e);
    // await sleep(200);
    return null;
  }
}
