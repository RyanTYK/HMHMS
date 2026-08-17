import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Monitor } from './Monitor';
import { User } from './User';
import { Team } from './Team';

export enum ShareRole {
  VIEWER = 'viewer',
  EDITOR = 'editor'
}

export enum ShareStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined'
}

@Entity('shared_monitors')
export class SharedMonitor {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  monitor_id!: string;

  @Column({ type: 'int' })
  shared_by!: number;

  @Column({ type: 'int', nullable: true })
  shared_with_user?: number;

  @Column({ type: 'int', nullable: true })
  shared_with_team?: number;

  @Column({ type: 'enum', enum: ShareRole, default: ShareRole.VIEWER })
  role!: ShareRole;

  @Column({ type: 'enum', enum: ShareStatus, default: ShareStatus.PENDING })
  status!: ShareStatus;

  @ManyToOne(() => Monitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitor_id' })
  monitor!: Monitor;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_by' })
  sharedBy!: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_with_user' })
  sharedWithUser?: User;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_with_team' })
  sharedWithTeam?: Team;

  @CreateDateColumn()
  shared_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  responded_at?: Date;
}
