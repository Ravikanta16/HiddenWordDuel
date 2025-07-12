import { Guess } from './guess.entity';
import { Match } from './match.entity';
export declare class Player {
    id: string;
    username: string;
    email: string;
    password: string;
    totalWins: number;
    createdAt: Date;
    guesses: Guess[];
    matches: Match[];
}
