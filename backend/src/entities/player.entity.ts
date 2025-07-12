import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany } from 'typeorm';
import { Guess } from './guess.entity';
import { Match } from './match.entity';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 0 })
  totalWins: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Guess, guess => guess.player)
  guesses: Guess[];

  // A player can be in many matches
  @ManyToMany(() => Match, match => match.players)
  matches: Match[];
} 