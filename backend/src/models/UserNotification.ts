import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Monitor } from './Monitor';

export enum NotificationType {
  ALERT = 'alert',
  SYSTEM = 'system'
}

@Entity('user_notifications')
export class UserNotification {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  related_monitor_id?: string;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  action_url?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Monitor, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'related_monitor_id' })
  relatedMonitor?: Monitor;

  @CreateDateColumn()
  created_at!: Date;
}
