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
  import { ConfigService } from '@nestjs/config';
  
  // This custom type is crucial for type safety with our authenticated sockets.
  interface AuthenticatedSocket extends Socket {
    player: Player;
  }
  
  @WebSocketGateway({ cors: { origin: '*',
    credentials: true,
   } })
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
      private readonly configService: ConfigService,
    ) {}
  
    // This method runs every time a new client connects to the WebSocket server.
    async handleConnection(client: AuthenticatedSocket) {
      try{
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without a token.`);
        client.emit('error', 'Authentication token not provided.');
        return client.disconnect();
      }
      this.logger.debug(`Attempting to verify token for client ${client.id}`);
  
        const payload = await this.jwtService.verifyAsync(token,{
            secret: this.configService.get<string>('JWT_SECRET')
        });
        const player = await this.playerService.findById(payload.sub);
  
        if (!player) {
          this.logger.warn(`No player found for token payload: ${JSON.stringify(payload)}`);
          client.emit('error', 'Player not found');
          return client.disconnect();
        }
  
      
        // We attach the authenticated player's data directly to the socket object.
        client.player = player;
        this.logger.log(`Client ${client.id} authenticated as ${player.username}`);
  
      } catch (error) {
        this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
        client.emit('error', 'Authentication failed');
        // this.logger.error(`Authentication failed for ${client.id}: ${error.message}`);
        // client.emit('error', `Authentication failed: ${error.message}`);
        return client.disconnect();
      }
    }
  
    handleDisconnect(client: AuthenticatedSocket) {
      this.logger.log(`Client ${client.id} disconnected.`);
      // If the player was authenticated, we try to remove them from the lobby.
      if (client.player) {
        this.gameService.removePlayerFromLobby(client);
      }
    }
  
    @SubscribeMessage('joinLobby')
    handleJoinLobby(@ConnectedSocket() client: AuthenticatedSocket) {
      // Because of handleConnection, we can trust client.player exists.
      if (client.player) {
        this.gameService.addPlayerToLobby(client, client.player);
      } 
    // else {
    //       client.emit('error', 'You are not authenticated.');
    //   }
    }
  
    @SubscribeMessage('makeGuess')
async handleMakeGuess(
  @MessageBody() data: { guess: string; matchId: string },
  @ConnectedSocket() client: AuthenticatedSocket,
) {
  try {
    if (!client.player) {
      client.emit('error', 'Not authenticated');
      return;
    }

    this.logger.log(`Processing guess "${data.guess}" from player ${client.player.username}`);

    const result = await this.guessService.submitGuess(
      client.player,
      data.matchId,
      data.guess,
    );

    // Emit result to ALL players in the match
    const matchRoom = `match_${data.matchId}`;
    
    if (result.isCorrect) {
      this.server.to(matchRoom).emit('roundEnd', {
        winner: client.player.username,
        secretWord: result.secretWord
      });
    }

    // Emit individual result to the guessing player
    client.emit('guessResult', { 
      correct: result.isCorrect,
      message: result.isCorrect ? 'Correct guess!' : 'Incorrect guess'
    });

  } catch (error) {
    this.logger.error(`Error handling guess: ${error.message}`);
    client.emit('error', 'Failed to process guess');
  }
}
}