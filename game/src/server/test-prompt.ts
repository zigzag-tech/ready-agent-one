export const PROMPT = `<s>[INST]
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
{"current":{"summary":"It is year 2300. In an alien planet, a group of astronauts went into a jungle and found a mysterious cave."},"sceneNumber":1,"recentHistory":[{"character":"guy","message":"Hey, what's that?","actions":[]},{"character":"jeremy","actions":[{"type":"operate","target":"lifeform detector"},{"type":"examine","target":"giant tree"}],"message":"Oh, a mysterious cave in the year 2300? Well, if I had a nickel for every alien jungle I've stumbled upon, I'd be richer than Croesus. Now, let me just operate this lifeform detector real quick and... hmm, nothing out of the ordinary here, folks! Oh, and that giant tree? It seems to be an ancient remnant from the dawn of time itself. Just goes to show you never know what secrets nature holds!"},{"character":"guy","actions":[{"type":"walk","destination":"morgan"},{"type":"examine","target":"giant tree"}],"message":"Oh wow, look at this giant tree! It's enormous and must be ancient. I wonder what secrets it holds? Let's explore the cave together, Morgan!"},{"character":"morgan","actions":[{"type":"walk","destination":"morgan"},{"type":"examine","target":"giant tree"},{"type":"run","destination":"cave"}],"message":"Wow, this jungle is fascinating! Let's not waste any time and dive into the cave. I wonder what secrets it holds! Also, that ancient tree has surely witnessed many incredible events over time."},{"character":"jeremy","actions":[{"type":"examine","target":"giant tree"},{"type":"operate","target":"lifeform detector"}],"message":"Well, this ancient tree has certainly seen some things! Let's keep exploring and see what other surprises the jungle holds for us. Oh, and watch out for any hidden dangers, guys!"},{"character":"guy","actions":[{"type":"examine","target":"giant tree"},{"type":"run","destination":"cave"}],"message":"Looking at this giant tree, I can't help but imagine all the stories it could tell if only it could speak. Let's run to that cave and discover its secrets together!"},{"character":"morgan","actions":[{"type":"examine","target":"giant tree"},{"type":"run","destination":"cave"}],"message":"The ancient tree does indeed evoke a sense of wonder and history. Let's run to the cave and uncover its secrets together, but be cautious as we never know what surprises lie ahead in this alien jungle."},{"character":"jeremy","actions":[{"type":"examine","target":"giant tree"},{"type":"operate","target":"lifeform detector"}],"message":"Ah, a mysterious cave and an ancient tree! I'm always up for exploring the unknown. Let's see what secrets this place holds. *examines the giant tree* This tree has been standing here for ages, it must have witnessed countless events over time. And speaking of events, let's see if our lifeform detector picks up anything interesting."},{"character":"guy","actions":[{"type":"examine","target":"giant tree"},{"type":"run","destination":"cave"}],"message":"Wow, this giant tree is incredible! It's so ancient and massive. I can't help but wonder about its stories and history. Let's head to the cave together and uncover more secrets!"},{"character":"morgan","actions":[{"type":"examine","target":"giant tree"},{"type":"run","destination":"cave"}],"message":"Oh, this ancient tree is simply breathtaking! It's hard not to imagine all the incredible stories it could tell if only it could speak. Let's run to that cave together and uncover its secrets, but let's also be cautious as we never know what surprises lie ahead in this alien jungle."},{"character":"jeremy","actions":[{"type":"examine","target":"giant tree"},{"type":"operate","target":"lifeform detector"}],"message":"Oh, this ancient tree is quite fascinating! It's a real testament to the resilience of nature and its capacity for standing the test of time. Let's keep exploring and see what else we can uncover."}],"totalNumOfLines":11}

VICINITY INFORMATION:
[{"type":"person","name":"morgan","description":"Morgan is prudent, courageous but could slip into self doubt from time to time. ","position":"1 meters ahead"},{"type":"person","name":"jeremy","description":"Jeremy has a sarcastic streak but deep down he's kind and helpful.","position":"2 meters ahead"},{"type":"person","name":"guy","description":"Guy is tring to acting helpful but he always messes things up.","position":"3 meters ahead"},{"type":"object","name":"cave","description":"A mysterious cave","position":"north"},{"type":"object","name":"small rock","description":"A small rock","position":"east"},{"type":"object","name":"giant tree","description":"An alien looking tree that is 10 meters tall","position":"south"},{"type":"object","name":"lifeform detector","description":"A device that can detect lifeforms.","position":"west"}]

ALLOWED ACTIONS:
{"type": "walk", "destination": "[sample_destination]"}
{"type": "jump" }
{"type": "examine", "target": "[sample_target]" }
{"type": "operate", "target": "[sample_target]" }
{"type": "punch", "target": "[sample_target]" }
{"type": "kick", "target": "[sample_target]" }
{"type": "run", "destination": "[sample_destination]" }

[/INST]`;
