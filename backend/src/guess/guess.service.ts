import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Guess } from 'src/entities/guess.entity';
import { Player } from 'src/entities/player.entity';
import { RoundService } from 'src/round/round.service';
import { Repository } from 'typeorm';

@Injectable()
export class GuessService {
  private readonly logger = new Logger(GuessService.name);

  constructor(
    @InjectRepository(Guess)
    private guessRepository: Repository<Guess>,
    @Inject(forwardRef(() => RoundService))
    private roundService: RoundService,
  ) {}

  async submitGuess(player: Player, matchId: string, word: string): Promise<{ isCorrect: boolean; secretWord: string }> {
    try {
      const round = await this.roundService.getActiveRoundForMatch(matchId);
      
      if (!round) {
        this.logger.warn(`No active round found for match ${matchId}`);
        return { isCorrect: false, secretWord: '' };
      }

      const normalizedGuess = word.toUpperCase().trim();
      const normalizedSecret = round.secretWord.toUpperCase().trim();

      // Create and save the guess
      const guess = this.guessRepository.create({
        player,
        round,
        word: normalizedGuess,
      });
      await this.guessRepository.save(guess);
      
      // Check if guess is correct
      const isCorrect = normalizedSecret === normalizedGuess;
      
      this.logger.log(`Player ${player.username} guessed "${word}" - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

      if (isCorrect) {
        await this.roundService.endRound(round, player);
      }

      return { isCorrect, secretWord: round.secretWord };
    } catch (error) {
      this.logger.error(`Error submitting guess: ${error.message}`);
      return { isCorrect: false, secretWord: '' };
    }
  }
}