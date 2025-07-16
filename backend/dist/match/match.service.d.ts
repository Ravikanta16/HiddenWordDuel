import { GameGateway } from 'src/game/game.gateway';
import { GameService } from 'src/game/game.service';
import { Match } from 'src/entities/match.entity';
import { Player } from 'src/entities/player.entity';
import { Repository } from 'typeorm';
import { RoundService } from 'src/round/round.service';
export declare class MatchService {
    private matchRepository;
    private playerRepository;
    private roundService;
    private gameService;
    private gameGateway;
    private readonly logger;
    private forfeitTimers;
    constructor(matchRepository: Repository<Match>, playerRepository: Repository<Player>, roundService: RoundService, gameService: GameService, gameGateway: GameGateway);
    createMatch(player1: Player, player2: Player): Promise<Match>;
    handlePlayerDisconnect(matchId: string, disconnectedPlayerId: string): void;
    awardWinByForfeit(matchId: string, disconnectedPlayerId: string): Promise<void>;
    handlePlayerReconnect(matchId: string, playerId: string): void;
}
