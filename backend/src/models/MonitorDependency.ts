import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Monitor } from './Monitor';

@Entity('monitor_dependencies')
export class MonitorDependency {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  monitor_id!: string;

  @Column({ type: 'varchar', length: 36 })
  depends_on_monitor_id!: string;

  @ManyToOne(() => Monitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitor_id' })
  monitor!: Monitor;

  @ManyToOne(() => Monitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'depends_on_monitor_id' })
  dependsOnMonitor!: Monitor;

  @CreateDateColumn()
  created_at!: Date;
}
