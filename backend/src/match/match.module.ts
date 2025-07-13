import { Module, forwardRef } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from 'src/entities/match.entity';
import { Player } from 'src/entities/player.entity';
import { RoundModule } from 'src/round/round.module';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Player]),
    RoundModule,
    forwardRef(() => GameModule), // GameModule provides GameService & GameGateway
  ],
  providers: [MatchService],
  controllers: [MatchController],
  exports: [MatchService],
})
export class MatchModule {}