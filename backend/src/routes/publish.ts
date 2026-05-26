import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET: Fetch all video posts in the publishing queue
router.get('/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const videos = await prisma.video.findMany({
      where: {
        posts: { some: {} } // only fetch videos that have queue posts
      },
      include: {
        posts: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const tasks = videos.map(video => {
      // Aggregate status from individual posts
      let status: 'PENDING_APPROVAL' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' = 'PENDING_APPROVAL';
      
      if (video.posts.some(p => p.status === 'PUBLISHING')) {
        status = 'PUBLISHING';
      } else if (video.posts.every(p => p.status === 'PUBLISHED') && video.posts.length > 0) {
        status = 'PUBLISHED';
      } else if (video.posts.some(p => p.status === 'FAILED')) {
        status = 'FAILED';
      }

      const platformMapping: Record<string, string> = {
        TIKTOK: 'TikTok',
        INSTAGRAM: 'Instagram',
        FACEBOOK: 'Facebook'
      };

      // Convert database datetime to a readable string (e.g., "2 hours ago")
      const timeDiff = Date.now() - new Date(video.createdAt).getTime();
      let timeString = 'Just now';
      if (timeDiff > 3600000 * 24) {
        timeString = `${Math.floor(timeDiff / (3600000 * 24))} days ago`;
      } else if (timeDiff > 3600000) {
        timeString = `${Math.floor(timeDiff / 3600000)} hours ago`;
      } else if (timeDiff > 60000) {
        timeString = `${Math.floor(timeDiff / 60000)} minutes ago`;
      }

      return {
        id: video.id,
        title: video.prompt.length > 35 ? video.prompt.substring(0, 35) + '...' : video.prompt,
        thumbnail: video.imageUrl,
        videoUrl: video.videoUrl,
        status: status,
        platforms: video.posts.map(p => platformMapping[p.platform] || p.platform),
        createdAt: timeString
      };
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error: any) {
    console.error('Fetch Queue Error:', error);
    res.status(500).json({ error: 'Failed to fetch queue', details: error.message });
  }
});

// POST: Approve & Publish video to social networks
router.post('/approve/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const videoId = req.params.id as string;

    // Check if the video posts exist
    const postCount = await prisma.post.count({ where: { videoId } });
    if (postCount === 0) {
      res.status(404).json({ error: 'No queue items found for this video ID.' });
      return;
    }

    console.log(`Approving and publishing posts for video ${videoId}`);

    // Update status to PUBLISHING in the database
    await prisma.post.updateMany({
      where: { videoId },
      data: { status: 'PUBLISHING' }
    });

    // Simulate publishing background processing (e.g., BullMQ simulation)
    setTimeout(async () => {
      try {
        await prisma.post.updateMany({
          where: { videoId, status: 'PUBLISHING' },
          data: { status: 'PUBLISHED' }
        });
        console.log(`Successfully published video ${videoId} to all networks.`);
      } catch (timeoutErr) {
        console.error('Async publish simulation error:', timeoutErr);
      }
    }, 4000);

    res.json({
      success: true,
      status: 'PUBLISHING',
      message: 'Publishing started in background.'
    });
  } catch (error: any) {
    console.error('Approve Publish Error:', error);
    res.status(500).json({ error: 'Failed to approve publication', details: error.message });
  }
});

// POST: Reject video (remove from queue)
router.post('/reject/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const videoId = req.params.id as string;

    // Remove posts from database
    await prisma.post.deleteMany({
      where: { videoId }
    });

    // Optionally keep the video in history, or remove it as well:
    // For now we just remove queue posts, so it disappears from queue
    res.json({
      success: true,
      message: 'Video rejected and removed from publishing queue.'
    });
  } catch (error: any) {
    console.error('Reject Queue Error:', error);
    res.status(500).json({ error: 'Failed to reject video', details: error.message });
  }
});

export default router;
