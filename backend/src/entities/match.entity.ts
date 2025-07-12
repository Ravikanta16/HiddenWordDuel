import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Player } from './player.entity';
import { Round } from './round.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column()
  // player1Id: string;

  // @Column()
  // player2Id: string;

  // @Column({ default: 0 })
  // score1: number;

  // @Column({ default: 0 })
  // score2: number;

  @Column({ type: 'enum', enum: ['ongoing', 'completed'], default: 'ongoing' })
  status: 'ongoing' | 'completed';

   // A match has many players
   @ManyToMany(() => Player, player => player.matches)
   @JoinTable() // This creates the join table
   players: Player[];
   
   // A match has many rounds
   @OneToMany(() => Round, round => round.match)
   rounds: Round[];
   
   // A match can have one winner
   @Column({ type: 'uuid', nullable: true })
   winnerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 