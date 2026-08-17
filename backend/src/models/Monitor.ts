import 'reflect-metadata';
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Team } from './Team';
import { CheckLog } from './CheckLog';
import { SharedMonitor } from './SharedMonitor';
import { MonitorTag } from './MonitorTag';
import { MonitorDependency } from './MonitorDependency';

@Entity('monitors')
export class Monitor {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  // Owner user id for multi-tenant scoping
  @Column({ type: 'int' })
  @Index('idx_monitors_user_id')
  user_id!: number;

  // Optional team ownership
  @Column({ type: 'int', nullable: true })
  @Index('idx_monitors_team_id')
  team_id?: number;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'enum', enum: ['http', 'tcp', 'ping', 'smb'] })
  type!: 'http' | 'tcp' | 'ping' | 'smb';

  @Column({ type: 'varchar', length: 255 })
  target!: string;

  @Column({ type: 'int', nullable: true })
  port?: number;

  @Column({ type: 'int', default: 60 })
  interval_seconds!: number;

  @Column({ type: 'int', default: 5000 })
  timeout_ms!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_paused!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tags?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dependency?: string;

  @Column({ type: 'text', nullable: true })
  email_recipients?: string;

  @Column({ type: 'boolean', default: true })
  notify_alert!: boolean;

  @Column({ type: 'boolean', default: true })
  notify_owner!: boolean;

  // Retry settings
  @Column({ type: 'int', default: 60 })
  retry_interval!: number;

  @Column({ type: 'int', default: 3 })
  max_retries!: number;

  // Notification resend interval in minutes
  @Column({ type: 'int', default: 180 })
  notification_resend_after!: number;

  // Status tracking
  @Column({ type: 'timestamp', nullable: true })
  @Index('idx_monitors_last_check')
  last_check?: Date;

  @Column({ type: 'enum', enum: ['up', 'down', 'unknown'], default: 'unknown' })
  last_status!: 'up' | 'down' | 'unknown';

  @Column({ type: 'int', nullable: true })
  last_response_time?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.00 })
  uptime_percentage!: number;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Team, team => team.monitors, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team?: Team;

  @OneToMany(() => CheckLog, log => log.monitor)
  logs!: CheckLog[];

  @OneToMany(() => SharedMonitor, share => share.monitor)
  shares!: SharedMonitor[];

  @OneToMany(() => MonitorTag, tag => tag.monitor)
  monitorTags!: MonitorTag[];

  @OneToMany(() => MonitorDependency, dep => dep.monitor)
  dependencies!: MonitorDependency[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
