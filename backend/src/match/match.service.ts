import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameGateway } from 'src/game/game.gateway';
import { GameService } from 'src/game/game.service';
import { Match } from 'src/entities/match.entity';
import { Player } from 'src/entities/player.entity';
import { Repository } from 'typeorm';
import { RoundService } from 'src/round/round.service';

const RECONNECTION_TIMEOUT_MS = 10000; // 10 seconds

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  // This map will store forfeit timers. Key: matchId, Value: NodeJS.Timeout
  private forfeitTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private roundService: RoundService,
    @Inject(forwardRef(() => GameService))
    private gameService: GameService,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  async createMatch(player1: Player, player2: Player): Promise<Match> {
    this.logger.log(`Creating match between ${player1.username} and ${player2.username}`);
    
    const newMatch = this.matchRepository.create({
      players: [player1, player2],
      status: 'ongoing',
    });

    await this.matchRepository.save(newMatch);

    this.roundService.createRound(newMatch);

    return newMatch;
  }

  handlePlayerDisconnect(matchId: string, disconnectedPlayerId: string) {
    const matchRoom = `match_${matchId}`;
    this.gameGateway.server.to(matchRoom).emit('playerDisconnected', { 
      message: `A player has disconnected. The game will end in ${RECONNECTION_TIMEOUT_MS / 1000} seconds if they don't reconnect.` 
    });

    // Set a timer for the player to reconnect
    const timer = setTimeout(() => {
      this.awardWinByForfeit(matchId, disconnectedPlayerId);
    }, RECONNECTION_TIMEOUT_MS);

    this.forfeitTimers.set(matchId, timer);
  }

  async awardWinByForfeit(matchId: string, disconnectedPlayerId: string) {
    this.forfeitTimers.delete(matchId); // Clean up timer reference
    const activeRound = await this.roundService.getActiveRoundForMatch(matchId);
    if (activeRound) {
        await this.roundService.forceStopRound(activeRound.id);
    }

    const match = await this.matchRepository.findOne({ where: { id: matchId }, relations: ['players'] });
    if (!match || match.status !== 'ongoing') {
      return;
    }

    const winningPlayer = match.players.find(p => p.id !== disconnectedPlayerId);
    if (!winningPlayer) return;

    this.logger.log(`Player ${winningPlayer.username} wins match ${matchId} by forfeit.`);
    match.status = 'completed';
    match.winnerId = winningPlayer.id;
    await this.matchRepository.save(match);
    
    // Announce the winner
    const matchRoom = `match_${matchId}`;
    this.gameGateway.server.to(matchRoom).emit('gameOver', {
      winner: winningPlayer.username,
      reason: `Opponent disconnected and failed to reconnect.`
    });

    // Clean up active match tracking
    this.gameService.concludeMatch(matchId);
  }

  // We will expand on this in the next step
  handlePlayerReconnect(matchId: string, playerId: string) {
    // If a player reconnects, we must clear the forfeit timer.
    const timer = this.forfeitTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.forfeitTimers.delete(matchId);
      this.logger.log(`Player ${playerId} reconnected to match ${matchId}. Forfeit averted.`);
      const matchRoom = `match_${matchId}`;
      this.gameGateway.server.to(matchRoom).emit('playerReconnected', {
        message: 'Opponent has reconnected!'
      });
    }
  }
}