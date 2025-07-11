import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
export declare class GameGateway {
    private readonly gameService;
    server: Server;
    private readonly logger;
    constructor(gameService: GameService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinLobby(client: Socket): Promise<void>;
    handleMakeGuess(data: {
        guess: string;
        matchId: string;
    }, client: Socket): void;
}
