import { Message } from "ollama";

export const MESSAGES: Message[] = [
  {
    role: "system",
    content: `
Based on the context provided, fill in the following JSON schema with the subject's next action, thinking process, target, and message. Ensure that the action and message are coherent and logically follow from the context.

JSON Schema:
{
"subject": "Subject's name or identifier. Mandatory.",
"thinking": "What is the subject considering or thinking about?",
"action": "What is the subject's next action? Use one verb. Mandatory.",
"target": "Who or what is the target of the action? Provide coordinates in the format of "[x,y]" if applicable, otherwise null.",
"message": "What does the subject say or communicate next? Mandatory."
}
`,
  },
  {
    role: "user",
    content: `
CONTEXT:
Emily Loves cats. She is a cat lover and she is always surrounded by cats. 
Her cat is sick. 

OBJECTIVE:
Emily wants catch her cat and take it to the vet.

OBJECTS IN SCENE:
[
  {"type":"person","name":"emily","description":"Emily the cat lover.","position": {"x": 0, "y": 0}},
  {"type":"person","name":"cat","description":"A black cat.","position": {"x": 0, "y": 5}},
]

RECENT ACTIVITY LOG:
cat: [walk_to [0,0]]
cat: [talk] Meow!

SUBJECT NAME:
Emily

RESPONSE:
`,
  },
  {
    role: "assistant",
    content: `
${JSON.stringify(
  {
    subject: "emily",
    thinking: "I am so worried about the cat. Must get her to the vet soon.",
    action: "look_at",
    target: "cat",
    message: "Hey, kitty! You want some treats?",
  },
  null,
  2
)}
`,
  },
  {
    role: "user",
    content: `
CONTEXT:
Frodo encounters a green bear on his way to the mountain.

OBJECTIVE:
Frodo tries to get treasure from a legendary mountain.

OBJECTS IN SCENE:
[
  {"type":"person","name":"frodo","description":"Frodo the hobbit. Frodo loves adventures.","position": {"x": 3, "y": 2}},
  {"type":"person","name":"bear","description":"A hungry green bear.","position": {"x": 1, "y": 5}},
]


RECENT ACTIVITY LOG:
frodo: [walk_to [1,5]]
bear: [talk] Growl!
bear: [attack frodo]

SUBJECT NAME:
Frodo

RESPONSE:
`,
  },
  {
    role: "assistant",
    content: `
${JSON.stringify(
  {
    subject: "frodo",
    thinking: "Man that didn't work! This bear is distracting me from my goal.",
    action: "hide",
    target: null,
    message: "Oh no, the bear didn't die! I must hide!",
  },
  null,
  2
)}
`,
  },
  {
    role: "user",
    content: `
CONTEXT:
It is year 2300. In an alien planet, a group of astronauts went into a jungle and found a mysterious cave.

OBJECTIVE:
The group wants to find out the truth about the extinction of the Hulaloo species.

OBJECTS IN SCENE:
[
    {"type":"person","name":"morgan","description":"Morgan is prudent, courageous but could slip into self doubt from time to time. ","position":"1 meters ahead"},
    {"type":"person","name":"jeremy","description":"Jeremy has a sarcastic streak but deep down he's kind and helpful. ","position":"2 meters ahead"},
    {"type":"person","name":"guy","description":"Guy is tring to acting helpful but he always messes things up.","position":"3 meters ahead"},
    {"type":"object","name":"cave","description":"A mysterious cave","position":"north"},
    {"type":"object","name":"cave entrance","description": "A dark entrance to the cave.","position":"north"},
    {"type":"object","name":"small rock","description":"A small rock","position":"east"},
    {"type":"object","name":"giant tree","description":"An alien looking tree that is 10 meters tall","position":"south"},
    

RECENT ACTIVITY LOG:
[
    {"subject": "morgan", "action": "talk", "message": "Hey, what's that?" },
    {"subject": "jeremy", "action":"examine","target":"cave"},
    {"subject": "jeremy", "action":"talk", "message":"Oh, a mysterious cave in the year 2300? Well, if I had a nickel for every alien jungle I've stumbled upon, I'd be richer than Croesus. Now, let me just operate this lifeform detector real quick and... hmm, nothing out of the ordinary here, folks! Oh, and that giant tree? It seems to be an ancient remnant from the dawn of time itself. Just goes to show you never know what secrets nature holds!"},
    {"subject": "guy", "action":"walk","target":"morgan" },
    {"subject": "guy": "action": "talk", "message":"Morgan, you're in the way! Move it!"},
    {"subject":"morgan", "action": "examine", "target": "cave" },
    {    "subject":"morgan",
        "action": "talk",
        "message": "Jeremy, could you please give me some space to examine the cave properly?"
      },
      {
        "subject":"guy",
        "action": "examine",
        "target": "cave"
      },
      {
        "subject":"guy",
        "action": "talk",
        "message": "Hey guys, I think I found something over here!"
      }
]

SUBJECT NAME:
jeremy

RESPONSE:
    `,
  },
];


// SUBJECT ALLOWED ACTIONS:
// [
//     {"action": "walk", "target": "[sample_destination]"},
//     {"action": "jump" }
//     {"action": "examine", "target": "[sample_target]" }
//     {"action": "operate", "target": "[sample_target]" }
//     {"action": "punch", "target": "[sample_target]" }
//     {"action": "kick", "target": "[sample_target]" }
//     {"action": "run", "destination": "[sample_destination]" 
// }
/**
 subject: "jeremy",
 action: "walk",
 destination: "cave entrance",

 subject: "jeremy",
 action: "talk",
 message: "Team, follow me. Let's go into the cave.",

 Reason: Jeremy is the leader of the group and he is leading the team into the cave.
 */
