import { Guess } from 'src/entities/guess.entity';
import { Player } from 'src/entities/player.entity';
import { RoundService } from 'src/round/round.service';
import { Repository } from 'typeorm';
export declare class GuessService {
    private guessRepository;
    private roundService;
    private readonly logger;
    constructor(guessRepository: Repository<Guess>, roundService: RoundService);
    submitGuess(player: Player, matchId: string, word: string): Promise<{
        isCorrect: boolean;
        secretWord: string;
    }>;
}
