import { Module } from '@nestjs/common';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';

@Module({
  providers: [RoundService],
  controllers: [RoundController],
  exports: [RoundService],
})
export class RoundModule {}
