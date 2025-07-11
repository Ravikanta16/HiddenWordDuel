import { Module } from '@nestjs/common';
import { GuessService } from './guess.service';
import { GuessController } from './guess.controller';

@Module({
  providers: [GuessService],
  controllers: [GuessController]
})
export class GuessModule {}
