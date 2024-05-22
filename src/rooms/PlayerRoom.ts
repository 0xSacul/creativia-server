import { Room, Client, ClientArray } from "@colyseus/core";
import {
  Clothing,
  InputData,
  Message,
  Player,
  PlayerRoomState,
} from "./schema/PlayerRoomState";
import { IncomingMessage } from "http";
import { Bumpkin } from "../types/bumpkin";

export class PlayerRoom extends Room<PlayerRoomState> {
  maxClients = 300;
  fixedTimeStep = 1000 / 60;

  private pushMessage(message: Message) {
    this.state.messages.push(message);

    while (this.state.messages.length > 150) {
      this.state.messages.shift();
    }
  }

  private fixedTick(timeStep: number) {
    const velocity = 1.68;

    this.state.players.forEach((player, key) => {
      let input: InputData | undefined;

      // dequeue player inputs.
      while ((input = player.inputQueue.shift())) {
        if (input.x || input.y) {
          player.x = input.x;
          player.y = input.y;
        }

        if (input.sceneId) {
          player.sceneId = input.sceneId;
        }

        if (input.clothing) {
          player.clothing = new Clothing({
            body: input.clothing.body,
            shirt: input.clothing.shirt,
            pants: input.clothing.pants,
            onesie: input.clothing.onesie,
            wings: input.clothing.wings,
            suit: input.clothing.suit,
            dress: input.clothing.dress,
            hat: input.clothing.hat,
            hair: input.clothing.hair,
            updatedAt: Date.now(),
          });
        }

        player.tick = input.tick;

        if (input.text) {
          const message = new Message();
          message.sceneId = player.sceneId;
          message.text = input.text;
          message.sessionId = key;
          message.farmId = player.farmId;
          message.username = player.username;
          message.sentAt = Date.now();
          this.pushMessage(message);
        }
      }
    });
  }

  // room lifecycle -----------------

  onCreate(options: any) {
    this.setState(new PlayerRoomState());

    this.onMessage(0, (client, input) => {
      const player = this.state.players.get(client.sessionId);
      player?.inputQueue.push(input);
    });

    let elapsedTime = 0;
    this.setSimulationInterval((deltaTime) => {
      elapsedTime += deltaTime;

      while (elapsedTime >= this.fixedTimeStep) {
        elapsedTime -= this.fixedTimeStep;
        this.fixedTick(this.fixedTimeStep);
      }
    });
  }

  onAuth(
    client: Client<
      this["clients"] extends ClientArray<infer U, any> ? U : never,
      this["clients"] extends ClientArray<infer _, infer U> ? U : never
    >,
    options: {
      jwt: string;
      farmId: number;
      username: string;
      faction: string;
      bumpkin: Bumpkin;
      sceneId: string;
      experience: number;
    },
    request: IncomingMessage
  ) {
    let player = this.state.players
      .toJSON()
      .find((p: any) => p.farmId === options.farmId);
    if (player) return client?.leave(0, "You are already in this room.");

    return {
      farmId: options.farmId,
      username: options.username,
      faction: options.faction,
      bumpkin: options.bumpkin,
      sceneId: options.sceneId,
      experience: options.experience,
    };
  }

  onJoin(
    client: Client,
    options: { x: number; y: number },
    auth: {
      bumpkin: Bumpkin;
      farmId: number;
      sceneId: string;
      experience: number;
    }
  ) {
    const clothing = new Clothing(auth.bumpkin.clothing);
    const player = new Player({
      farmId: auth.farmId,
      experience: auth.experience,
      x: options.x ?? 0,
      y: options.y ?? 0,
      sceneId: auth.sceneId,
      clothing,
    });

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
  }

  onDispose() {}
}
