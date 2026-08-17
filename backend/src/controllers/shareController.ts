import { Request, Response } from 'express';
import { shareService } from '../services/shareService';
import { ShareRole } from '../models/SharedMonitor';

/**
 * Share a monitor with user or team
 */
export const shareMonitor = async (req: Request, res: Response) => {
  try {
    const { monitorId, email, userId, teamId, role } = req.body;
    const sharedByUserId = (req as any).user.id;

    if (!monitorId) {
      return res.status(400).json({ message: 'Monitor ID is required' });
    }

    if (!email && !userId && !teamId) {
      return res.status(400).json({ message: 'Must specify email, userId, or teamId' });
    }

    const shareWith = { email, userId, teamId };
    const shareRole = role || ShareRole.VIEWER;

    const share = await shareService.shareMonitor(
      monitorId,
      sharedByUserId,
      shareWith,
      shareRole
    );

    const isReShare = share.shared_at < new Date(Date.now() - 1000); // Check if updated (not just created)

    res.status(201).json({ 
      message: isReShare ? 'Monitor shared again successfully' : 'Monitor shared successfully',
      share 
    });
  } catch (error: any) {
    console.error('Error sharing monitor:', error);
    res.status(500).json({ message: error.message || 'Failed to share monitor' });
  }
};

/**
 * Get shares created by current user
 */
export const getMyShares = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const shares = await shareService.getSharedByUser(userId);

    res.json({ shares });
  } catch (error: any) {
    console.error('Error fetching shares:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch shares' });
  }
};

/**
 * Get shares received by current user
 */
export const getSharedWithMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const shares = await shareService.getSharedWithUser(userId);

    res.json({ shares });
  } catch (error: any) {
    console.error('Error fetching received shares:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch received shares' });
  }
};

/**
 * Accept a share
 */
export const acceptShare = async (req: Request, res: Response) => {
  try {
    const shareId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(shareId)) {
      return res.status(400).json({ message: 'Invalid share ID' });
    }

    const result = await shareService.acceptShare(shareId, userId);

    res.json({ 
      message: 'Share accepted successfully. Monitor added to your dashboard.',
      share: result.share,
      monitor: result.monitor
    });
  } catch (error: any) {
    console.error('Error accepting share:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Failed to accept share' });
  }
};

/**
 * Decline a share
 */
export const declineShare = async (req: Request, res: Response) => {
  try {
    const shareId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(shareId)) {
      return res.status(400).json({ message: 'Invalid share ID' });
    }

    await shareService.declineShare(shareId, userId);

    res.json({ message: 'Share declined successfully' });
  } catch (error: any) {
    console.error('Error declining share:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Failed to decline share' });
  }
};

/**
 * Revoke a share (by owner)
 */
export const revokeShare = async (req: Request, res: Response) => {
  try {
    const shareId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(shareId)) {
      return res.status(400).json({ message: 'Invalid share ID' });
    }

    await shareService.revokeShare(shareId, userId);

    res.json({ message: 'Share revoked successfully' });
  } catch (error: any) {
    console.error('Error revoking share:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('not have permission')) {
      return res.status(403).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Failed to revoke share' });
  }
};

/**
 * Get share by ID
 */
export const getShare = async (req: Request, res: Response) => {
  try {
    const shareId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (isNaN(shareId)) {
      return res.status(400).json({ message: 'Invalid share ID' });
    }

    const share = await shareService.getShareById(shareId, userId);

    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    res.json({ share });
  } catch (error: any) {
    console.error('Error fetching share:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch share' });
  }
};
