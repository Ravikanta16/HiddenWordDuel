import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, } from 'typeorm';
import { Player } from './player.entity';
import { Round } from './round.entity';

@Entity()
export class Guess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column()
  // roundId: string;

  // @Column()
  // playerId: string;

  // @Column()
  // guess: string;

  // @Column({ default: false })
  // isCorrect: boolean;
  // A guess belongs to one player
  @ManyToOne(() => Player, player => player.guesses)
  player: Player;

  // A guess belongs to one round
  @ManyToOne(() => Round, round => round.guesses)
  round: Round;

  @Column()
  word: string;

  @CreateDateColumn()
  timestamp: Date;
} 