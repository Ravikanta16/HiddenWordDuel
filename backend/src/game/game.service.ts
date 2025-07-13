import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Player } from 'src/entities/player.entity';
import { MatchService } from 'src/match/match.service';

interface LobbyMember {
  socket: Socket;
  player: Player;
}

// Add an interface for our active matches
interface ActiveMatch {
  matchId: string;
  players: Map<string, Socket>; // <playerId, socket>
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private lobby: LobbyMember[] = [];

  // This map will store ongoing matches. Key: matchId, Value: ActiveMatch
  private activeMatches = new Map<string, ActiveMatch>();

  constructor(
    @Inject(forwardRef(() => MatchService))
    private matchService: MatchService,
  ) {}

  addPlayerToLobby(socket: Socket, player: Player) {
    this.logger.log(`Player ${player.username} (${socket.id}) joining lobby.`);
    if (this.lobby.some(p => p.player.id === player.id)) {
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
        this.logger.error('Failed to create match: insufficient players in lobby');
        return;
      }

      this.matchService.createMatch(player1Info.player, player2Info.player)
        .then(match => {
           const matchRoom = `match_${match.id}`;
           player1Info.socket.join(matchRoom);
           player2Info.socket.join(matchRoom);

           // Track the new active match
           const playersMap = new Map<string, Socket>();
           playersMap.set(player1Info.player.id, player1Info.socket);
           playersMap.set(player2Info.player.id, player2Info.socket);
           this.activeMatches.set(match.id, { matchId: match.id, players: playersMap });

           //player1Info.socket.to(matchRoom).emit('matchStart', { matchId: match.id, opponent: player2Info.player.username });
           player1Info.socket.emit('matchStart', { matchId: match.id, opponent: player2Info.player.username });
           player2Info.socket.emit('matchStart', { matchId: match.id, opponent: player1Info.player.username });
        });
    }
  }

  handleReconnect(player: Player, newSocket: Socket) {
    for (const [matchId, match] of this.activeMatches.entries()) {
      // Check if the reconnected player belongs to this match
      if (match.players.has(player.id)) {
        this.logger.log(`Player ${player.username} is reconnecting to match ${matchId}`);
        
        // Update the socket instance for the reconnected player
        match.players.set(player.id, newSocket);
        
        // Have the new socket join the match room
        newSocket.join(`match_${matchId}`);
        
        // Notify MatchService to cancel the forfeit timer
        this.matchService.handlePlayerReconnect(matchId, player.id);
        
        return; // Player found, no need to check other matches
      }
    }
  }

  // This method will be called from the GameGateway's disconnect handler
  handleDisconnect(client: Socket) {
    // The player object is attached to the socket during authentication
    const disconnectedPlayerId = (client as any).player?.id;
    if (!disconnectedPlayerId) return;

    // Remove from lobby if they were there
    this.removePlayerFromLobby(client);
    
    // Check if the player was in an active match
    for (const [matchId, match] of this.activeMatches.entries()) {
      if (match.players.has(disconnectedPlayerId)) {
        this.logger.log(`Player ${disconnectedPlayerId} from match ${matchId} has disconnected.`);
        // Delegate to MatchService to handle the forfeit logic
        this.matchService.handlePlayerDisconnect(matchId, disconnectedPlayerId);
        break; // A player can only be in one match at a time
      }
    }
  }

  // New method to clean up a finished match
  concludeMatch(matchId: string) {
    this.activeMatches.delete(matchId);
    this.logger.log(`Match ${matchId} concluded and removed from active tracking.`);
  }

  removePlayerFromLobby(socket: Socket) {
    const initialLobbySize = this.lobby.length;
    this.lobby = this.lobby.filter(p => p.socket.id !== socket.id);
    if (this.lobby.length < initialLobbySize) {
        this.logger.log(`Player ${socket.id} removed from lobby.`);
    }
  }
}