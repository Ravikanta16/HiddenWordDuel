import { Socket } from 'socket.io';
import { Player } from 'src/entities/player.entity';
import { MatchService } from 'src/match/match.service';
import { PlayerService } from 'src/player/player.service';
export declare class GameService {
    private matchService;
    private playerService;
    private readonly logger;
    private lobby;
    constructor(matchService: MatchService, playerService: PlayerService);
    getPlayerFromSocket(socket: Socket): Promise<Player | null>;
    addPlayerToLobby(socket: Socket, player: Player): void;
    removePlayerFromLobby(socket: Socket): void;
}
