import { PlayerService } from '../player/player.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private playerService;
    private jwtService;
    constructor(playerService: PlayerService, jwtService: JwtService);
    validatePlayer(username: string, pass: string): Promise<any>;
    login(player: any): Promise<{
        player: any;
        access_token: string;
    }>;
}
