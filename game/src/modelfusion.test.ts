import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { Ollama } from "ollama";
// const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
// const ollama = new Ollama({ host: OLLAMA_HOST });

import {
  generateObject,
  jsonObjectPrompt,
  ollama,
  zodSchema,
  api,
} from "modelfusion";
import { z } from "zod";
import { actionSchema } from "./common/gameStateSchema";
const ollamaApi = ollama.Api({
  // baseUrl: {
  //   port: "12345",
  // },
  // ...
  retry: api.retryWithExponentialBackoff({
    maxTries: 8,
    initialDelayInMs: 1000,
    backoffFactor: 2,
  }),
});

const generateActions = () =>
  generateObject({
    model: ollama

      .ChatTextGenerator({
        api: ollamaApi,
        model: "llama2",
        temperature: 0.8,
      })
      .asObjectGenerationModel(jsonObjectPrompt.text()),

    schema: zodSchema(
      z.object({
        actions: actionSchema,
      })
    ),

    prompt: `<s>[INST]
You are a helpful assistant. Your job is to use the provided CHARACTER NAME, CHARACTER DESCRIPTION, CONTEXT, VICINITY INFORMATION, ALLOWED ACTIONS to return an array of one or more enriched actions from the ALLOWED ACTIONS.
Use each ALLOWED ACTIONS at most once per response. Respond with ONLY the JSON and do NOT add any notes or comments.
CHARACTER NAME:
Emily

CHARACTER DESCRIPTION:
Emily is a cat lover.

CONTEXT:
{"current":{"summary":"Emily Loves cats. She is a cat lover and she is always surrounded by cats."},"recentHistory":[{"character":"cat","actions":[{"type":"walk","destination":"emily"}]}]}

VICINITY INFORMATION:
[{"type":"person","name":"emily","description":"Emily the cat lover.","position":"5 meters ahead"},{"type":"person","name":"cat","description":"A black cat.","position":"2 meters ahead"}]

ALLOWED ACTIONS:
{"type": "walk", "destination": "[sample_destination]"}
{"type": "pet", "target": "[sample_target]"}

The above example would output the following json:
[/INST]
{
  "actions": [
    {
      "type": "pet",
      "target": "cat"
    }
  ],
  "reason": "Emily responds to the cat's presence with a friendly greeting."
}</s>

<s>[INST]CHARACTER NAME:
Frodo

CHARACTER DESCRIPTION:
Frodo is a hobbit that loves adventures.

CONTEXT:
{"current":{"summary":"Frodo encounters a green bear on his way to the mountain."},"recentHistory":[{"character":"frodo","actions":[{"type":"shoot","target":"bear"}]},{"character":"bear","actions":[{"type":"attack","target":"frodo"}]}]}

VICINITY INFORMATION:
[{"type":"person","name":"frodo","description":"Frodo the hobbit.","position":"33 meters ahead"},{"type":"person","name":"bear","description":"A hungry green bear.","position":"2 meters behind"}]

ALLOWED ACTIONS:
{"type": "shoot", "target": "[sample_target]"}
{"type": "attack", "target": "[sample_target]"}
{"type": "hide"}

The above example would output the following json:
[/INST]
{
  "actions": [
    {
      "type": "hide"
    }
  ],
  "reason": "Frodo is in trouble and he expresses his fear by hiding."
}</s>
[INST]
CHARACTER NAME:
guy

CHARACTER DESCRIPTION:
Guy is tring to acting helpful but he always messes things up.

CONTEXT:
{"current":{"summary":"It is year 2300. In the outer space, three astronauts are about to run out of oxygen. They are trying to fix the oxygen tank."},"sceneNumber":1,"recentHistory":[{"character":"guy","message":"What the hell is going on with the oxygen indicator?","actions":[]},{"character":"jeremy","actions":[{"type":"examine","target":"control panel"},{"type":"operate","target":"red button"}],"message":"Oh, the oxygen indicator? Allow me to take a look."},{"character":"guy","actions":[{"type":"walk","destination":"guy"},{"type":"examine","target":"control panel"}],"message":"Can you, like, help me understand what's going on with the oxygen indicator? I'm not sure how to read it."},{"character":"morgan","actions":[{"type":"examine","target":"control panel"},{"type":"run","destination":"guy"}],"message":"Let me take a look at that control panel. And hey, don't worry. I think we can figure this out together."},{"character":"jeremy","actions":[{"type":"examine","target":"control panel"},{"type":"operate","target":"red button"}],"message":"Hmm, let me take a look at this control panel first. Alright, I'll give this red button a try."},{"character":"guy","actions":[{"type":"examine","target":"control panel"},{"type":"jump"}],"message":"Hmm, let's see...what does this do? And wait, where did I put my spacesuit?"},{"character":"morgan","actions":[{"type":"examine","target":"control panel"},{"type":"jump"}],"message":"Hmm, let's see...what does this do? And wait, where did I put my spacesuit?"},{"character":"jeremy","actions":[{"type":"examine","target":"control panel"},{"type":"operate","target":"red button"}],"message":"Alright, let me take a look at this control panel first. And hey, don't worry. I think we can figure this out together."},{"character":"guy","actions":[{"type":"examine","target":"control panel"},{"type":"walk","destination":"morgan"}],"message":"Can you help me understand what's going on with the oxygen indicator, Morgan?"},{"character":"morgan","actions":[{"type":"examine","target":"control panel"},{"type":"operate","target":"green button"}],"message":"Let's see...what does this do? And hey, don't worry. I think we can figure this out together."},{"character":"jeremy","actions":[{"type":"examine","target":"control panel"},{"type":"operate","target":"red button"}],"message":"Alright, let me take a look at this control panel first. And hey, don't worry. I think we can figure this out together."},{"character":"guy","actions":[{"type":"examine","target":"control panel"},{"type":"examine","target":"red button"},{"type":"examine","target":"green button"}],"message":"Alright, let's see...what does this do? And hey, don't worry. I think we can figure this out together."},{"character":"morgan","actions":[{"type":"examine","target":"control panel"},{"type":"run","destination":"morgan"}],"message":"Morgan, let's take a look at the control panel together. I think we can figure this out."},{"character":"jeremy","actions":[{"type":"examine","target":"control panel"},{"type":"operate","target":"red button"}],"message":"Alright, let me take a look at this control panel first. And hey, don't worry. I think we can figure this out together."}],"totalNumOfLines":14}

VICINITY INFORMATION:
[{"type":"person","name":"morgan","description":"Morgan is prudent, courageous but could slip into self doubt from time to time. ","position":"1 meters ahead"},{"type":"person","name":"jeremy","description":"Jeremy has a sarcastic streak but deep down he's kind and helpful.","position":"2 meters ahead"},{"type":"person","name":"guy","description":"Guy is tring to acting helpful but he always messes things up.","position":"3 meters ahead"},{"type":"object","name":"wrench","description":"A rusty wrench.","position":"10 meters north"},{"type":"object","name":"control panel","description":"A control panel.","position":"3 meters ahead"},{"type":"object","name":"red button","description":"A red button that says 'LAUNCH'","position":"control panel"},{"type":"object","name":"green button","description":"A green button that says 'RELAX MAN'","position":"control panel"},{"type":"object","name":"yellow button","description":"A yellow button that says 'BANANAS'","position":"control panel"},{"type":"object","name":"duct tape","description":"roll of duct tape.","position":"on the floor"},{"type":"object","name":"exit sign","description":"A sign that says 'EXIT' with an arrow pointing to the right.","position":"5 meters south"},{"type":"object","name":"oxygen tank","description":"A large oxygen tank.","position":"7 meters ahead"}]

ALLOWED ACTIONS:
{"type": "walk", "destination": "[sample_destination]"}
{"type": "jump" }
{"type": "examine", "target": "[sample_target]" }
{"type": "operate", "target": "[sample_target]" }
{"type": "punch", "target": "[sample_target]" }
{"type": "kick", "target": "[sample_target]" }
{"type": "run", "destination": "[sample_destination]" }

[/INST]
`,
  });

async function main() {
  const r = await generateActions();
  console.log(r);
}

main().catch(console.error);
