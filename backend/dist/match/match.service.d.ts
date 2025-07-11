import { Match } from 'src/entities/match.entity';
import { Player } from 'src/entities/player.entity';
import { Repository } from 'typeorm';
import { RoundService } from 'src/round/round.service';
export declare class MatchService {
    private matchRepository;
    private roundService;
    private readonly logger;
    constructor(matchRepository: Repository<Match>, roundService: RoundService);
    createMatch(player1: Player, player2: Player): Promise<Match>;
}
