import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  monitor_id!: string;

  @Column({ type: 'enum', enum: ['down', 'up'] })
  event_type!: 'down' | 'up';

  @Column({ type: 'varchar', length: 255 })
  sent_to!: string;

  @Column({ type: 'datetime' })
  sent_at!: Date;
}
