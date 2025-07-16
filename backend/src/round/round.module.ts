import { forwardRef, Module } from '@nestjs/common';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from 'src/entities/round.entity';
import { GameModule } from 'src/game/game.module';
import { Player } from 'src/entities/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Round, Player]), forwardRef(() => GameModule),],
  providers: [RoundService],
  controllers: [RoundController],
  exports: [RoundService],
})
export class RoundModule {}
