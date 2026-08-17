import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Monitor } from './Monitor';

@Entity('monitor_tags')
export class MonitorTag {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  monitor_id!: string;

  @Column({ type: 'varchar', length: 64 })
  tag!: string;

  @ManyToOne(() => Monitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitor_id' })
  monitor!: Monitor;
}
