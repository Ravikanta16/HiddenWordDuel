import { Module } from '@nestjs/common';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';

@Module({
  providers: [RoundService],
  controllers: [RoundController]
})
export class RoundModule {}
