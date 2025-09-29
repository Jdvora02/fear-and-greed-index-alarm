const readline = require('readline');

const ACTS = [
  { name: 'Setup', tone: 'curiosity and fragile optimism' },
  { name: 'Confrontation', tone: 'surging tension and difficult choices' },
  { name: 'Resolution', tone: 'reckoning and courageous synthesis' }
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

class Character {
  constructor(config) {
    this.name = config.name;
    this.role = config.role;
    this.desire = config.desire;
    this.fear = config.fear;
    this.secret = config.secret;
    this.arc = config.arc;
    this.stageIndex = 0;
    this.id = slugify(this.name);
  }

  get currentStage() {
    return this.arc[this.stageIndex];
  }

  advanceArc() {
    if (this.stageIndex < this.arc.length - 1) {
      this.stageIndex += 1;
      return true;
    }
    return false;
  }

  getArcStatus() {
    const stage = this.currentStage;
    return `${this.name} — ${stage.title}: ${stage.summary}`;
  }

  getPitch() {
    return `${this.name}, ${this.role}, longs to ${this.desire}, yet fears ${this.fear}.`;
  }
}

class LiveBook {
  constructor(config) {
    this.title = config.title;
    this.theme = config.theme;
    this.setting = config.setting;
    this.mood = config.mood;
    this.maxChaptersPerAct = config.maxChaptersPerAct || 3;
    this.characters = config.characters.map((info) => new Character(info));
    this.actIndex = 0;
    this.chapter = 1;
    this.history = [];
    this.completed = false;
    this.epilogue = '';
  }

  get act() {
    return ACTS[this.actIndex];
  }

  isComplete() {
    return this.completed;
  }

  getIntroduction() {
    const header = `\n=== ${this.title} ===\nSetting: ${this.setting}\nTheme: ${this.theme}\nMood: ${this.mood}\n`;
    const pitches = this.characters
      .map((character) => ` • ${character.getPitch()}`)
      .join('\n');
    const guidance = `\nType the number of a choice to continue the live book.\nYou can also type 'summary', 'history', or 'quit'.\n`;
    return `${header}\nPrincipal Characters:\n${pitches}${guidance}`;
  }

  getChoices() {
    if (this.completed) {
      return [];
    }

    const sortedCharacters = [...this.characters].sort((a, b) => a.stageIndex - b.stageIndex);
    const characterOptions = sortedCharacters.slice(0, 2).map((character) => ({
      id: `character:${character.id}`,
      label: `Follow ${character.name} as they navigate ${character.currentStage.title.toLowerCase()}.`
    }));

    const worldOption = {
      id: 'world',
      label: `Listen to the city of ${this.setting} reveal a new facet.`
    };

    const twistLabel = this.actIndex < ACTS.length - 1
      ? 'Complicate the central tension that binds everyone together.'
      : 'Let the consequences of every choice crash together.';

    const twistOption = { id: 'twist', label: twistLabel };

    return [...characterOptions, worldOption, twistOption].slice(0, 4);
  }

  findCharacterByChoice(choiceId) {
    const [, slug] = choiceId.split(':');
    return this.characters.find((character) => character.id === slug);
  }

  generatePassage(choice) {
    if (this.completed) {
      return 'The book has already reached its cadence.';
    }

    const record = {
      act: this.actIndex + 1,
      actName: this.act.name,
      chapter: this.chapter,
      choice: choice.label,
      text: ''
    };

    const paragraphs = (() => {
      switch (choice.id) {
        case 'world':
          return this._generateWorldPassage();
        case 'twist':
          return this._generateTwistPassage();
        default:
          if (choice.id.startsWith('character:')) {
            const character = this.findCharacterByChoice(choice.id);
            return this._generateCharacterPassage(character);
          }
          return ['The narrative hesitates, unsure of the requested path.'];
      }
    })();

    record.text = paragraphs.join('\n\n');
    this.history.push(record);
    this._advanceStructure();

    if (this.completed) {
      this.epilogue = this._generateEpilogue();
    }

    return record.text;
  }

  getSummary() {
    const actLine = `Act ${this.actIndex + 1} — ${this.act.name} (Chapter ${this.chapter}, tone of ${this.act.tone}).`;
    const characterLines = this.characters.map((character) => ` • ${character.getArcStatus()}`).join('\n');
    return `${actLine}\n${characterLines}`;
  }

  getHistory(limit = 3) {
    if (this.history.length === 0) {
      return 'No pages have been discovered yet.';
    }
    const recent = this.history.slice(-limit);
    return recent
      .map((entry) => `Act ${entry.act}, Chapter ${entry.chapter} — ${entry.choice}\n${entry.text}`)
      .join('\n\n---\n\n');
  }

  _randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  _generateWorldPassage() {
    const sensations = [
      'shimmering conduits of light shimmer',
      'wind harps hum in sympathetic resonance',
      'floating gardens pulse with phosphorescent pollen',
      'clockwork gulls sketch elaborate sigils across the clouds'
    ];
    const witnesses = this.characters.map((character) => character.name);
    const paragraphs = [
      `The city of ${this.setting} exhales through ${this.act.tone}. Overhead, ${this._randomChoice(sensations)}, folding the skyline into fresh geometry.`,
      `Citizens pause, and even ${this._randomChoice(witnesses)} senses the quiet adjustment. The world itself is annotating the margins of the tale, reminding every traveler that the setting is a collaborator, not a backdrop.`,
      `The theme of ${this.theme.toLowerCase()} gains a new verse as the architecture replies to the people's heartbeat, inviting the reader to linger within the evolving atlas.`
    ];
    return paragraphs;
  }

  _generateTwistPassage() {
    const first = this._randomChoice(this.characters);
    let second = this._randomChoice(this.characters.filter((character) => character.id !== first.id));
    if (!second) {
      second = first;
    }

    const catalysts = [
      'an unexpected breach of protocol',
      'a relic illuminated by auroral fire',
      'a sudden collapse of a light-bridge',
      'a memory thread unspooling in public'
    ];
    const catalyst = this._randomChoice(catalysts);

    const paragraphs = [
      `${first.name} and ${second.name} collide beneath a sky trembling with ${this.act.tone}. Between them hangs ${catalyst}, forcing them to reveal priorities sharpened by the storm season.`,
      `${first.name} leans into hard-earned instincts while ${second.name} weighs the cost of silence. Their choices braid together, tightening the weave of ${this.theme.toLowerCase()}.`,
      `The chapter ends with the city tilting ever so slightly, promising that every heartbeat will be counted when the reckoning arrives.`
    ];
    return paragraphs;
  }

  _generateCharacterPassage(character) {
    const beforeStage = character.currentStage;
    const progressed = character.advanceArc();
    const afterStage = character.currentStage;

    const reflections = [
      'starlight refracts through crystal rain',
      'choruses of gliders echo between suspended plazas',
      'the chronometers shudder, counting breaths instead of seconds',
      'an auroral tide sketches promises across the horizon'
    ];

    const paragraphs = [
      `${character.name} threads through ${this.setting}, remembering that ${beforeStage.summary.toLowerCase()}. The air tastes like ${this.act.tone}, coaxing dormant hopes awake.`,
      progressed
        ? `${character.name} steps into ${afterStage.title.toLowerCase()}, ${afterStage.summary.toLowerCase()}. The choice feels irreversible, yet necessary.`
        : `${character.name} circles the cusp of ${afterStage.title.toLowerCase()}, unable to move beyond the gravity of expectation.`,
      `Above, ${this._randomChoice(reflections)}, and the theme of ${this.theme.toLowerCase()} sharpens. The reader feels the page writing itself, propelled by ${character.name}'s evolving arc.`
    ];

    return paragraphs;
  }

  _advanceStructure() {
    if (this.chapter >= this.maxChaptersPerAct) {
      if (this.actIndex >= ACTS.length - 1) {
        this.completed = true;
        return;
      }
      this.actIndex += 1;
      this.chapter = 1;
      return;
    }
    this.chapter += 1;
  }

  _generateEpilogue() {
    const arcClosures = this.characters
      .map((character) => `${character.name} resolves within ${character.currentStage.title}, ${character.currentStage.summary.toLowerCase()}.`)
      .join(' ');
    return `\nEpilogue — The living book settles. ${arcClosures} Together they prove that ${this.theme.toLowerCase()} can carry a city beyond the storm.`;
  }
}

const defaultConfig = {
  title: 'Aurora in Motion',
  theme: 'Interdependence and the courage to rewrite inherited destinies',
  setting: 'Ilyrion, a chain of skyborne districts linked by singing light-bridges',
  mood: 'lyrical science fantasy humming with anticipation',
  maxChaptersPerAct: 3,
  characters: [
    {
      name: 'Mira Solace',
      role: 'a cartographer of auroral currents',
      desire: 'map a stable path through the storm season before the bridges shear apart',
      fear: 'that a single miscalculation will send an entire district plummeting',
      secret: 'she once erased part of a map to protect her sister from a dangerous expedition',
      arc: [
        {
          title: 'Cartographer of Light',
          summary: 'she charts the shimmering coordinates that keep the archipelago afloat'
        },
        {
          title: 'Facing the Blank Zones',
          summary: 'she confronts the purposeful gaps left by generations who feared what the aurora might reveal'
        },
        {
          title: 'Sharing the Atlas',
          summary: 'she invites her allies to help draw a living map that responds to every heart in the city'
        }
      ]
    },
    {
      name: 'Jonas Vale',
      role: 'a conductor of memory threads',
      desire: "synchronize the city's communal memories into a single guiding melody",
      fear: 'that the discord he hides will fracture his carefully tuned harmonies',
      secret: 'he siphons fragments of forgotten songs to keep his own grief muted',
      arc: [
        {
          title: 'Curator of Echoes',
          summary: 'he braids together the recollections that keep the populace emotionally aligned'
        },
        {
          title: 'Discordant Interruption',
          summary: 'he admits that his orchestration silences dissent and must be unbound'
        },
        {
          title: 'Resonant Conductor',
          summary: 'he conducts a chorus that includes every fractured voice without dissolving the harmony'
        }
      ]
    },
    {
      name: 'Eira Quell',
      role: 'an engineer of tether engines',
      desire: 'stabilize the failing core reactor before storm season peaks',
      fear: 'that the system will expose her childhood sabotage meant to free a trapped district',
      secret: 'she once severed a tether to liberate her neighborhood from corporate oversight',
      arc: [
        {
          title: 'Guardian of the Tethers',
          summary: 'she patches the machinery that anchors each district to the aurora currents'
        },
        {
          title: 'Reckoning with Sabotage',
          summary: 'she confronts how her rebellion weakened the very systems she now protects'
        },
        {
          title: 'Architect of Trust',
          summary: 'she invites the citizens to co-design the engines, sharing the burden of stewardship'
        }
      ]
    }
  ]
};

async function runCli() {
  const book = new LiveBook(defaultConfig);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (prompt) => new Promise((resolve) => rl.question(prompt, (answer) => resolve(answer.trim())));

  console.log(book.getIntroduction());

  while (!book.isComplete()) {
    const choices = book.getChoices();
    console.log(`\nAct ${book.actIndex + 1}: ${book.act.name} — Chapter ${book.chapter}`);
    choices.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.label}`);
    });
    console.log("Type the number of a choice, or 'summary', 'history', or 'quit'.");

    const answer = (await ask('> ')).toLowerCase();

    if (answer === 'quit') {
      console.log('The living book closes for now.');
      rl.close();
      return;
    }

    if (answer === 'summary') {
      console.log(`\n${book.getSummary()}`);
      continue;
    }

    if (answer === 'history') {
      console.log(`\n${book.getHistory()}`);
      continue;
    }

    const choiceIndex = Number.parseInt(answer, 10) - 1;
    if (Number.isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= choices.length) {
      console.log('The page ripples, asking for a valid direction.');
      continue;
    }

    const selection = choices[choiceIndex];
    const passage = book.generatePassage(selection);
    console.log(`\n${passage}\n`);
  }

  rl.close();
  if (book.epilogue) {
    console.log(book.epilogue);
  }
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error('The live book stumbled:', error);
    process.exit(1);
  });
}

module.exports = { LiveBook, Character, defaultConfig };
