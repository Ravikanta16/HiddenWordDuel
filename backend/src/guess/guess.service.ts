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
        this.logger.warn(`No active round for guess attempt in match ${matchId}`);
        return { isCorrect: false, secretWord: '' };
      }

      // VALIDATION: Check if the player is allowed to guess in this tick.
      if (!this.roundService.canPlayerGuess(round.id, player.id)) {
        this.logger.warn(`Player ${player.username} tried to guess more than once per tick.`);
        // Optionally, emit a specific error back to the user.
        return { isCorrect: false, secretWord: '' };
      }

      this.roundService.recordGuess(round.id, player.id);
    
      const isCorrect = round.secretWord.toUpperCase() === word.toUpperCase().trim();

      // Create and save the guess
      const guess = this.guessRepository.create({
        player,
        round,
        word,
      });
      await this.guessRepository.save(guess);
      
      await this.roundService.endRound(round, player);

      if (isCorrect) {
        this.logger.log(`Player ${player.username} guessed correctly! Initiating end of round.`);
        this.roundService.initiateRoundEnd(round, player);
      }

      return { isCorrect, secretWord: round.secretWord };
    } catch (error) {
      this.logger.error(`Error submitting guess: ${error.message}`);
      return { isCorrect: false, secretWord: '' };
    }
  }
}