import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Monitor } from './Monitor';

@Entity('check_logs')
@Index('idx_check_logs_monitor_timestamp', ['monitor_id', 'timestamp'])
@Index('idx_check_logs_timestamp', ['timestamp']) // For cleanup operations
export class CheckLog {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  monitor_id!: string;

  @Index()
  @Column({ type: 'datetime' })
  timestamp!: Date;

  @Column({ type: 'enum', enum: ['up', 'down'] })
  status!: 'up' | 'down';

  @Column({ type: 'int', nullable: true })
  response_time_ms?: number;

  @Column({ type: 'int', nullable: true })
  http_status?: number;

  @Column({ type: 'text', nullable: true })
  error_text?: string;

  @ManyToOne(() => Monitor, monitor => monitor.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitor_id' })
  monitor!: Monitor;
}
