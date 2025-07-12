import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Match } from './match.entity';
import { Player } from './player.entity';
import { Guess } from './guess.entity';

@Entity()
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column()
  // matchId: string;

  // @Column()
  // word: string;

  // @Column('boolean', { array: true })
  // revealedTiles: boolean[];

  // @Column({ nullable: true, type: 'uuid' })
  // winnerId: string | null;

  // @Column()
  // roundNumber: number;
// A round belongs to one match
  @ManyToOne(() => Match, match => match.rounds)
  match: Match;

  @Column()
  secretWord: string;

  // This is a simpler way to store revealed indices
  @Column('integer', { array: true, default: [] })
  revealedLetters: number[];

  @Column({ type: 'enum', enum: ['ongoing', 'finished'], default: 'ongoing' })
  status: 'ongoing' | 'finished';

  // A round has one winner
  @ManyToOne(() => Player, { nullable: true })
  winner: Player | null;

  // A round has many guesses
  @OneToMany(() => Guess, guess => guess.round)
  guesses: Guess[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  endedAt: Date;
} 