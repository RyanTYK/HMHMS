import { AppDataSource } from '../utils/data-source';
import { Team } from '../models/Team';
import { TeamMember, TeamMemberRole, TeamMemberStatus } from '../models/TeamMember';
import { User } from '../models/User';
import { notificationService } from './notificationService';
import { NotificationType } from '../models/UserNotification';

export class TeamService {
  private teamRepository = AppDataSource.getRepository(Team);
  private teamMemberRepository = AppDataSource.getRepository(TeamMember);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Create a new team
   */
  async createTeam(userId: number, name: string, description?: string): Promise<Team> {
    // Create team
    const team = this.teamRepository.create({
      name,
      description,
      created_by: userId
    });
    await this.teamRepository.save(team);

    // Add creator as owner (active)
    const teamMember = this.teamMemberRepository.create({
      team_id: team.id,
      user_id: userId,
      role: TeamMemberRole.OWNER,
      status: TeamMemberStatus.ACTIVE
    });
    await this.teamMemberRepository.save(teamMember);

    return team;
  }

  /**
   * Get all teams for a user (as member or creator)
   */
  async getUserTeams(userId: number): Promise<Team[]> {
    const teams = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.user_id = :userId', { userId })
      .andWhere('member.status = :activeStatus', { activeStatus: TeamMemberStatus.ACTIVE })
      .orderBy('team.created_at', 'DESC')
      .getMany();

    // Add memberCount and monitorCount to each team
    const { Monitor } = require('../models/Monitor');
    const monitorRepository = AppDataSource.getRepository(Monitor);

    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        // Count all active members for this team (owner, admin, member)
        const memberCount = await this.teamMemberRepository.count({
          where: { team_id: team.id, status: TeamMemberStatus.ACTIVE }
        });

        // Count monitors for this team
        const monitorCount = await monitorRepository.count({
          where: { team_id: team.id }
        });

        return {
          ...team,
          memberCount,
          monitorCount
        };
      })
    );

    return teamsWithCounts;
  }

  /**
   * Get team by ID with members
   */
  async getTeamById(teamId: number, userId: number): Promise<Team | null> {
    // First verify user is a member
    const isMember = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!isMember) {
      throw new Error('Not a team member');
    }

    // Get full team with only active members
    const team = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.members', 'member', 'member.status = :activeStatus', { activeStatus: TeamMemberStatus.ACTIVE })
      .leftJoinAndSelect('member.user', 'user')
      .where('team.id = :teamId', { teamId })
      .getOne();
    return team;
  }

  /**
   * Update team details
   */
  async updateTeam(teamId: number, userId: number, updates: { name?: string; description?: string }): Promise<Team> {
    // Check if user has permission (owner or admin)
    const member = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!member || (member.role !== TeamMemberRole.OWNER && member.role !== TeamMemberRole.ADMIN)) {
      throw new Error('Insufficient permissions');
    }

    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new Error('Team not found');
    }

    if (updates.name) team.name = updates.name;
    if (updates.description !== undefined) team.description = updates.description;

    await this.teamRepository.save(team);
    return team;
  }

  /**
   * Delete team (owner only)
   */
  async deleteTeam(teamId: number, userId: number): Promise<void> {
    // Check if user is owner
    const member = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!member || member.role !== TeamMemberRole.OWNER) {
      throw new Error('Only team owner can delete the team');
    }

    await this.teamRepository.delete(teamId);
  }

  /**
   * Add member to team
   */
  async addMember(teamId: number, userId: number, newMemberEmail: string, role: TeamMemberRole = TeamMemberRole.MEMBER): Promise<TeamMember> {
    // Check if user has permission (owner or admin)
    const requester = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!requester || (requester.role !== TeamMemberRole.OWNER && requester.role !== TeamMemberRole.ADMIN)) {
      throw new Error('Insufficient permissions');
    }

    // Find user by email
    const newUser = await this.userRepository.findOne({
      where: { email: newMemberEmail }
    });

    if (!newUser) {
      throw new Error('User not found');
    }

    // Check if already a member
    const existing = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: newUser.id }
    });

    if (existing) {
      throw new Error('User is already a team member');
    }

    // Add member as pending
    const teamMember = this.teamMemberRepository.create({
      team_id: teamId,
      user_id: newUser.id,
      role,
      status: TeamMemberStatus.PENDING
    });

    await this.teamMemberRepository.save(teamMember);

    // Send invite notification
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    await notificationService.createNotification({
      userId: newUser.id,
      type: NotificationType.INVITE,
      title: `Team Invitation: ${team?.name || 'Team'}`,
      message: `You have been invited to join the team '${team?.name || ''}'. Accept to become a member.`,
      relatedTeamId: teamId,
      actionUrl: `/teams/${teamId}/accept-invite`
    });

    // Reload with user relation
    const savedMember = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: newUser.id },
      relations: ['user']
    });
    return savedMember!;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: number, userId: number, memberIdToRemove: number): Promise<void> {
    // Check if user has permission (owner or admin)
    const requester = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!requester || (requester.role !== TeamMemberRole.OWNER && requester.role !== TeamMemberRole.ADMIN)) {
      throw new Error('Insufficient permissions');
    }

    // Cannot remove owner
    const memberToRemove = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: memberIdToRemove }
    });

    if (!memberToRemove) {
      throw new Error('Member not found');
    }

    if (memberToRemove.role === TeamMemberRole.OWNER) {
      throw new Error('Cannot remove team owner');
    }

    await this.teamMemberRepository.delete({ team_id: teamId, user_id: memberIdToRemove });
  }

  /**
   * Update member role
   */
  async updateMemberRole(teamId: number, userId: number, memberIdToUpdate: number, newRole: TeamMemberRole): Promise<TeamMember> {
    // Only owner can change roles
    const requester = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!requester || requester.role !== TeamMemberRole.OWNER) {
      throw new Error('Only team owner can change member roles');
    }

    const member = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: memberIdToUpdate }
    });

    if (!member) {
      throw new Error('Member not found');
    }

    // Cannot change owner role
    if (member.role === TeamMemberRole.OWNER) {
      throw new Error('Cannot change owner role');
    }

    member.role = newRole;
    await this.teamMemberRepository.save(member);
    return member;
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: number, userId: number): Promise<TeamMember[]> {
    // Verify user is a member
    const isMember = await this.teamMemberRepository.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!isMember) {
      throw new Error('Not a team member');
    }

    const members = await this.teamMemberRepository.find({
      where: { team_id: teamId, status: TeamMemberStatus.ACTIVE },
      relations: ['user'],
      order: { joined_at: 'ASC' }
    });
    return members;
  }

  /**
   * Accept a team invite (activate membership)
   */
  async acceptInvite(teamId: number, userId: number): Promise<TeamMember> {
    try {
      if (!userId) {
        throw new Error('Unauthorized');
      }
      const member = await this.teamMemberRepository.findOne({
        where: { team_id: teamId, user_id: userId, status: TeamMemberStatus.PENDING }
      });
      console.log('[acceptInvite] Found member:', member);
      if (!member) {
        throw new Error('No pending invite found');
      }
      member.status = TeamMemberStatus.ACTIVE;
      await this.teamMemberRepository.save(member);
      const updated = await this.teamMemberRepository.findOne({ where: { id: member.id } });
      console.log('[acceptInvite] Updated member:', updated);
      return updated!;
    } catch (err) {
      console.error('[acceptInvite] Error:', err);
      throw err;
    }
  }
}

export const teamService = new TeamService();
