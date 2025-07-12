import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameGateway } from 'src/game/game.gateway';
import { Match } from 'src/entities/match.entity';
import { Round } from 'src/entities/round.entity';
import { Repository } from 'typeorm';
import { Player } from 'src/entities/player.entity';

const WORD_LIST = ['DEVELOPER', 'WEBSOCKET', 'JAVASCRIPT', 'AUTHENTICATION', 'DATABASE'];
const TICK_RATE_MS = 10000; // Reveal a new letter every 10 seconds

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);

  constructor(
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  public async createRound(match: Match): Promise<Round> {
    const secretWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    
    const round = this.roundRepository.create({
      match,
      secretWord,
      revealedLetters: [],
      status: 'ongoing',
    });

    await this.roundRepository.save(round);
    this.logger.log(`New round created for match ${match.id} with word: ${secretWord}`);
    
    // We need to fetch the match with its relations to get the round count correctly.
    const updatedMatch = await this.roundRepository.manager.findOne(Match, { where: { id: match.id }, relations: ['rounds'] });
    
    if(!updatedMatch) {
      this.logger.error(`Failed to create round for match ${match.id}`);
      throw new Error('Failed to create round');
    }

    this.startRound(round, updatedMatch.rounds.length);
    
    return round;
  }

  private startRound(round: Round, roundNumber: number) {
    const matchRoom = `match_${round.match.id}`;
    
    this.gameGateway.server.to(matchRoom).emit('newRound', {
      roundId: round.id,
      wordLength: round.secretWord.length,
      roundNumber: roundNumber,
    });

    this.scheduleNextLetterReveal(round.id);
  }

  private scheduleNextLetterReveal(roundId: string) {
    setTimeout(async () => {
      const round = await this.getActiveRoundById(roundId);
      if (!round) return; // Round ended or not found

      const revealedCount = round.revealedLetters.length;
      if (revealedCount >= round.secretWord.length) {
        this.endRound(round, null);
        return;
      }

      let revealIndex;
      do {
        revealIndex = Math.floor(Math.random() * round.secretWord.length);
      } while (round.revealedLetters.includes(revealIndex));

      round.revealedLetters.push(revealIndex);
      await this.roundRepository.save(round);

      const matchRoom = `match_${round.match.id}`;
      this.gameGateway.server.to(matchRoom).emit('letterReveal', {
        index: revealIndex,
        letter: round.secretWord[revealIndex],
      });
      
      this.logger.log(`Revealed letter at index ${revealIndex} for round ${round.id}`);
      this.scheduleNextLetterReveal(roundId);

    }, TICK_RATE_MS);
  }

  public async endRound(round: Round, winner: Player | null) {
    if (round.status !== 'ongoing') return;

    round.status = 'finished';
    round.winner = winner;
    await this.roundRepository.save(round);

    const matchRoom = `match_${round.match.id}`;
    this.gameGateway.server.to(matchRoom).emit('roundEnd', {
      winner: winner ? winner.username : null,
      secretWord: round.secretWord,
    });
    
    this.logger.log(`Round ${round.id} ended. Winner: ${winner?.username || 'None'}`);
    // Future: Check win condition here
  }

  public async getActiveRoundForMatch(matchId: string): Promise<Round | null> {
    return this.roundRepository.findOne({
      where: { match: { id: matchId }, status: 'ongoing' },
      relations: ['match'],
    });
  }
  
  private async getActiveRoundById(roundId: string): Promise<Round | null> {
      return this.roundRepository.findOne({
          where: { id: roundId, status: 'ongoing' },
          relations: ['match']
      });
  }
}
