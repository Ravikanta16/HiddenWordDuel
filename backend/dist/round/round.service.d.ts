import { GameGateway } from 'src/game/game.gateway';
import { Match } from 'src/entities/match.entity';
import { Round } from 'src/entities/round.entity';
import { Repository } from 'typeorm';
import { Player } from 'src/entities/player.entity';
export declare class RoundService {
    private roundRepository;
    private gameGateway;
    private readonly logger;
    constructor(roundRepository: Repository<Round>, gameGateway: GameGateway);
    createRound(match: Match): Promise<Round>;
    private startRound;
    private scheduleNextLetterReveal;
    endRound(round: Round, winner: Player | null): Promise<void>;
    getActiveRoundForMatch(matchId: string): Promise<Round | null>;
    private getActiveRoundById;
}
