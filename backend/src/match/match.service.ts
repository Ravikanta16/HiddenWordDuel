import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from 'src/entities/match.entity';
import { Player } from 'src/entities/player.entity';
import { Repository } from 'typeorm';
import { RoundService } from 'src/round/round.service';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private roundService: RoundService,
  ) {}

  async createMatch(player1: Player, player2: Player): Promise<Match> {
    this.logger.log(`Creating match between ${player1.username} and ${player2.username}`);
    
    const newMatch = this.matchRepository.create({
      player1Id: player1.id,
      player2Id: player2.id,
      status: 'ongoing',
    });

    await this.matchRepository.save(newMatch);

    return newMatch;
  }
}
