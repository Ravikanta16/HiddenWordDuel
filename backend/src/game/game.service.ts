import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Player } from 'src/entities/player.entity';
import { MatchService } from 'src/match/match.service';
import { GameGateway } from './game.gateway';
// import { PlayerService } from 'src/player/player.service';

interface LobbyMember {
  socket: Socket;
  player: Player;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private lobby: LobbyMember[] = [];

  constructor(
    private matchService: MatchService,
    // private playerService: PlayerService, // Assuming PlayerService can find users
  ) {}

//   async getPlayerFromSocket(socket: Socket): Promise<Player | null> {
//     const players = await this.playerService.findAllForTesting();
//     const connectedPlayerId = (socket.handshake.query.playerId as string) || players[this.lobby.length]?.id;
//     if (!connectedPlayerId) return null;
    
//     return this.playerService.findById(connectedPlayerId);
//   }

  addPlayerToLobby(socket: Socket, player: Player) {
    this.logger.log(`Player ${player.username} (${socket.id}) joining lobby.`);
    // Prevent player from joining twice
    if(this.lobby.some(p => p.player.id === player.id)) {
      socket.emit('error', 'You are already in the lobby.');
      return;
    }

    this.lobby.push({ socket, player });
    socket.emit('lobbyJoined', { message: `Welcome ${player.username}, you are in the lobby.` });

    if (this.lobby.length >= 2) {
      this.logger.log('Two players in lobby. Creating a match.');
      const player1Info = this.lobby.shift();
      const player2Info = this.lobby.shift();

      if (!player1Info || !player2Info) {
        this.logger.error('Failed to start match: not enough players.');
        return;
      }

      this.matchService.createMatch(player1Info.player, player2Info.player)
        .then(match => {
           const matchRoom = `match_${match.id}`;
           player1Info.socket.join(matchRoom);
           player2Info.socket.join(matchRoom);
           player1Info.socket.to(matchRoom).emit('matchStart', { matchId: match.id, opponent: player2Info.player.username });
           player2Info.socket.emit('matchStart', { matchId: match.id, opponent: player1Info.player.username });
        });
    }
  }

  removePlayerFromLobby(socket: Socket) {
    const initialLobbySize = this.lobby.length;
    this.lobby = this.lobby.filter(p => p.socket.id !== socket.id);
    if(this.lobby.length < initialLobbySize) {
        this.logger.log(`Player ${socket.id} removed from lobby.`);
    }
  }
}
