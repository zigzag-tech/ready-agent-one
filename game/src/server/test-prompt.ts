import { Message } from "ollama";

export const MESSAGES: Message[] = [
  {
    role: "system",
    content: `
You are a helpful assistant. Your job is to determine the next actions of the subject based on the context provided.

INSTRUCTIONS:
- Use each SUBJECT ALLOWED ACTIONS at most once per response. 
- Always include a "talk" action with a message in the response.
- Respond with ONLY the JSON and do NOT add any notes or comments.
- Think step by step and provide the most logical action for the subject.
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
    {"type":"person","name":"emily","description":"Emily the cat lover.","position":"5 meters ahead"},
    {"type":"person","name":"cat","description":"A black cat.","position":"2 meters ahead"}
]

RECENT ACTIVITY LOG:
[
    {"subject: "cat", "action":"walk", "target":"emily"},
    {"subject: "cat", "action":"talk", "message":"Meow."}
]

SUBJECT NAME:
Emily

SUBJECT ALLOWED ACTIONS:
[
  {"action": "walk", "target": "[sample_destination]"},
  {"action": "look_at", "target": "[sample_target]"},
  {"action": "feed", "target": "[sample_target]"},
  {"action": "talk", "message": "[sample_message]"}
]

SUBJECT NEXT ACTION(S):
`,
  },
  {
    role: "assistant",
    content: `
${JSON.stringify(
  {
    subject: "emily",
    reflection: "I am so worried about the cat. Must get her to the vet soon.",
    // intent: "I must catch the cat and take her to the vet.",
    actions: [
      {
        action: "look_at",
        target: "cat",
      },
      {
        action: "talk",
        message: "Hey, kitty! You want some treats?",
      },
    ],
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
    {"type":"person","name":"frodo","description":"Frodo the hobbit. Frodo loves adventures.","position":"33 meters ahead"},
    {"type":"person","name":"bear","description":"A hungry green bear.","position":"2 meters behind"},
]


RECENT ACTIVITY LOG:
[
    {"subject":"frodo", "action":"shoot", "target":"bear"},
    {"subject":"bear", "action":"talk", "message":"Growl!"},
    {"subject":"bear", "action":"attack","target":"frodo"},
]

SUBJECT NAME:
Frodo

SUBJECT ALLOWED ACTIONS:
[
    {"action": "shoot", "target": "[some_target]"},
    {"action": "attack", "target": "[some_target]"},
    {"action": "hide", "target": null },
    {"action": "talk", "message": "[sample_message]"}
]

SUBJECT NEXT ACTION(S):
`,
  },
  {
    role: "assistant",
    content: `
${JSON.stringify(
  {
    subject: "frodo",
    reflection:
      "Man that didn't work! This bear is distracting me from my goal.",
    // intent: "I must hide from the bear.",
    actions: [
      {
        action: "talk",
        message: "Oh no, the bear didn't die! I must hide!",
      },
      {
        action: "hide",
        target: null,
      },
    ],
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

SUBJECT ALLOWED ACTIONS:
[
    {"action": "walk", "target": "[sample_destination]"},
    {"action": "jump" }
    {"action": "examine", "target": "[sample_target]" }
    {"action": "operate", "target": "[sample_target]" }
    {"action": "punch", "target": "[sample_target]" }
    {"action": "kick", "target": "[sample_target]" }
    {"action": "run", "destination": "[sample_destination]" 
}

SUBJECT NEXT ACTION(S):
    `,
  },
];

/**
 subject: "jeremy",
 action: "walk",
 destination: "cave entrance",

 subject: "jeremy",
 action: "talk",
 message: "Team, follow me. Let's go into the cave.",

 Reason: Jeremy is the leader of the group and he is leading the team into the cave.
 */
