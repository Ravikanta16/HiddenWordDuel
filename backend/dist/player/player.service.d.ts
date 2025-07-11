import { Player } from '../entities/player.entity';
import { Repository } from 'typeorm';
import { CreatePlayerDto } from './dto/create-player.dto';
export declare class PlayerService {
    private playerRepository;
    constructor(playerRepository: Repository<Player>);
    create(createPlayerDto: CreatePlayerDto): Promise<Player>;
    findOne(username: string): Promise<Player | null>;
    findById(id: string): Promise<Player | null>;
}
