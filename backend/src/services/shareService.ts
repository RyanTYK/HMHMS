import { AppDataSource } from '../utils/data-source';
import { SharedMonitor, ShareRole, ShareStatus } from '../models/SharedMonitor';
import { Monitor } from '../models/Monitor';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { TeamMember } from '../models/TeamMember';
import { UserNotification, NotificationType } from '../models/UserNotification';
import { v4 as uuidv4 } from 'uuid';

export class ShareService {
  private sharedMonitorRepository = AppDataSource.getRepository(SharedMonitor);
  private monitorRepository = AppDataSource.getRepository(Monitor);
  private userRepository = AppDataSource.getRepository(User);
  private teamRepository = AppDataSource.getRepository(Team);
  private teamMemberRepository = AppDataSource.getRepository(TeamMember);
  private notificationRepository = AppDataSource.getRepository(UserNotification);

  /**
   * Share monitor with user or team
   */
  async shareMonitor(
    monitorId: string,
    sharedByUserId: number,
    shareWith: { userId?: number; teamId?: number; email?: string },
    role: ShareRole = ShareRole.VIEWER
  ): Promise<SharedMonitor> {
    // Verify monitor exists and user owns it
    const monitor = await this.monitorRepository.findOne({
      where: { id: monitorId, user_id: sharedByUserId }
    });

    if (!monitor) {
      throw new Error('Monitor not found or you do not have permission');
    }

    let sharedWithUser: number | undefined;
    let sharedWithTeam: number | undefined;

    // Share with user
    if (shareWith.email || shareWith.userId) {
      if (shareWith.email) {
        const user = await this.userRepository.findOne({ where: { email: shareWith.email } });
        if (!user) {
          throw new Error('User not found');
        }
        sharedWithUser = user.id;
      } else {
        sharedWithUser = shareWith.userId;
      }

      // Check if already shared
      const existing = await this.sharedMonitorRepository.findOne({
        where: {
          monitor_id: monitorId,
          shared_with_user: sharedWithUser
        }
      });

      if (existing) {
        // Update existing share instead of throwing error
        existing.role = role;
        existing.status = ShareStatus.PENDING;
        existing.shared_at = new Date();
        existing.responded_at = undefined;
        await this.sharedMonitorRepository.save(existing);
        
        // Create notification for re-share
        const monitor = await this.monitorRepository.findOne({ where: { id: monitorId } });
        if (monitor && sharedWithUser !== undefined) {
          await this.createShareNotification(existing.id, sharedWithUser, monitor.name);
        }
        
        return existing;
      }
    }
    // Share with team
    else if (shareWith.teamId) {
      sharedWithTeam = shareWith.teamId;

      // Verify team exists
      const team = await this.teamRepository.findOne({ where: { id: shareWith.teamId } });
      if (!team) {
        throw new Error('Team not found');
      }

      // Check if already shared
      const existing = await this.sharedMonitorRepository.findOne({
        where: {
          monitor_id: monitorId,
          shared_with_team: shareWith.teamId
        }
      });

      if (existing) {
        // Update existing share instead of throwing error
        existing.role = role;
        existing.status = ShareStatus.PENDING;
        existing.shared_at = new Date();
        existing.responded_at = undefined;
        await this.sharedMonitorRepository.save(existing);
        
        // Create notifications for team members
        const monitor = await this.monitorRepository.findOne({ where: { id: monitorId } });
        if (monitor) {
          const members = await this.teamMemberRepository.find({
            where: { team_id: shareWith.teamId }
          });
          for (const member of members) {
            await this.createShareNotification(existing.id, member.user_id, monitor.name);
          }
        }
        
        return existing;
      }
    } else {
      throw new Error('Must specify either userId, email, or teamId');
    }

    // Create share
    const share = this.sharedMonitorRepository.create({
      monitor_id: monitorId,
      shared_by: sharedByUserId,
      shared_with_user: sharedWithUser,
      shared_with_team: sharedWithTeam,
      role,
      status: ShareStatus.PENDING
    });

    await this.sharedMonitorRepository.save(share);

    // Create notification for recipient(s)
    if (sharedWithUser) {
      await this.createShareNotification(share.id, sharedWithUser, monitor.name);
    } else if (sharedWithTeam) {
      // Notify all team members
      const members = await this.teamMemberRepository.find({
        where: { team_id: sharedWithTeam }
      });
      for (const member of members) {
        await this.createShareNotification(share.id, member.user_id, monitor.name);
      }
    }

    return share;
  }

  /**
   * Create share notification
   */
  private async createShareNotification(shareId: number, userId: number, monitorName: string): Promise<void> {
    const notification = this.notificationRepository.create({
      user_id: userId,
      type: NotificationType.SHARE,
      title: 'Monitor Shared With You',
      message: `A monitor "${monitorName}" has been shared with you`,
      related_share_id: shareId,
      action_url: `/shares/${shareId}`
    });

    await this.notificationRepository.save(notification);
  }

  /**
   * Get shares created by user
   */
  async getSharedByUser(userId: number): Promise<SharedMonitor[]> {
    const shares = await this.sharedMonitorRepository.find({
      where: { shared_by: userId },
      relations: ['monitor', 'sharedWithUser', 'sharedWithTeam'],
      order: { shared_at: 'DESC' }
    });

    return shares;
  }

