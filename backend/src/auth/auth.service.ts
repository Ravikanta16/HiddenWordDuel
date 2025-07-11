import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PlayerService } from '../player/player.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Player } from 'src/entities/player.entity';

@Injectable()
export class AuthService {
  constructor(
    private playerService: PlayerService,
    private jwtService: JwtService,
  ) {}

  async validatePlayer(username: string, pass: string): Promise<any> {
    const player = await this.playerService.findOne(username);
    if (player && (await bcrypt.compare(pass, player.password))) {
      const { password, ...result } = player;
      return result;
    }
    return null;
  }

  async login(player: any) {
    const payload = { username: player.username, sub: player.id };
    return {
      player:player,
      access_token: this.jwtService.sign(payload),
    };
  }
}
