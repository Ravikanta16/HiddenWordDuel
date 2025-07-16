import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlayerService } from 'src/player/player.service';
import { Player } from 'src/entities/player.entity';
import { GuessService } from 'src/guess/guess.service';
import { MatchService } from 'src/match/match.service';

interface AuthenticatedSocket extends Socket {
  player: Player;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    private readonly guessService: GuessService,
    private readonly jwtService: JwtService,
    private readonly playerService: PlayerService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth.token;
    if (!token) {
      this.logger.warn(`Client ${client.id} connected without a token. Disconnecting.`);
      return client.disconnect();
    }
    try {
      const payload = this.jwtService.verify(token);
      const player = await this.playerService.findById(payload.sub);
      if (!player) {
        this.logger.warn(`Player not found for token payload. Disconnecting.`);
        return client.disconnect();
      }
      client.player = player;
      this.logger.log(`Client ${client.id} authenticated as ${player.username}`);

      this.gameService.handleReconnect(player, client);

    } catch (error) {
      // This will now log the specific JWT error (e.g., "jwt expired", "invalid signature")
      this.logger.error(`Authentication failed for ${client.id}: ${error.message}. Disconnecting.`);
      return client.disconnect();
    }
  }



  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected.`);
    // Delegate all disconnect logic to the GameService
    this.gameService.handleDisconnect(client);
  }

  @SubscribeMessage('joinLobby')
  handleJoinLobby(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.player) {
      this.gameService.addPlayerToLobby(client, client.player);
    }
  }

  @SubscribeMessage('makeGuess')
  async handleMakeGuess(
    @MessageBody() data: { guess: string; matchId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.player) {
      return;
    }
    const result = await this.guessService.submitGuess(
      client.player,
      data.matchId,
      data.guess,
    );

    client.emit('guessResult', {
      correct: result.isCorrect,
      message: result.isCorrect ? 'Correct guess! Waiting for draw/win...' : 'Incorrect guess.',
    });

    // if (result.isCorrect) {
    //    this.server.to(`match_${data.matchId}`).emit('roundEnd', {
    //     winner: client.player.username,
    //     secretWord: result.secretWord
    //   });
    // } else {
    //   client.emit('incorrectGuess', { message: 'That was not the correct word.' });
    // }
  }
}