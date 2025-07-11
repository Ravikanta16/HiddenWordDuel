import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Guess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roundId: string;

  @Column()
  playerId: string;

  @Column()
  guess: string;

  @Column({ default: false })
  isCorrect: boolean;

  @CreateDateColumn()
  timestamp: Date;
} 