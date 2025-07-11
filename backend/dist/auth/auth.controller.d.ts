import { AuthService } from './auth.service';
import { CreatePlayerDto } from '../player/dto/create-player.dto';
import { PlayerService } from '../player/player.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    private playerService;
    constructor(authService: AuthService, playerService: PlayerService);
    register(createPlayerDto: CreatePlayerDto): Promise<import("../entities/player.entity").Player>;
    login(loginDto: LoginDto): Promise<{
        player: any;
        access_token: string;
    }>;
    getProfile(req: any): Promise<import("../entities/player.entity").Player | null>;
}
