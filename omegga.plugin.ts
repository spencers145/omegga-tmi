import { OmeggaPlugin, OL, PC, PS, OmeggaPlayer, BrickInteraction, BRColor } from "omegga/dist";

type Weapon = string;
type PlayerID = string;

type PlayerInteraction = {
  id: string;
  name: string;
  controller: string;
  pawn: string;
}

export default class basesCoolPlugin implements OmeggaPlugin {
  omegga: OL;
  config: Record<string, any>;
  store: PS;

  roleLastGiven: Record<PlayerID, number>;
  commands: Record<string, string>;
  disruptiveCommands: Record<string, string>;
  customCommands: Record<string, string>;
  weapons: Array<Weapon>;

  debounceNames: Record<PlayerID, PlayerInteraction>;
  playerCallbacks: Record<PlayerID, Record<string, number>>;
  playerIntervals: Record<PlayerID, Record<string, number>>;

  seasonings: Record<PlayerID, Array<string>>;

  eggs: Array<string>;
  microeggs: Array<string>;

  constructor(omegga: OL, config: PC, store: PS) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    this.roleLastGiven = {};
    this.commands = {
      hurt: "Hurts the interactor for an <i>amount</i>. Negatives heal. USAGE: tmi.hurt:<i>amount</i>",
      kill: "Kills the interactor. USAGE: tmi.kill",
      lottery: "Has a percent <i>chance</i> to kill the interactor. USAGE: tmi.lottery:<i>chance</i>",
      unexist: "Teleports the interactor to the death barrier. USAGE: tmi.unexist",
      tell: "Tells a <i>message</i> to a <i>player</i>. USAGE: tmi.tell:<i>player</i>,<i>message</i>",
      whisper: "Whispers a <i>message</i> to the interactor. USAGE: tmi.whisper:<i>message</i>",
      giveitem: "Gives a <i>weapon</i> some amount of <i>times</i>. USAGE: tmi.giveitem:<i>weapon</i>,<i>times</i>",
      takeitem: "Remove a <i>weapon</i> some amount of <i>times</i>. USAGE: tmi.takeitem:<i>weapon</i>,<i>times</i>",
      goto: "Teleports the interactor to a specified <i>player</i>. USAGE: tmi.goto:<i>player</i>",
      tp: "Teleports the interactor to position <i>x</i> <i>y</i> <i>z</i>. USAGE: tmi.tp:<i>x</i>,<i>y</i>,<i>z</i>",
      relativetp: "Teleports the interactor from their position, offset by <i>x</i> <i>y</i> <i>z</i>. USAGE: tmi.relativetp:<i>x</i>,<i>y</i>,<i>z</i>",
      swapcolor: "Grants a <i>color</i> role to the player, or swaps it with their previous choice. USAGE: tmi.swapcolor:<i>color</i>",
      givecolor: "Adds a <i>color</i> to the interactor's inventory. USAGE: tmi.givecolor:<i>color</i>"
      //scatter: "",
      //scorecommandsandstuff: ""
    };
    this.disruptiveCommands = {
      broadcast: "<b>Disruptive.</b> Broadcasts a <i>message</i>. USAGE: tmi.broadcast:<i>message</i>",
      fetch: "<b>Disruptive.</b> Teleports a specified <i>player</i> to the brick. USAGE: tmi.fetch:<i>player</i>",
      jail: "<b>Disruptive.</b> Prevents the interactor from moving for some <i>time</i> in seconds. USAGE: tmi.jail:<i>time</i>",
      killother: "<b>Disruptive.</b> Kills a specified <i>player</i>. USAGE: tmi.killother:<i>player</i>",
      killall: "<b>Disruptive.</b> Kills all players. USAGE: tmi.killall",
      hurtall: "<b>Disruptive.</b> Hurts all players for an <i>amount</i>. USAGE: tmi.hurtall:<i>amount</i>",
      killhost: "<b>Disruptive.</b> Small chance to kill the host, large chance to kill the interactor. USAGE: tmi.killhost",
      annoyhost: "<b>Disruptive.</b> Chance to deal damage to the host. Deals damage to the interactor too. USAGE: tmi.annoyhost",
      grantrole: "<b>Disruptive.</b> Grants <i>role</i> to the interactor. USAGE: tmi.grantrole:<i>role</i>",
      revokerole: "<b>Disruptive.</b> Revokes <i>role</i> from the interactor. USAGE: tmi.revokerole:<i>role</i>",
      togglerole: "<b>Disruptive.</b> Grants <i>role</i> to the interactor, or revokes <i>role</i> from the interactor if they have it. USAGE: tmi.togglerole:<i>role</i>",
      achieve: "<b>Disruptive.</b> Grants a <i>role</i>, then adds a <i>color</i> to the interactor's inventory. USAGE: tmi.achieve:<i>role</i>,<i>color</i>",
      kick: "<b>Disruptive.</b> Kicks the interactor for a <i>reason</i>. USAGE: tmi.kick:<i>reason</i>",
    };
    this.customCommands = {
      "credits": "Toggles the credits flying role and teleports.",
      "spawn": "Revokes the flying role and teleports.",
      "electrocute": "Hurts and grants a role.",
      "miningtp": "TP for Unlimited Mining easter egg.",
      "lottoblock": "Runs Lotto Block easter egg logic.",
      "beyondthefire": "Runs TP and role grant for beyond the fire easter egg.",
      "outliner": "Determines if a player meets the requirements to get the outliner.",
      "seasoning": "Seasons player. Gives a special role if you get the right combo of 3.",
      "softlock": "Softlock prevention, probably.",
      "spook": "Very scary.",
      "microeggs": "Gives a microegg, then any roles needed.",
      "sus": "Grants the sus microegg. Kills.",
      "menacing": "HO HO.",
      "unexistbutton": "bye lol",
      "riddler": "Grants the roles for beating Thingie's riddles. Tells you you're stuck.",
      "six": "Grants shrinkage role. Teleports to the tiny doorway.",
    };
    this.weapons = ['AntiMaterielRifle', 'ArmingSword', 'AssaultRifle', 'AutoShotgun', 'Battleaxe', 'Bazooka', 'Bow', 'BullpupRifle', 'BullpupSMG', 'ChargedLongsword', 'CrystalKalis', 'Derringer', 'FlintlockPistol', 'GrenadeLauncher', 'Handaxe', 'HealthPotion', 'HeavyAssaultRifle', 'HeavySMG', 'HeroSword', 'HighPowerPistol', 'HoloBlade', 'HuntingShotgun', 'Ikakalaka', 'ImpactGrenade', 'ImpactGrenadeLauncher', 'ImpulseGrenade', 'Khopesh', 'Knife', 'LeverActionRifle', 'LightMachineGun', 'LongSword', 'MagnumPistol', 'MicroSMG', 'Minigun', 'Pistol', 'PulseCarbine', 'QuadLauncher', 'Revolver', 'RocketJumper', 'RocketLauncher', 'Sabre', 'SemiAutoRifle', 'ServiceRifle', 'Shotgun', 'SlugShotgun', 'Sniper', 'Spatha', 'StandardSubmachineGun', 'StickGrenade', 'SubmachineGun', 'SuperShotgun', 'SuppressedAssaultRifle', 'SuppressedBullpupSMG', 'SuppressedPistol', 'SuppressedServiceRifle', 'TacticalShotgun', 'TacticalSMG', 'Tomahawk', 'TwinCannon', 'TypewriterSMG', 'Zweihander']
    this.debounceNames = {};
    this.playerCallbacks = {};
    this.playerIntervals = {};

