import { Controller, Post, Body, UnauthorizedException, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreatePlayerDto } from '../player/dto/create-player.dto';
import { PlayerService } from '../player/player.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private playerService: PlayerService,
  ) {}

  @Post('register')
  async register(@Body() createPlayerDto: CreatePlayerDto) {
    const player = await this.playerService.create(createPlayerDto);
    // You might want to automatically log in the user here and return a token
    return player;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const player = await this.authService.validatePlayer(loginDto.username, loginDto.password);
    if (!player) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(player);
  }

  // This is an example of a protected route
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // req.user is populated by the JwtStrategy.validate() method
    return this.playerService.findById(req.user.playerId);
  }
}
