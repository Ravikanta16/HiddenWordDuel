import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  player1Id: string;

  @Column()
  player2Id: string;

  @Column({ default: 0 })
  score1: number;

  @Column({ default: 0 })
  score2: number;

  @Column({ type: 'enum', enum: ['ongoing', 'completed'], default: 'ongoing' })
  status: 'ongoing' | 'completed';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 