    this.eggs = [
      "bugpilled",
      "Decrypted Dynast",
      "Couple's Therapist",
      "Party Goer",
      "Menacing",
      "No Half-Measures", 
      "Halfway Hunter",
      "It's a Start",
      "very scared",
      "kwak",
      "The Visitor",
      "a Lightbulb Cousin",
      "Legal in Blockland",
      "3D-Thinking",
      "Triple Dipper",
      "Softlock Prevention",
      "(baking) SODA!!",
      "Indian Spiced",
      "Italian Seasoned",
      "Tree Topper",
      "Fibreglass for 4.99",
      "Loose Change",
      "Point Insertion",
      "Beyond the Fire",
      "Outliner User",
      "Credits Warper",
      "Buzz Off",
      "Codebreaker",
      "Let's Go Gambling!",
      "Epicness Get",
      "Safety First",
      "Vitamin AAAAA",
      "Health Conscious",
      "To Bee or not To Bee",
      "Peter what are you-",
      "Smoke Detector",
      "I CAN'T STOP WINNING",
      "Fire Escape",
      "REAL ROOTBEERIA",
      "Gardener",
      "Shrinkage",
      "budnis",
    ]

    this.microeggs = [
      "door",
      "slate",
      "sus",
      "blurb",
      "floompert",
      "manipulator",
      "renderman",
      "troll",
      "unexist",
      "council"
    ]

