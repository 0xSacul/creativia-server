import { Room, Client } from "@colyseus/core";
import { PlayerRoomState } from "./schema/PlayerRoomState";

export class VipRoom extends Room<PlayerRoomState> {
  maxClients = 64;

  onCreate(options: any) {
    this.setState(new PlayerRoomState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
