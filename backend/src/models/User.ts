import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 128, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  password_hash!: string | null;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'boolean', default: true })
  browser_notifications_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  email_verified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verification_token!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verification_token_expires!: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  oauth_provider!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  oauth_id!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url!: string | null;
}