    this.seasonings = {};
  }

  debounceAddName(player: PlayerInteraction) {
    if (this.debounceNames[player.id]) throw "";
    this.debounceNames[player.id] = player;
  }

  debounceAddQueue(player) {
    if (!this.playerCallbacks[player.id]) {
      this.playerCallbacks[player.id] = {};
    }

    if (this.debounceNames[player.id] && !this.playerCallbacks[player.id].debounce) {
      this.playerCallbacks[player.id].debounce = setTimeout(() => {
        delete this.debounceNames[player.id];
        delete this.playerCallbacks[player.id].debounce;
      }, 100);
    }
  }

  addPlayerInterval(id: string, type: string, intervalCallback, period, resetCallback, endCallback, timeoutLength) {
    if (!this.playerIntervals[id]) {
      this.playerIntervals[id] = {};
    }
    if (!this.playerCallbacks[id]) {
      this.playerCallbacks[id] = {};
    }

    if (this.playerIntervals[id][type]) {
      clearInterval(this.playerIntervals[id][type]);
      clearTimeout(this.playerCallbacks[id][type]);
      resetCallback();
    }

    this.playerIntervals[id][type] = setInterval(intervalCallback, period);
    this.playerCallbacks[id][type] = setTimeout(() => {
      delete this.playerCallbacks[id][type];
      clearInterval(this.playerIntervals[id][type]);
      delete this.playerIntervals[id][type];
      endCallback();
    }, timeoutLength);
  }

  addPlayerCallback(id, type, resetCallback, endCallback, timeoutLength) {
    if (!this.playerCallbacks[id]) {
      this.playerCallbacks[id] = {};
    }

    if (this.playerCallbacks[id][type]) {
      clearTimeout(this.playerCallbacks[id][type]);
      resetCallback();
    }

    this.playerCallbacks[id][type] = setTimeout(() => {
      delete this.playerCallbacks[id][type];
      endCallback();
    }, timeoutLength);
  }

  getTopCenter(sizeArray, positionArray) {
    return [positionArray[0], positionArray[1], positionArray[2] + sizeArray[2] + 25.148];
  }

  async getOwnerOfInteractedBrick(interaction: BrickInteraction) {
    /*for (let key in interaction) {
      this.omegga.whisper("base4", `${key}: ${interaction[key]}`);
    }*/

    const extentArray: [number, number, number] = [...interaction.brick_size];
    let biggest = Math.max(extentArray[0], extentArray[1], extentArray[2]);
    extentArray[0] = biggest;
    extentArray[1] = biggest;
    extentArray[2] = biggest;

    let save = await this.omegga.getSaveData({
      center: interaction.position,
      extent: extentArray
    });

    if (!save) {
      return `ERROR: No bricks found at ${interaction.position} with extent ${extentArray}. What happened?`;
    }

    if (save.bricks.length >= 2000) {
      return `ERROR: Too many bricks too "close" to this one! Downsize the brick or make more space around it. (${save.bricks.length} bricks. maximum allowed: 2000).`;
    }

    const size = interaction.brick_size.toString();
    const position = interaction.position.toString();

    const candidates = new Set;
    save.bricks.forEach((brick) => {
      if (
        brick.size.toString() === size &&
        brick.position.toString() === position &&
        save.brick_assets[brick.asset_name_index] === interaction.brick_asset
      ) {
        candidates.add(save.brick_owners[brick.owner_index - 1]);
      }
    });

    if (candidates.size > 1) {
      return "ERROR: Brick ownership is ambiguous. Please make sure this brick is not too close to an identical brick owned by a different player.";
    } else if (!candidates.values().next().value) {
      return "ERROR: No brick found that seems to be the one that was clicked. What happened?";
    } else {
      return candidates.values().next().value;
    }
  }

  findWeapon(argument) {
    let match = false;
    let gottenWeapon: Weapon;
    argument = argument.toLowerCase();
    this.weapons.forEach((weapon) => {
      if (!match && weapon.toLowerCase().includes(argument)) {
        gottenWeapon = weapon;
        match = true;
      }
    });
    return !match ? "" : "Weapon_" + gottenWeapon;
  }

  async checkRestrictions(command, player: OmeggaPlayer, interact) {
    const commandIsSecure = this.config['tmi-secure-commands'].includes(command)
    const commandIsRestricted = this.config['tmi-restricted-commands'].includes(command)
    const authorizationEnabled = !this.config['tmi-disable-authorization']

    if (!this.config['tmi-disruptive-commands'] && Object.keys(this.disruptiveCommands).includes(command)) {
      return `Disruptive commands such as <b>${command}</b> have been disabled.`;
    }

    if (this.config['tmi-disabled-commands'].includes(command)) {
      return `The command <b>${command}</b> has been disabled.`;
    }

    // an exception for if we already know this command is usable by anybody
    // do not even check anything, just return true
    // (this allows us to skip finding the brick, so that freely-authorized commands can be used on strangely-shaped bricks)
    // this is particularly useful for commands like tp, hurt, and relativetp.
    if (
      !commandIsSecure && !commandIsRestricted && !authorizationEnabled
    ) {
      return true
    }

    const interactorIsHost = player.isHost()
    const interactorIgnoresRestrictions = player.getRoles().some((role) => (this.config['tmi-restricted-authorized']).includes(role))
    const interactorHasBasicAuthorization = player.getRoles().some((role) => (this.config['tmi-authorized']).includes(role)) || !authorizationEnabled
    
    const interactorCanUseThisCommand =
      interactorIsHost ||
      interactorIgnoresRestrictions ||
      (
        !commandIsRestricted && interactorHasBasicAuthorization
      )

    if (!interactorCanUseThisCommand) {
      return `You do not have permission to use the command <b>${command}</b>.`;
    }

    // check for the brick owner's permissions
    let name;
    let ownerHasClearance;
    let ownerIsHost;
    let ownerIgnoresRestrictions;
    let ownerHasBasicAuthorization;

    if (interact) {
      const owner = await this.getOwnerOfInteractedBrick(interact);
      if (typeof owner === "string") return owner;

      name = owner.name;
      ownerIsHost = Omegga.getHostId() === owner.id;
      ownerHasBasicAuthorization = this.config['tmi-disable-authorization'] || Player.getRoles(this.omegga, owner.id).some((role) => (this.config['tmi-authorized']).includes(role)) || this.config['tmi-authorized'].length === 0;
      ownerHasClearance = Player.getRoles(this.omegga, owner.id).some((role) => (this.config['tmi-secure-authorized']).includes(role));
      ownerIgnoresRestrictions = Player.getRoles(this.omegga, owner.id).some((role) => (this.config['tmi-restricted-authorized']).includes(role));
    } else {
      name = player.name;
      ownerIsHost = player.isHost();
      ownerHasBasicAuthorization = this.config['tmi-disable-authorization'] || player.getRoles().some((role) => (this.config['tmi-authorized']).includes(role)) || this.config['tmi-authorized'].length === 0;
      ownerHasClearance = player.getRoles().some((role) => (this.config['tmi-secure-authorized']).includes(role));
      ownerIgnoresRestrictions = player.getRoles().some((role) => (this.config['tmi-restricted-authorized']).includes(role));
    }

    const ownerCanPutThisCommandOnBricks =
      ownerIsHost ||
      ((
        !commandIsSecure || ownerHasClearance
      ) && (
        !commandIsRestricted || ownerIgnoresRestrictions
      ) && (
        ownerHasBasicAuthorization
      ))

    if (!ownerCanPutThisCommandOnBricks) {
      return `<b>${name}</b> does not have permission to have bricks with the command <b>${command}</b>.`;
    }

    return true;
  }

  ensureGoodInput(inputArray, expectedTypes, requiredArgumentCount) {
    if (inputArray.length - 1 < requiredArgumentCount) {
      throw `ERROR: Wrong number of arguments! Need at least ${requiredArgumentCount}, but only found ${inputArray.length - 1}!`;
    }

    inputArray.forEach((input, index) => {
      if (index === 0) return;
      switch (expectedTypes[index - 1]) {
      case "number":
        if (input === "" || isNaN(Number(input))) throw `ERROR: Argument #${index} needs to be a number, but instead, it's ${input || "nothing"}.`;
        break;
      case "player":
        if (input === "") throw `ERROR: Argument #${index} needs to be a player's name, but instead, it's nothing.`;
        break;
      case "boolean":
        if (input === "" || (Boolean(input) != true && Boolean(input) != false)) throw `ERROR: Argument #${index} needs to be true or false, but instead, it's ${input || "nothing"}.`;
        break;
      case "weapon":
        if (input === "" || !this.findWeapon(input)) throw `ERROR: Argument #${index} needs to be part of a weapon's name, but instead, it's ${input || "nothing"}.`;
        break;
      case "string":
        if (input === "") throw `ERROR: Argument #${index} needs to be a string, but instead, it's nothing.`;
        break;
      case "role":
        if (!this.omegga.getRoleSetup().roles.some((value) => value.name === input)) throw `ERROR: Argument #${index} needs to be a role, but instead, it's ${input || "nothing"}.`
        break;
      case "color":
        if (!this.config["tmi-color-roles"].includes(input)) throw `ERROR: Argument #${index} needs to be a color, but instead, it's ${input || "nothing"}.`
        break;
      case "customCommand":
        if (!Object.keys(this.customCommands).includes(input)) throw `ERROR: Argument #${index} needs to be a custom command, but instead, it's ${input || "nothing"}.`
        break;
      case "microegg":
        if (!this.microeggs.includes(input)) throw `ERROR: Argument #${index} needs to be a valid microegg, but instead, it's ${input || "nothing"}.`
        break;
      default:
        // nothing necessary
        break;
      }
    });
  }

  getHexFromColorObject(colorObject: BRColor) {
    const red = (colorObject.r < 16 ? "0" : "") + colorObject.r.toString(16)
    const green = (colorObject.g < 16 ? "0" : "") + colorObject.g.toString(16)
    const blue = (colorObject.b < 16 ? "0" : "") + colorObject.b.toString(16)
    return red + green + blue
  }

  async addMicroEggToInventory(targetEgg: string, player: OmeggaPlayer) {
    const storeKey = "microeggInventory." + player.id;
    if (!(await this.store.keys()).includes(storeKey)) {
      await this.store.set(storeKey, [])
    }
    const inventory = await this.store.get(storeKey) as Array<string>

    if (inventory.length > 10) {
      inventory.splice(0)
    }

    if (!inventory.includes(targetEgg)) {
      inventory.push(targetEgg)
      inventory.sort()

      await this.store.set(storeKey, inventory)

      this.omegga.whisper(player.name, `You've found a microegg. <b>${inventory.length}/${this.microeggs.length}</>.`);
      if (inventory.length/this.microeggs.length >= 1) {
        this.addColorToInventory("Micro Blue", player)
        this.omegga.writeln(`Chat.Command /GRANTROLE "No Half-Measures" "${player.name}"`)
      }
      if (inventory.length/this.microeggs.length >= 0.5) {
        this.omegga.writeln(`Chat.Command /GRANTROLE "Halfway Hunter" "${player.name}"`)
      }
      if (inventory.length >= 1) {
        this.omegga.writeln(`Chat.Command /GRANTROLE "It's a Start" "${player.name}"`)
      }
    } else {
      this.omegga.whisper(player.name, `You've already found this microegg. <b>${inventory.length}/${this.microeggs.length}</>.`);
    }
  }

  async addColorToInventory(targetRole: string, player: OmeggaPlayer) {
    const storeKey = "colorInventory." + player.id;
    if (!(await this.store.keys()).includes(storeKey)) {
      await this.store.set(storeKey, [])
    }
    const inventory = await this.store.get(storeKey) as Array<string>

    if (!inventory.includes(targetRole)) {
      inventory.push(targetRole)
      inventory.sort()

      await this.store.set(storeKey, inventory)

      const targetColor = this.omegga.getRoleSetup().roles.find((role) => role.name === targetRole).color

      this.omegga.whisper(player.name, `You just unlocked a new name color:
        <b><color="#${this.getHexFromColorObject(targetColor)}">${targetRole}</></>
      `);
      this.omegga.whisper(player.name, "Use <b>/tmicolor</> to equip it!")
    }
  }

  async swapColors(targetColor: string, player: OmeggaPlayer, timer: number) {
    if ((player.name in this.roleLastGiven) && Date.now() <= this.roleLastGiven[player.name] + timer) {
      this.omegga.whisper(player.name, `You're on cooldown for ${((this.roleLastGiven[player.name] + timer - Date.now())/1000).toFixed(1)}s.`)
      return
    }

    this.roleLastGiven[player.name] = Date.now();

    //const storeKey = "lastColorGiven." + player.id;
    //if (!(await this.store.keys()).includes(storeKey)) {
    //  await this.store.set(storeKey, "")
    //}
    //const lastColor = await this.store.get(storeKey)

    const roles = player.getRoles()
    const colorRoles = []
    roles.forEach((role) => this.config["tmi-color-roles"].includes(role) ? colorRoles.push(role) : {})
    colorRoles.forEach((role) => {
      if (role !== targetColor) {
        this.omegga.writeln(`Chat.Command /REVOKEROLE \"${role}\" "${player.name}"`)
      }
    })

    if (roles.includes(targetColor)) {
      this.omegga.writeln(`Chat.Command /REVOKEROLE \"${targetColor}\" "${player.name}"`)
    } else {
      this.omegga.writeln(`Chat.Command /GRANTROLE \"${targetColor}\" "${player.name}"`)
    }
  }

  addSeasoningToPlayer(seasoning: string, player: OmeggaPlayer) {
    if (!Object.keys(this.seasonings).includes(player.id)) {
      this.seasonings[player.id] = [];
    }
    if (!Object.keys(this.playerCallbacks).includes(player.id)) {
      this.playerCallbacks[player.id] = {};
    }

    this.seasonings[player.id].push(seasoning)
    this.omegga.whisper(player, `You get a bit of ${seasoning} on you.`)

    if (this.seasonings[player.id].length < 3) {
      if (this.playerCallbacks[player.id].seasoningTimer) {
        clearTimeout(this.playerCallbacks[player.id].seasoningTimer);
      }
      this.playerCallbacks[player.id].seasoningTimer = setTimeout(() => {
        delete this.playerCallbacks[player.id].seasoningTimer;
        this.seasonings[player.id] = [];
        this.omegga.whisper(player, "Your seasonings fall off.")
      }, 5000);
    } else {
      const seasonings = this.seasonings[player.id]
      if (seasonings.includes("coriander") && seasonings.includes("cumin") && seasonings.includes("curry powder")) {
        this.omegga.writeln(`Chat.Command /GRANTROLE "Indian Spiced" "${player.name}"`)
        this.addColorToInventory("Spicy Orange", player);
      } else if (seasonings.includes("basil") && seasonings.includes("oregano") && seasonings.includes("rosemary")) {
        this.omegga.writeln(`Chat.Command /GRANTROLE "Italian Seasoned" "${player.name}"`)
        this.addColorToInventory("Pepper Gray", player);
      } else {
        this.omegga.whisper(player, "That doesn't seem right. You shake off the seasoning.")
      }

      this.seasonings[player.id] = [];
      clearTimeout(this.playerCallbacks[player.id].seasoningTimer);
      delete this.playerCallbacks[player.id].seasoningTimer;
    }
  }

  async init() {
    const registeredCommands = [];
    this.omegga.on('interact', async (interaction) => {
      if (interaction.message.startsWith('tmi.')) {
        // first break up the command into an array, command[0] being the command itself,
        // with command[1], command[2], etc... being the arguments.
        const commandArray = interaction.message.substring(4).split(":");
        if (commandArray.length > 1) {
          const args = commandArray[1].split(",");
          commandArray.pop();
          args.forEach((argument) => {
            commandArray.push(argument);
          });
        }

        // set up a try-catch to handle parsing errors
        try {
          // debounce
          this.debounceAddName(interaction.player);

          // valid TMI command?
          if (
            !Object.keys(this.commands).includes(commandArray[0])
            && !Object.keys(this.disruptiveCommands).includes(commandArray[0])
          ) {
            throw `Invalid command.`;
          }

          const thisPlayer = this.omegga.getPlayer(interaction.player.name); // get this player
          const players = this.omegga.getPlayers(); // get all online
          const playerNames: string[] = [];
          players.forEach((player) => {
            playerNames.push(player.name); // generate an array of all their names to make life easier later
          });

          let host = this.omegga.host; // get the host
          let hostOnline = true;
          if (host) {
            if (!playerNames.includes(host.name)) hostOnline = false; // if they're not online then set host to false
          }

          

          // are there any restrictions preventing this command from running?
          // e.g. is it restricted and the player who triggered it is not authorized?
          // e.g. is it secure and the player who built the brick it's on is not authorized to build it?
          // e.g. is it disabled?
          // if restrictions apply, throw inside the following funciton:
          const issue = await this.checkRestrictions(commandArray[0], thisPlayer, interaction);

          if (issue !== true) {
            throw issue;
          }

          const random = Math.random();
          const playerRoles = thisPlayer.getRoles()

          switch (commandArray[0]) {
          case "hurt":
            this.ensureGoodInput(commandArray, ["number"], 1);
            this.omegga.writeln(`Server.Players.Damage "${interaction.player.name}" ${commandArray[1]}`);
            break;
          case "kill":
            this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`);
            break;
          case "lottery":
            this.ensureGoodInput(commandArray, ["number"], 1);
            if (random < Number(commandArray[1]) / 100) {
              this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`);
              this.omegga.whisper(interaction.player.name, "<i>UNLUCKY!</i>");
            }
            break;
          case "tp":
            this.ensureGoodInput(commandArray, ["number", "number", "number"], 3);
            this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" ${commandArray[1]} ${commandArray[2]} ${commandArray[3]} 0`);
            break;
          case "relativetp":
            this.ensureGoodInput(commandArray, ["number", "number", "number"], 3);
            const position = await thisPlayer.getPosition()
            this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" ${position[0] + Number(commandArray[1])} ${position[1] + Number(commandArray[2])} ${position[2] + Number(commandArray[3])} 0`);
            break;
          case "unexist":
            this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" 9999999999 999999999 999999999 0`);
            break;
          case "goto":
            this.ensureGoodInput(commandArray, ["player"], 1);
            if (playerNames.includes(commandArray[1])) {
              this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" "${commandArray[1]}"`);
              this.omegga.whisper(interaction.player.name, `Teleported to ${commandArray[1]}.`);
            } else {
              this.omegga.whisper(interaction.player.name, `Found no players matching search term ${commandArray[1]}.`)
            }
            break;
          case "fetch":
            this.ensureGoodInput(commandArray, ["player"], 1);
            if (playerNames.includes(commandArray[1])) {
              const targetArray = this.getTopCenter(interaction.brick_size, interaction.position);
              this.omegga.writeln(`Chat.Command /TP "${commandArray[1]}" ${targetArray[0]} ${targetArray[1]} ${targetArray[2]} 0`);
              this.omegga.whisper(interaction.player.name, `Fetched ${commandArray[1]}.`);
              this.omegga.whisper(commandArray[1], `Fetched by ${interaction.player.name}.`);
            } else {
              this.omegga.whisper(interaction.player.name, `Found no players matching search term ${commandArray[1]}.`)
            }
            break;
          case "whisper":
            this.ensureGoodInput(commandArray, ["string"], 1);
            this.omegga.whisper(interaction.player.name, commandArray[1]);
            break;
          case "tell":
            this.ensureGoodInput(commandArray, ["player", "string"], 2);
            if (playerNames.includes(commandArray[1])) {
              this.omegga.whisper(commandArray[1], commandArray[2]);
            } else {
              this.omegga.whisper(interaction.player.name, `Found no players matching search term ${commandArray[1]}.`)
            }
            break;
          case "broadcast":
            this.ensureGoodInput(commandArray, ["string"], 1);
            this.omegga.broadcast(commandArray[1]);
            break;
          case "jail":
            this.ensureGoodInput(commandArray, ["number"], 0);
            const targetArray = this.getTopCenter(interaction.brick_size, interaction.position);
            let time;
            if (commandArray.length > 1) {
              try {
                Number(commandArray[1])
                time = 1000 * (Number(commandArray[1]) <= 60 ? Number(commandArray[1]) : 60);
              } catch {
                time = 10000;
              }
            }
            else time = 10000;
            this.addPlayerInterval(interaction.player.id, "jail", () => {
                this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" ${targetArray[0]} ${targetArray[1]} ${targetArray[2]} 0`);
              }, 100,
              () => {},
              () => {
                this.omegga.whisper(interaction.player.name, "You are out of jail now.");
              }, time);
            this.omegga.whisper(interaction.player.name, `You are now in jail for ${Math.ceil(time/1000)} seconds.`);
            break;
          case "killother":
            this.ensureGoodInput(commandArray, ["player"], 1);
            this.omegga.writeln(`Server.Players.Kill "${commandArray[1]}"`);
            break;
          case "killall":
            players.forEach((player) => {
              this.omegga.writeln(`Server.Players.Kill "${player.name}"`);
            });
            this.omegga.broadcast(`<b>${interaction.player.name}</b> just killed everyone...`)
            break;
          case "hurtall":
            this.ensureGoodInput(commandArray, ["number"], 1);
            players.forEach((player) => {
              this.omegga.writeln(`Server.Players.Damage "${player.name}" ${commandArray[1]}`);
            });
            this.omegga.broadcast(`<b>${interaction.player.name}</b> just hurt everyone for ${commandArray[1]}...`)
            break;
          case "killhost":
            if (hostOnline) {
              if (random < 2 / 100) {
                this.omegga.writeln(`Server.Players.Kill "${host.name}"`);
                this.omegga.broadcast(
                  `<i>LUCKY!</i> <b>${interaction.player.name}</b> killed <b>${host.name}</b>!`
                );
              } else if (random > 80 / 100) {
                this.omegga.whisper(interaction.player.name, `<i>UNLUCKY!</i> You failed to kill the host! Better luck next time.`);
                this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`);
              }
            } else {
              this.omegga.whisper(interaction.player.name, `No host found. Try again later?`);
            }
            break;
          case "annoyhost":
            if (host.name) {
              this.omegga.writeln(`Server.Players.Damage "${host.name}" 0.01`);
              this.omegga.whisper(interaction.player.name, `<b>${host.name}</b> successfully annoyed.`);
              this.omegga.whisper(host.name, `<b>${interaction.player.name}</b> is being annoying.`);
              if (random > 50 / 100) {
                this.omegga.writeln(`Server.Players.Damage "${interaction.player.name}" 5`);
              }
            } else {
              this.omegga.whisper(interaction.player.name, `No host found. Try again later?`);
            }
            break;
          case "giveitem":
            this.ensureGoodInput(commandArray, ["weapon", "number"], 1);
            let giveAmount;
            if (commandArray.length === 2) {
              giveAmount = 1;
            } else giveAmount = commandArray[2];
            const giveWeapon = this.findWeapon(commandArray[1]);
            for (giveAmount; giveAmount > 0; giveAmount--) {
              this.omegga.writeln(`Server.Players.GiveItem "${interaction.player.name}" ${giveWeapon}`)
            }
            break;
          case "takeitem":
            this.ensureGoodInput(commandArray, ["weapon", "number"], 1);
            let takeAmount;
            if (commandArray.length === 2) {
              takeAmount = 1;
            } else takeAmount = commandArray[2];
            const takeWeapon = this.findWeapon(commandArray[1]);
            for (takeAmount; takeAmount > 0; takeAmount--) {
              this.omegga.writeln(`Server.Players.RemoveItem "${interaction.player.name}" ${takeWeapon}`)
            }
            break;
          case "grantrole":
            this.ensureGoodInput(commandArray, ["role"], 1);
            this.omegga.writeln(`Chat.Command /GRANTROLE "${commandArray[1]}" "${interaction.player.name}"`);
            break;
          case "revokerole":
            this.ensureGoodInput(commandArray, ["role"], 1);
            this.omegga.writeln(`Chat.Command /REVOKEROLE "${commandArray[1]}" "${interaction.player.name}"`);
            break;
  	      case "togglerole":
            this.ensureGoodInput(commandArray, ["role"], 1);
            if (playerRoles.includes(commandArray[1])) {
            	this.omegga.writeln(`Chat.Command /REVOKEROLE "${commandArray[1]}" "${interaction.player.name}"`);	
            } else {
              if (!(interaction.player.name in this.roleLastGiven) || Date.now() > this.roleLastGiven[interaction.player.name] + 10_000) {
                this.roleLastGiven[interaction.player.name] = Date.now();
                this.omegga.writeln(`Chat.Command /GRANTROLE "${commandArray[1]}" "${interaction.player.name}"`);
              } else {
                this.omegga.whisper(interaction.player.name, `You're on cooldown for ${((this.roleLastGiven[interaction.player.name] + 10_000 - Date.now())/1000).toFixed(1)}s.`)
              }
            }
            break;
          case "achieve":
            this.ensureGoodInput(commandArray, ["role", "color"], 2);
            this.omegga.writeln(`Chat.Command /GRANTROLE "${commandArray[1]}" "${interaction.player.name}"`);
            await this.addColorToInventory(commandArray[2], thisPlayer)
            break;
          case "swapcolor":
            this.ensureGoodInput(commandArray, ["color"], 1);
            await this.swapColors(commandArray[1], thisPlayer, 5000)
            break;
          case "givecolor":
            this.ensureGoodInput(commandArray, ["color"], 1)
            await this.addColorToInventory(commandArray[1], thisPlayer)
            break;
          case "kick":
            this.ensureGoodInput(commandArray, ["string"], 0);
            let reason = "Became the unfortunate victim of a TMI command.";
            if (commandArray.length > 1) reason = commandArray[1];
            this.omegga.writeln(`Chat.Command /KICK "${interaction.player.name}" "${reason}"`);
            break;
          case "custom":
            this.ensureGoodInput(commandArray, ["customCommand"], 1);
            switch (commandArray[1]) {
              case "spawn":
                //tp base4 -1455 -14175 545 0
                if (playerRoles.includes("Jets Playertype")) {
                  this.omegga.writeln(`Chat.Command /REVOKEROLE "Jets Playertype" "${interaction.player.name}"`);
                  this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`);
                  this.omegga.whisper(thisPlayer, "You can't take jets out of spawn.")
                }
                this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" -1080 -13889 537 0`)
                break;
              case "credits":
                //tp base4 -2529 -13661 1385 0
                this.addColorToInventory("GG Green", thisPlayer)
                this.omegga.writeln(`Chat.Command /GRANTROLE "Credits Warper" "${interaction.player.name}"`)
                if (playerRoles.includes("Jets Playertype")) {
                  this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" 0 0 0 0`)
                } else {
                  if (!(interaction.player.name in this.roleLastGiven) || Date.now() > this.roleLastGiven[interaction.player.name] + 10_000) {
                    this.roleLastGiven[interaction.player.name] = Date.now();
                    this.omegga.writeln(`Chat.Command /GRANTROLE "Jets Playertype" "${interaction.player.name}"`);
                    this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" -2852 -13783 1376 0`)
                  }
                }
                break;
              case "electrocute":
                this.omegga.writeln(`Server.Players.Damage "${interaction.player.name}" 99999`);
                this.omegga.writeln(`Chat.Command /GRANTROLE "Safety First" "${interaction.player.name}"`);
                await this.addColorToInventory("Electric Yellow", thisPlayer)
                break;
              case "miningtp":
                this.omegga.writeln(`Chat.Command /GRANTROLE "Jets Playertype" "${interaction.player.name}"`);
                this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" -570.5 43960 2505 0`)
                break;
              case "lottoblock":
                if (playerRoles.includes("I CAN'T STOP WINNING")) {
                  // do nothing
                } else if (!playerRoles.includes("Let's Go Gambling!")) {
                  this.omegga.writeln(`Chat.Command /GRANTROLE "${"Let's Go Gambling!"}" "${interaction.player.name}"`);
                  this.omegga.whisper(interaction.player.name, "You didn't win anything. Click again?")
                } else {
                  if (random < 0.02) {
                    await this.addColorToInventory("Lucky Green", thisPlayer)
                    this.omegga.writeln(`Chat.Command /GRANTROLE "${"I CAN'T STOP WINNING"}" "${interaction.player.name}"`);
                  } else if (random > 0.90) {
                    this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`);
                    this.omegga.whisper(interaction.player.name, "TOO BAD! You lost!")
                    this.omegga.writeln(`Chat.Command /GRANTROLE "${"aw dangit"}" "${interaction.player.name}"`);
                  } else {
                    this.omegga.whisper(interaction.player.name, "You didn't win anything. Click again?")
                  }
                }
                break;
              case "beyondthefire":
                this.omegga.writeln(`Chat.Command /GRANTROLE "Beyond the Fire" "${interaction.player.name}"`);
                this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" 2359 -14639 235 0`);
                this.addColorToInventory("Wipeout Orange", thisPlayer);
                break;
              case "outliner":
                if (playerRoles.includes("Fire Escape") && playerRoles.includes("Codebreaker") && playerRoles.includes("Credits Warper")) {
                  if (!playerRoles.includes("Outliner User")) {
                    this.omegga.writeln(`Chat.Command /GRANTROLE "Outliner User" "${interaction.player.name}"`)
                  }
                  this.omegga.whisper(thisPlayer, "You've unlocked the outliner. Use it wisely.")
                } else {
                  this.omegga.whisper(thisPlayer, "Sorry! You don't have enough achievements yet...")
                  if (!playerRoles.includes("Fire Escape")) {
                    this.omegga.whisper(thisPlayer, `You still need to <color="#C93740"><b>climb the chimney</></>.`)
                  }
                  if (!playerRoles.includes("Codebreaker")) {
                    this.omegga.whisper(thisPlayer, `You still have the <color="#AFE8FF"><b>crack the code in the Blockland house</></>.`)
                  }
                  if (!playerRoles.includes("Credits Warper")) {
                    this.omegga.whisper(thisPlayer, `You've still got to <color="#A1D3B3"><b>find the credits room up in the cabinets</></>.`)
                  }
                  this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`);
                }
                break;
              case "seasoning":
                this.addSeasoningToPlayer(commandArray[2], thisPlayer);
                break;
              case "softlock":
                this.addColorToInventory("Soft(lock) Purple", thisPlayer);
                this.omegga.writeln(`Chat.Command /GRANTROLE "Softlock Prevention" "${interaction.player.name}"`);
                this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`)
                break;
              case "spook":
                this.addColorToInventory("TERRIFYING Black", thisPlayer);
                this.omegga.writeln(`Chat.Command /GRANTROLE "very scared" "${interaction.player.name}"`);
                this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`)
                break;
              case "microeggs":
                this.ensureGoodInput(commandArray, ["none", "microegg"], 2)
                this.addMicroEggToInventory(commandArray[2], thisPlayer);
                break;
              case "sus":
                this.addMicroEggToInventory("sus", thisPlayer);
                this.omegga.writeln(`Server.Players.Kill "${interaction.player.name}"`)
                break;
              case "menacing":
                const position = await thisPlayer.getPosition()
                this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" ${position[0] - 1986} ${position[1] - 14} ${position[2] - 269} 0`);
                this.omegga.writeln(`Chat.Command /GRANTROLE "Menacing" "${interaction.player.name}"`);
                this.addColorToInventory("Big Gray", thisPlayer);
                break;
              case "unexistbutton":
                this.addMicroEggToInventory("unexist", thisPlayer);
                this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" 9999999999 999999999 999999999 0`);
                break;
              case "riddler":
                this.addColorToInventory("Clever Blue", thisPlayer);
                this.omegga.writeln(`Chat.Command /GRANTROLE "Decrypted Dynast" "${interaction.player.name}"`);
                this.omegga.whisper(thisPlayer, "Congratulations! You're stuck here now. The prize of your greed.")
                break;
              case "six":
                this.omegga.writeln(`Chat.Command /GRANTROLE "Shrinkage" "${interaction.player.name}"`);
                this.omegga.writeln(`Chat.Command /TP "${interaction.player.name}" 77 -16083 -149 0`);
                this.addColorToInventory("Biggest Beige", thisPlayer);
                break;
            }
          }
        } catch (error) {
          if (error) this.omegga.whisper(interaction.player.name, error);
        } finally {
          this.debounceAddQueue(interaction.player);
        }
      }
    });

    this.omegga.on("cmd:tmilist", async (player) => {
      player = await this.omegga.getPlayer(player);

      this.omegga.whisper(player.name, "<u>available <b>TMI</b> commands</u>");
      Object.keys(this.commands).forEach(async (command) => {
        const result = await this.checkRestrictions(command, player, null);
        if (result === true) {
          this.omegga.whisper(player.name, `<b>${command}</b> - ${this.commands[command]}`);
        }
      });
      Object.keys(this.disruptiveCommands).forEach(async (command) => {
        const result = await this.checkRestrictions(command, player, null);
        if (result === true) {
          this.omegga.whisper(player.name, `<b>${command}</b> - ${this.disruptiveCommands[command]}`);
        }
      });
    });

    this.omegga.on("cmd:tmihelp", async (player) => {
      this.omegga.whisper(player, "(TMI is a plugin. It only works on servers running server wrapper Omegga.)");
      this.omegga.whisper(player, "To begin, find your desired command from /tmilist.");
      this.omegga.whisper(player, "Then place a brick and attach an interact component.");
      this.omegga.whisper(player, "Edit the interact. Click Advanced. Write your command in the Print to Console textbox.");
    });

    this.omegga.on("cmd:tmicolor", async (player, colorSearchTerm, ...args) => {
      const storeKey = "colorInventory." + this.omegga.getPlayer(player).id;
      if (!(await this.store.keys()).includes(storeKey)) {
        await this.store.set(storeKey, [])
      }
      const inventory = await this.store.get(storeKey) as Array<string>

      if (!colorSearchTerm) {
        const roles = this.omegga.getRoleSetup().roles

        if (inventory.length === 0) {
          this.omegga.whisper(player, "You don't own any colors.")
        } else {
          this.omegga.whisper(player, "Colors you own:")
          inventory.forEach((colorName) => {
            const foundRole = roles.find((role) => role.name === colorName)
            if (foundRole) {
              const color = foundRole.color
              this.omegga.whisper(player,
                `<b><color="#${this.getHexFromColorObject(color)}">${colorName}</></>`
              )
            }
          })
          this.omegga.whisper(player, `Type /tmicolor "name of color" to set your color!`)
        }
      } else {
        args.forEach((word) => colorSearchTerm = colorSearchTerm + " " + word)
        colorSearchTerm = colorSearchTerm.toLowerCase()


        const chosenColor = inventory.find((role) => role.toLowerCase().includes(colorSearchTerm))

        if (chosenColor === null) {
          // no match
          if (inventory.find((role) => role.toLowerCase().includes(colorSearchTerm)) === null) {
            
          }
        }

        if (this.config["tmi-color-roles"].includes(chosenColor)) {
          if (inventory.includes(chosenColor)) {
            await this.swapColors(chosenColor, this.omegga.getPlayer(player), 10000)
          } else {
            this.omegga.whisper(player, "You don't own that color.")
          }
        } else {
          this.omegga.whisper(player, "That's not a color.")
        }
      }
    })

    // this command is purposefully omitted from the config.
    this.omegga.on("cmd:eggs", async (player) => {
      try {
        const eggsFound = []
        const thisPlayer = this.omegga.getPlayer(player)
        const playerRoles = thisPlayer.getRoles()
        this.eggs.forEach((egg) => {playerRoles.includes(egg) ? eggsFound.push(egg) : "do nothing"})
        
        this.omegga.whisper(player, `You've gotten <b>${eggsFound.length}/${this.eggs.length}</> achievements this year.`)
        if (eggsFound.length == this.eggs.length && !playerRoles.includes("Noclip")) {
          this.omegga.whisper(player, "Congratulations! Here's your prize.")
          this.omegga.writeln(`Chat.Command /GRANTROLE Noclip "${player}"`)
          this.omegga.broadcast(`<b>${player} just got every achievement this year and has earned NOCLIP?! CONGRATULATIONS!</>`)
        }
      } catch (error) {
        if (error) this.omegga.whisper(player, error);
      }
    })

    registeredCommands.push('tmilist');
    registeredCommands.push('tmihelp');
    registeredCommands.push('tmicolor');

    if (this.config["tmi-new-years-functionality"]) {
      this.disruptiveCommands["custom"] = "<b>Disruptive.</b> Runs custom code not related to normal TMI functioning. Not intended for public use. Only use if you know what you're doing."
      registeredCommands.push('eggs');
    }

    return {
      registeredCommands
    };
  }

  async stop() {
    Object.keys(this.playerCallbacks).forEach((id) => {
      Object.keys(this.playerCallbacks[id]).forEach((type) => {
        clearTimeout(this.playerCallbacks[id][type]);
      });
    });
    Object.keys(this.playerIntervals).forEach((id) => {
      Object.keys(this.playerIntervals[id]).forEach((type) => {
        clearTimeout(this.playerIntervals[id][type]);
      });
    });
  }
}