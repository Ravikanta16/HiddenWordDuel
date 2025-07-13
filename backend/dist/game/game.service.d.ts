import { Socket } from 'socket.io';
import { Player } from 'src/entities/player.entity';
import { MatchService } from 'src/match/match.service';
export declare class GameService {
    private matchService;
    private readonly logger;
    private lobby;
    private activeMatches;
    constructor(matchService: MatchService);
    addPlayerToLobby(socket: Socket, player: Player): void;
    handleReconnect(player: Player, newSocket: Socket): void;
    handleDisconnect(client: Socket): void;
    concludeMatch(matchId: string): void;
    removePlayerFromLobby(socket: Socket): void;
}
