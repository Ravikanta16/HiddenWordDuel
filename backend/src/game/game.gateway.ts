import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly gameService: GameService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // We will implement authentication on connection later
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.gameService.removePlayerFromLobby(client);
  }

  @SubscribeMessage('joinLobby')
  async handleJoinLobby(@ConnectedSocket() client: Socket) {
    // In a real implementation, we would get the Player entity via an auth token
    const player = await this.gameService.getPlayerFromSocket(client);
    if (player) {
      this.gameService.addPlayerToLobby(client, player);
    } else {
      client.emit('error', 'Authentication failed. Could not join lobby.');
      client.disconnect();
    }
  }

  @SubscribeMessage('makeGuess')
  handleMakeGuess(
    @MessageBody() data: { guess: string; matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Received guess '${data.guess}' for match ${data.matchId}`);
    // TODO: Delegate to GuessService
  }
}
