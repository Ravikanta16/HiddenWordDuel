import { Match } from './match.entity';
import { Player } from './player.entity';
import { Guess } from './guess.entity';
export declare class Round {
    id: string;
    match: Match;
    secretWord: string;
    revealedLetters: number[];
    status: 'ongoing' | 'finished';
    winner: Player | null;
    guesses: Guess[];
    createdAt: Date;
    endedAt: Date;
}
