import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from '../entities/player.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const { username, email, password } = createPlayerDto;

    // Check if user already exists
    const existingPlayer = await this.playerRepository.findOne({
      where: [{ username }, { email }],
    });
    if (existingPlayer) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new player
    const player = this.playerRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    await this.playerRepository.save(player);
    return player;
  }

  async findOne(username: string): Promise<Player | null> {
    return this.playerRepository.findOne({
      where: { username },
    });
  }
  
  async findById(id: string): Promise<Player | null> {
    return this.playerRepository.findOne({
      where: { id },
    });
  }
}
