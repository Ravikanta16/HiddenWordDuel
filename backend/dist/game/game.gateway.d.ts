import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { JwtService } from '@nestjs/jwt';
import { PlayerService } from 'src/player/player.service';
import { Player } from 'src/entities/player.entity';
import { GuessService } from 'src/guess/guess.service';
interface AuthenticatedSocket extends Socket {
    player: Player;
}
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly gameService;
    private readonly guessService;
    private readonly jwtService;
    private readonly playerService;
    server: Server;
    private readonly logger;
    constructor(gameService: GameService, guessService: GuessService, jwtService: JwtService, playerService: PlayerService);
    handleConnection(client: AuthenticatedSocket): Promise<AuthenticatedSocket | undefined>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleJoinLobby(client: AuthenticatedSocket): void;
    handleMakeGuess(data: {
        guess: string;
        matchId: string;
    }, client: AuthenticatedSocket): Promise<void>;
}
export {};
