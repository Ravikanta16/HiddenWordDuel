import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { MatchModule } from 'src/match/match.module';
import { PlayerModule } from 'src/player/player.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { GuessModule } from 'src/guess/guess.module';
import { forwardRef } from '@nestjs/common';
import { RoundModule } from 'src/round/round.module';

@Module({
  imports: [
    MatchModule,
    PlayerModule,
    AuthModule,
    JwtModule,
    GuessModule,
    forwardRef(() => RoundModule),
  ],
  providers: [GameService, GameGateway],
  exports: [GameService, GameGateway],
})
export class GameModule {}
