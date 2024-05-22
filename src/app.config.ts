// Colyseus
import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

// Express
import basicAuth from "express-basic-auth";

// Room handlers
import { TownRoom } from "./rooms/TownRoom";
import { PlayerRoom } from "./rooms/PlayerRoom";
import { VipRoom } from "./rooms/VipRoom";

const authMiddleware = basicAuth({
  users: { admin: process.env.MONITOR_PASSWORD },
  challenge: true,
});

export default config({
  initializeGameServer: (gameServer) => {
    // Main Creativia Room - 300 players
    gameServer.define("town", TownRoom);

    // Player Room - 12 players
    gameServer.define("player_room", PlayerRoom);

    // VIP Room - 64 players
    gameServer.define("vip_room", VipRoom);
  },

  initializeExpress: (app) => {
    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground);
    } else {
      app.get("/", (req, res) => {
        res.send("Sup?");
      });
    }

    app.use("/monitor", authMiddleware, monitor());
  },

  beforeListen: () => {},
});
