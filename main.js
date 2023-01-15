require("dotenv").config();

const nbx = require("noblox.js");
const rpc = require("@xhayper/discord-rpc");
const Config = require("./config.js");
const Relative = require("@yaireo/relative-time");
let RelativeTime = new Relative();

const ROBLOSECURITY_PAD =
  "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";

const PRESENCE_DETAILS = { NONE: 0, BASIC: 1, ALL: 2 };

/**
 * Updates your Discord rich presence.
 * @param {UserPresence} Presence
 *
 * Type definitions:
 * ```js
 * UserPresence {
 *   state: UserPresenceType;
 * // 0 = Offline, 1 = Online, 2 = InGame, 3 = Studio
 *   userName: string;
 *   userId: string;
 *   location: string;
 *   lastOnline: string;
 *   gameState: GamePresence;
 *   thumbnails: PresenceThumbnails;
 * }
 * GamePresence {
 *   gameId: string;
 *   placeId: number;
 *   universeId: number;
 * }
 * PresenceThumbnails {
 *   userHeadshotThumbnail: string;
 *   userBodyThumbnail: string;
 *   gameThumbnail: string;
 * }
 * ```
 */
function updatePresence(Presence) {
  let details = Presence.userName;
  let state = "Offline";

  // Presence detection
  if (Presence.state === 1) state = "Online (" + Presence.location + ")";
  if (Presence.state === 2) state = 'Playing "' + Presence.location + '"';
  if (Presence.state === 3) state = "Editing in Studio";

  if (Config.presenceDetails === 0) {
    // Offline and Online only
    if (Presence.state >= 0 && Presence.state <= 3) {
      state = "Online";
    }
  } else if (Config.presenceDetails === 1) {
    // Offline, Online and InGame only
    if (Presence.state == 3) {
      // Studio not allowed
      state = "Online";
    }
  }

  if (Presence.state < 2) {
    state += " (last seen in " + Presence.location + ")";
  }

  // Thumbnail setting
  let bigThumbnail = "dummy_game_image";
  let bigThumbnailText = "Game title";
  let smallThumbnail = "dummy_user_image";
  let smallThumbnailText = "Username";

  if (Presence.state === 2) {
    if (Config.presenceDetails === 2) {
      // In-game, show game and user in big and small thumbnails
      //   bigThumbnail = Presence.thumbnails.gameThumbnail;
      bigThumbnail = Presence.thumbnails.userHeadshotThumbnail;
      bigThumbnailText = Presence.userName + " is playing " + Presence.location;
      smallThumbnail = "logo_new_small";
      smallThumbnailText = "Roblox-RPC v1.0";
    } else {
      // Only show user thumbnail
      bigThumbnail = Presence.thumbnails.userBodyThumbnail;
      smallThumbnail = "logo_tilt";
      bigThumbnailText = Presence.userName;
      smallThumbnailText = "Roblox";
    }
  } else {
    // Only show user thumbnail
    bigThumbnail = Presence.thumbnails.userBodyThumbnail;
    smallThumbnail = "logo_new_small";
    bigThumbnailText = Presence.userName + ` (${state})`;
    smallThumbnailText = "Roblox";
  }

  console.log({
    details,
    state,
    bigThumbnail,
    bigThumbnailText,
    smallThumbnail,
    smallThumbnailText,
    Presence,
  });

  let buttons = [
    {
      label: "View Profile",
      url: "https://www.roblox.com/users/" + Presence.userId + "/profile",
    },
  ];

  if (Presence.state === 2) {
    buttons.push({
      label: "View Game",
      url:
        "https://www.roblox.com/games/" + Presence.gameState.universeId + "/",
    });
  }

  client.user?.setActivity({
    details,
    state,
    buttons,
    //   buttons: [
    //     {
    //       label: "Test Button 01",
    //       url: "https://thats-the.name/",
    //     },
    //     {
    //       label: "Test Button 02",
    //       url: "https://thats-the.name/",
    //     },
    //   ],
    largeImageKey: bigThumbnail,
    largeImageText: bigThumbnailText,
    smallImageKey: smallThumbnail,
    smallImageText: smallThumbnailText,
    //   partySize: 3,
    //   partyMax: 16,
  });
}

const client = new rpc.Client({
  clientId: "1055739306670563349",
});

function getRobloxPresence() {
  nbx.setCookie(process.env.ROBLOX_COOKIE).then((d) => startRobloxLoop(d));
}

function handleError(e) {
  if (e.code !== "ETIMEDOUT") { // Common API error
    console.error("Fatal error", e);
    process.exit(1);
  }
}

async function startRobloxLoop(data) {
  console.log(`Logged in as ${data.UserName} [${data.UserID}]`);

  async function poll() {
    let headThumbnails = await nbx
      .getPlayerThumbnail([data.UserID], "420x420", "png", false, "headshot")
      .catch(handleError);

    let bodyThumbnails = await nbx
      .getPlayerThumbnail([data.UserID], "420x420", "png", false, "body")
      .catch(handleError);

    let presences = await nbx.getPresences([data.UserID]).catch((e) => {
      console.error("Fatal error", e);
      process.exit(1);
    });

    const myPresence = presences.userPresences[0];

    updatePresence({
      state: myPresence.userPresenceType,
      userName: data.UserName,
      userId: data.UserID,
      location: myPresence.lastLocation,
      lastOnline: myPresence.lastOnline,
      gameState: {
        gameId: myPresence.gameId,
        placeId: myPresence.placeId,
        universeId: myPresence.placeId,
      },
      thumbnails: {
        gameThumbnail: "",
        userHeadshotThumbnail: headThumbnails[0].imageUrl,
        userBodyThumbnail: bodyThumbnails[0].imageUrl,
      },
    });
  }

  await poll();

  let loop = setInterval(poll, Config.pollingInterval);
}

client.on("ready", () => {
  if (typeof process.env.ROBLOX_COOKIE !== "string") {
    console.log("Invalid roblox cookie, see README.md for more details.");
    return process.exit(1);
  }

  if (process.env.ROBLOX_COOKIE.startsWith(ROBLOSECURITY_PAD)) {
    getRobloxPresence();
  } else {
    console.log("Invalid roblox cookie, see README.md for more details.");
  }
});

client.login();