  /**
   * Get shares received by user
   */
  async getSharedWithUser(userId: number): Promise<SharedMonitor[]> {
    // Direct shares to user
    const directShares = await this.sharedMonitorRepository.find({
      where: { shared_with_user: userId },
      relations: ['monitor', 'sharedBy'],
      order: { shared_at: 'DESC' }
    });

    // Shares to teams user is member of
    const teamMemberships = await this.teamMemberRepository.find({
      where: { user_id: userId }
    });

    const teamIds = teamMemberships.map(tm => tm.team_id);
    const teamShares = teamIds.length > 0 
      ? await this.sharedMonitorRepository
          .createQueryBuilder('share')
          .leftJoinAndSelect('share.monitor', 'monitor')
          .leftJoinAndSelect('share.sharedBy', 'sharedBy')
          .leftJoinAndSelect('share.sharedWithTeam', 'team')
          .where('share.shared_with_team IN (:...teamIds)', { teamIds })
          .orderBy('share.shared_at', 'DESC')
          .getMany()
      : [];

    return [...directShares, ...teamShares];
  }

  /**
   * Accept share
   */
  async acceptShare(shareId: number, userId: number): Promise<{ share: SharedMonitor; monitor: Monitor }> {
    const share = await this.sharedMonitorRepository.findOne({
      where: { id: shareId },
      relations: ['sharedWithUser', 'sharedWithTeam', 'monitor']
    });

    if (!share) {
      throw new Error('Share not found');
    }

    // Verify user is recipient
    const isRecipient = share.shared_with_user === userId ||
      (share.shared_with_team && await this.isTeamMember(userId, share.shared_with_team));

    if (!isRecipient) {
      throw new Error('Not authorized to accept this share');
    }

    // Get the original monitor
    const originalMonitor = await this.monitorRepository.findOne({
      where: { id: share.monitor_id }
    });

    if (!originalMonitor) {
      throw new Error('Original monitor not found');
    }

    // Generate a new UUID for the copied monitor
    const newMonitorId = uuidv4();

    // Create a copy of the monitor for the accepting user
    const newMonitor = this.monitorRepository.create({
      id: newMonitorId,
      name: originalMonitor.name,
      type: originalMonitor.type,
      target: originalMonitor.target,
      port: originalMonitor.port,
      interval_seconds: originalMonitor.interval_seconds,
      timeout_ms: originalMonitor.timeout_ms,
      active: originalMonitor.active,
      tags: originalMonitor.tags,
      dependency: originalMonitor.dependency,
      notify_owner: originalMonitor.notify_owner,
      user_id: userId,  // Assign to accepting user
      team_id: undefined  // Personal monitor, not team monitor
    });

    await this.monitorRepository.save(newMonitor);

    // Update share status
    share.status = ShareStatus.ACCEPTED;
    share.responded_at = new Date();
    await this.sharedMonitorRepository.save(share);

    return { share, monitor: newMonitor };
  }

  /**
   * Decline share
   */
  async declineShare(shareId: number, userId: number): Promise<void> {
    const share = await this.sharedMonitorRepository.findOne({
      where: { id: shareId },
      relations: ['sharedWithUser', 'sharedWithTeam']
    });

    if (!share) {
      throw new Error('Share not found');
    }

    // Verify user is recipient
    const isRecipient = share.shared_with_user === userId ||
      (share.shared_with_team && await this.isTeamMember(userId, share.shared_with_team));

    if (!isRecipient) {
      throw new Error('Not authorized to decline this share');
    }

    share.status = ShareStatus.DECLINED;
    share.responded_at = new Date();
    await this.sharedMonitorRepository.save(share);
  }

  /**
   * Revoke share (by owner)
   */
  async revokeShare(shareId: number, userId: number): Promise<void> {
    const share = await this.sharedMonitorRepository.findOne({
      where: { id: shareId, shared_by: userId }
    });

    if (!share) {
      throw new Error('Share not found or you do not have permission');
    }

    await this.sharedMonitorRepository.delete(shareId);
  }

  /**
   * Check if user is team member
   */
  private async isTeamMember(userId: number, teamId: number): Promise<boolean> {
    const membership = await this.teamMemberRepository.findOne({
      where: { user_id: userId, team_id: teamId }
    });
    return !!membership;
  }

  /**
   * Get share by ID
   */
  async getShareById(shareId: number, requestingUserId: number): Promise<SharedMonitor | null> {
    if (!requestingUserId) {
      throw new Error('Unauthorized');
    }

    const share = await this.sharedMonitorRepository.findOne({
      where: { id: shareId },
      relations: ['monitor', 'sharedBy', 'sharedWithUser', 'sharedWithTeam']
    });

    if (!share) return null;

    // The creator of the share and the directly-targeted user may always see it.
    if (share.shared_by === requestingUserId || share.shared_with_user === requestingUserId) {
      return share;
    }

    // For team shares, only actual members of that team may see it.
    if (share.shared_with_team) {
      const membership = await this.teamMemberRepository.findOne({
        where: { team_id: share.shared_with_team, user_id: requestingUserId }
      });
      if (membership) return share;
    }

    // Treat "not allowed" as "not found" so share ids cannot be enumerated.
    return null;
  }
}

export const shareService = new ShareService();
