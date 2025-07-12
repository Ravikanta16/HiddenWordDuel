import { Socket } from 'socket.io';
import { Player } from 'src/entities/player.entity';
import { MatchService } from 'src/match/match.service';
export declare class GameService {
    private matchService;
    private readonly logger;
    private lobby;
    constructor(matchService: MatchService);
    addPlayerToLobby(socket: Socket, player: Player): void;
    removePlayerFromLobby(socket: Socket): void;
}
