import { Response } from 'express';
import { AppDataSource } from './data-source';
import { Monitor } from '../models/Monitor';
import { UserNotification } from '../models/UserNotification';
import { getLatestCheckLogs } from './latestCheckLogs';
import { debugLog } from './debugLog';

class SSEManager {
  private clients: Map<number, Set<Response>> = new Map();

  addClient(userId: number, res: Response) {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(res);
    debugLog(`SSE client connected for user ${userId}. Total clients for user: ${this.clients.get(userId)!.size}`);
    
    // Remove client when connection closes
    res.on('close', () => {
      const set = this.clients.get(userId);
      if (set) {
        set.delete(res);
        if (set.size === 0) this.clients.delete(userId);
      }
      debugLog(`SSE client disconnected for user ${userId}. Remaining: ${this.clients.get(userId)?.size || 0}`);
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
    debugLog(`Broadcasted check completion for monitor ${monitorId} to ${set.size} clients of user ${userId}`);
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

      const monitors = await monitorRepo.find({ where: { user_id: userId } });
      const latestLogs = await getLatestCheckLogs(monitors.map(m => m.id));
      const withStatus = monitors.map((m) => {
        const last = latestLogs.get(m.id);
        return {
          ...m,
          last_check: last?.timestamp || null,
          last_status: last?.status || null,
        };
      });

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
      
      debugLog(`Broadcasted monitors update to ${set.size} clients for user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting monitors:', error);
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
      
      debugLog(`Broadcasted notifications update to ${set.size} clients for user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
    }
  }

}

export const sseManager = new SSEManager();