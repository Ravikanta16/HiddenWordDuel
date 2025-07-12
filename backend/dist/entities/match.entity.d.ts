import { Player } from './player.entity';
import { Round } from './round.entity';
export declare class Match {
    id: string;
    status: 'ongoing' | 'completed';
    players: Player[];
    rounds: Round[];
    winnerId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
