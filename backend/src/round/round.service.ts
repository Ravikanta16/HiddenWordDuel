import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameGateway } from 'src/game/game.gateway';
import { Match } from 'src/entities/match.entity';
import { Round } from 'src/entities/round.entity';
import { Repository } from 'typeorm';
import { Player } from 'src/entities/player.entity';

//const WORD_LIST = ['DEVELOPER', 'WEBSOCKET', 'JAVASCRIPT', 'AUTHENTICATION', 'DATABASE'];
const WORD_LIST = ['ABCD', 'EFGH', 'IJKL', 'MNOP', 'QRST', 'UVWX', 'YZ'];
const TICK_RATE_MS = 10000;
const DRAW_GRACE_PERIOD_MS = 2000;

const socket_constants = {
  newRound: 'newRound',
  letterReveal: 'letterReveal',
  roundEnd: 'roundEnd',
}

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);

  // This map will store which players have guessed in the current tick for each round.
  // Key: roundId (string), Value: Set of playerIds (string)
  private guessesThisTick = new Map<string, Set<string>>();

  private gracePeriodTimers = new Map<string, NodeJS.Timeout>();
  private firstCorrectGuessers = new Map<string, Player>();


  constructor(
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
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

    const updatedMatch = await this.roundRepository.manager.findOne(Match, {
      where: { id: match.id },
      relations: ['rounds'],
    });

    this.startRound(round, updatedMatch?.rounds.length || 0);

    return round;
  }

  private startRound(round: Round, roundNumber: number) {
    

    // Clear any leftover guess data for this round and initialize a new Set.
    this.guessesThisTick.set(round.id, new Set());
    const matchRoom = `match_${round.match.id}`;

    this.gameGateway.server.to(matchRoom).emit(socket_constants.newRound, {
      roundId: round.id,
      wordLength: round.secretWord.length,
      roundNumber: roundNumber,
    });

    this.scheduleNextLetterReveal(round.id);
  }

  private scheduleNextLetterReveal(roundId: string) {
    setTimeout(async () => {
      const round = await this.getActiveRoundById(roundId);
      if (!round) return;

      // Clear the guess list for the new tick, BEFORE revealing the letter.
      this.guessesThisTick.set(roundId, new Set());
      
      const revealedCount = round.revealedLetters.length;
      if (revealedCount >= round.secretWord.length) {
        this.endRound(round, null); // Draw condition
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

      this.logger.log(`Revealed letter at index ${revealIndex} for round ${round.id}. Players can now guess.`);

      this.scheduleNextLetterReveal(roundId);
    }, TICK_RATE_MS);
  }

  public initiateRoundEnd(round: Round, guesser: Player) {
    if (this.gracePeriodTimers.has(round.id)) {
      this.logger.log(`Second correct guess received for round ${round.id}. It's a draw!`);
      clearTimeout(this.gracePeriodTimers.get(round.id));
      this.gracePeriodTimers.delete(round.id);
      this.endRound(round, null);
    } else { 
      this.logger.log(`First correct guess by ${guesser.username}. Starting draw grace period.`);
      this.firstCorrectGuessers.set(round.id, guesser);
      const timer = setTimeout(() => {
        this.logger.log(`Grace period ended. ${guesser.username} is the sole winner.`);
        this.endRound(round, guesser);
      }, DRAW_GRACE_PERIOD_MS);
      this.gracePeriodTimers.set(round.id, timer);
    }
  }

  public async endRound(round: Round, winner: Player | null) {
    if (round.status !== 'ongoing') return;
    
    // Clean up all tracking maps for this round
    this.gracePeriodTimers.delete(round.id);
    this.firstCorrectGuessers.delete(round.id);
    this.guessesThisTick.delete(round.id);

    round.status = 'finished';
    round.winner = winner;
    if (winner) {
      winner.totalWins++;
      await this.playerRepository.save(winner);
    }

    await this.roundRepository.save(round);

    const matchRoom = `match_${round.match.id}`;
    this.gameGateway.server.to(matchRoom).emit('roundEnd', {
      winner: winner ? winner.username : null,
      secretWord: round.secretWord,
    });
    this.logger.log(`Round ${round.id} ended. Winner: ${winner?.username || 'None (Draw)'}`);
  }

  public async forceStopRound(roundId: string) {
    const round = await this.getActiveRoundById(roundId);
    if (round) {
        this.logger.log(`Force stopping round ${round.id} due to forfeit.`);
        round.status = 'finished'; // Changing the status is enough to stop the setTimeout loop
        await this.roundRepository.save(round);
        this.guessesThisTick.delete(round.id); // Clean up memory
    }
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
      relations: ['match'],
    });
  }
  
  // New method to be called by GuessService
  public canPlayerGuess(roundId: string, playerId: string): boolean {
    const playersWhoGuessed = this.guessesThisTick.get(roundId);
    // If the Set exists, check if the player is NOT in it.
    return playersWhoGuessed ? !playersWhoGuessed.has(playerId) : false;
  }

  // New method to be called by GuessService
  public recordGuess(roundId: string, playerId: string) {
    this.guessesThisTick.get(roundId)?.add(playerId);
  }
}