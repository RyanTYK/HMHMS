import { Entity, PrimaryColumn, Column } from 'typeorm';

// Small key/value store for server-generated values that must survive
// restarts, e.g. an auto-generated JWT signing secret.
@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key!: string;

  @Column({ type: 'text' })
  value!: string;
}
