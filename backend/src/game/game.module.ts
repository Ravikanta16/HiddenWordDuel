import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { MatchModule } from 'src/match/match.module';
import { PlayerModule } from 'src/player/player.module';

@Module({
  imports: [MatchModule, PlayerModule],
  providers: [GameService, GameGateway],
})
export class GameModule {}
