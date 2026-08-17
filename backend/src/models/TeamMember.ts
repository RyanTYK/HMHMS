import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Team } from './Team';
import { User } from './User';

export enum TeamMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum TeamMemberStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'int' })
  team_id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ type: 'enum', enum: TeamMemberRole, default: TeamMemberRole.MEMBER })
  role!: TeamMemberRole;

  @Column({ type: 'enum', enum: TeamMemberStatus, default: TeamMemberStatus.PENDING })
  status!: TeamMemberStatus;

  @ManyToOne(() => Team, team => team.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn()
  joined_at!: Date;
}
