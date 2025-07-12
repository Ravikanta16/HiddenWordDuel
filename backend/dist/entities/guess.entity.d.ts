import { Player } from './player.entity';
import { Round } from './round.entity';
export declare class Guess {
    id: string;
    player: Player;
    round: Round;
    word: string;
    timestamp: Date;
}
