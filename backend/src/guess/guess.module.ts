import { Module } from '@nestjs/common';
import { GuessService } from './guess.service';
import { GuessController } from './guess.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guess } from 'src/entities/guess.entity';
import { RoundModule } from 'src/round/round.module';

@Module({
  imports: [TypeOrmModule.forFeature([Guess]), RoundModule],
  providers: [GuessService],
  controllers: [GuessController],
  exports: [GuessService],
})
export class GuessModule {}
