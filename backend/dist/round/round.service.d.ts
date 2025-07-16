import { GameGateway } from 'src/game/game.gateway';
import { Match } from 'src/entities/match.entity';
import { Round } from 'src/entities/round.entity';
import { Repository } from 'typeorm';
import { Player } from 'src/entities/player.entity';
export declare class RoundService {
    private roundRepository;
    private playerRepository;
    private gameGateway;
    private readonly logger;
    private guessesThisTick;
    private gracePeriodTimers;
    private firstCorrectGuessers;
    constructor(roundRepository: Repository<Round>, playerRepository: Repository<Player>, gameGateway: GameGateway);
    createRound(match: Match): Promise<Round>;
    private startRound;
    private scheduleNextLetterReveal;
    initiateRoundEnd(round: Round, guesser: Player): void;
    endRound(round: Round, winner: Player | null): Promise<void>;
    forceStopRound(roundId: string): Promise<void>;
    getActiveRoundForMatch(matchId: string): Promise<Round | null>;
    private getActiveRoundById;
    canPlayerGuess(roundId: string, playerId: string): boolean;
    recordGuess(roundId: string, playerId: string): void;
}
