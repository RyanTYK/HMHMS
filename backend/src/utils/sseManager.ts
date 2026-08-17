import { Response } from 'express';
import { AppDataSource } from './data-source';
import { Monitor } from '../models/Monitor';
import { CheckLog } from '../models/CheckLog';
import { SharedMonitor } from '../models/SharedMonitor';
import { UserNotification } from '../models/UserNotification';
import { Team } from '../models/Team';

class SSEManager {
  private clients: Map<number, Set<Response>> = new Map();

  addClient(userId: number, res: Response) {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(res);
    console.log(`SSE client connected for user ${userId}. Total clients for user: ${this.clients.get(userId)!.size}`);
    
    // Remove client when connection closes
    res.on('close', () => {
      const set = this.clients.get(userId);
      if (set) {
        set.delete(res);
        if (set.size === 0) this.clients.delete(userId);
      }
      console.log(`SSE client disconnected for user ${userId}. Remaining: ${this.clients.get(userId)?.size || 0}`);
    });
  }

  broadcastCheckComplete(userId: number, monitorId: string) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    const message = `data: ${JSON.stringify({ type: 'check', monitorId })}\n\n`;
    
    // Send to all connected clients
    for (const client of set) {
      try {
        client.write(message);
      } catch (error) {
        console.error('Error sending SSE check message to client:', error);
        set.delete(client);
      }
    }
    console.log(`Broadcasted check completion for monitor ${monitorId} to ${set.size} clients of user ${userId}`);
  }

  async broadcastMonitors(userId?: number) {
    if (userId != null) {
      await this.broadcastForUser(userId);
      return;
    }
    // Broadcast for all connected users
    for (const uid of this.clients.keys()) {
      await this.broadcastForUser(uid);
    }
  }

  private async broadcastForUser(userId: number) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    try {
      const monitorRepo = AppDataSource.getRepository(Monitor);
      const logRepo = AppDataSource.getRepository(CheckLog);
      const { IsNull } = require('typeorm');
      
      const monitors = await monitorRepo.find({ where: { user_id: userId, team_id: IsNull() } });
      const withStatus = await Promise.all(
        monitors.map(async (m) => {
          const last = await logRepo.findOne({ 
            where: { monitor_id: m.id }, 
            order: { timestamp: 'DESC' } 
          });
          return {
            ...m,
            last_check: last?.timestamp || null,
            last_status: last?.status || null,
          };
        })
      );

      const message = `data: ${JSON.stringify({ type: 'monitors', data: withStatus })}\n\n`;
      
      // Send to all connected clients
      for (const client of set) {
        try {
          client.write(message);
        } catch (error) {
          console.error('Error sending SSE message to client:', error);
          set.delete(client);
        }
      }
      
      console.log(`Broadcasted monitors update to ${set.size} clients for user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting monitors:', error);
    }
  }

  async broadcastShares(userId: number) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    try {
      const shareRepo = AppDataSource.getRepository(SharedMonitor);
      const shares = await shareRepo.find({
        where: [{ shared_with_user: userId }, { shared_by: userId }],
        relations: ['monitor', 'sharedBy', 'sharedWithUser'],
        order: { shared_at: 'DESC' }
      });

      const message = `data: ${JSON.stringify({ type: 'shares', data: shares })}\n\n`;
      
      for (const client of set) {
        try {
          client.write(message);
        } catch (error) {
          console.error('Error sending SSE shares message:', error);
          set.delete(client);
        }
      }
      
      console.log(`Broadcasted shares update to ${set.size} clients for user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting shares:', error);
    }
  }

  async broadcastNotifications(userId: number) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    try {
      const notificationRepo = AppDataSource.getRepository(UserNotification);
      const notifications = await notificationRepo.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: 50
      });

      const unreadCount = notifications.filter(n => !n.is_read).length;

      const message = `data: ${JSON.stringify({ type: 'notifications', data: notifications, unreadCount })}\n\n`;
      
      for (const client of set) {
        try {
          client.write(message);
        } catch (error) {
          console.error('Error sending SSE notifications message:', error);
          set.delete(client);
        }
      }
      
      console.log(`Broadcasted notifications update to ${set.size} clients for user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
    }
  }

  async broadcastTeams(userId: number) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    try {
      const teamRepo = AppDataSource.getRepository(Team);
      const teams = await teamRepo
        .createQueryBuilder('team')
        .leftJoin('team.members', 'member')
        .where('member.user_id = :userId', { userId })
        .orWhere('team.created_by = :userId', { userId })
        .getMany();

      const message = `data: ${JSON.stringify({ type: 'teams', data: teams })}\n\n`;
      
      for (const client of set) {
        try {
          client.write(message);
        } catch (error) {
          console.error('Error sending SSE teams message:', error);
          set.delete(client);
        }
      }
      
      console.log(`Broadcasted teams update to ${set.size} clients for user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting teams:', error);
    }
  }

  async broadcastTeamMonitors(teamId: number) {
    try {
      const { TeamMember } = require('../models/TeamMember');
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const monitorRepo = AppDataSource.getRepository(Monitor);
      const logRepo = AppDataSource.getRepository(CheckLog);
      
      // Get all active team members
      const members = await teamMemberRepo.find({
        where: { team_id: teamId, status: 'active' },
        relations: ['user']
      });

      if (members.length === 0) return;

      // Get monitors for this team
      const monitors = await monitorRepo.find({ where: { team_id: teamId } });
      const withStatus = await Promise.all(
        monitors.map(async (m) => {
          const last = await logRepo.findOne({ 
            where: { monitor_id: m.id }, 
            order: { timestamp: 'DESC' } 
          });
          return {
            ...m,
            last_check: last?.timestamp || null,
            last_status: last?.status || null,
          };
        })
      );

      const message = `data: ${JSON.stringify({ type: 'team-monitors', teamId, data: withStatus })}\n\n`;

      // Broadcast to all active team members
      for (const member of members) {
        const set = this.clients.get(member.user_id);
        if (!set || set.size === 0) continue;

        for (const client of set) {
          try {
            client.write(message);
          } catch (error) {
            console.error('Error sending SSE team monitors message:', error);
            set.delete(client);
          }
        }
      }
      
      console.log(`Broadcasted team monitors update for team ${teamId} to ${members.length} members`);
    } catch (error) {
      console.error('Error broadcasting team monitors:', error);
    }
  }
}

export const sseManager = new SSEManager();