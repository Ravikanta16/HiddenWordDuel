import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column()
  word: string;

  @Column('boolean', { array: true })
  revealedTiles: boolean[];

  @Column({ nullable: true, type: 'uuid' })
  winnerId: string | null;

  @Column()
  roundNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  endedAt: Date;
} 