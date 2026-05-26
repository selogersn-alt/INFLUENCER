import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET: Dashboard statistics & recent generations
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Count total videos generated
    const totalVideos = await prisma.video.count();

    // 2. Count posts pending approval
    const pendingApproval = await prisma.post.count({
      where: { status: 'PENDING_APPROVAL' }
    });

    // 3. Count published posts (this week simulation / simple total published)
    const publishedCount = await prisma.post.count({
      where: { status: 'PUBLISHED' }
    });

    // 4. Fetch recent video generations
    const recentVideos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        posts: true
      }
    });

    // Format the recent videos for the dashboard to match the frontend expectations
    const formattedRecent = recentVideos.map(video => {
      const pendingPost = video.posts.find(p => p.status === 'PENDING_APPROVAL');
      const isPublished = video.posts.every(p => p.status === 'PUBLISHED') && video.posts.length > 0;
      
      let status: 'PENDING_APPROVAL' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'GENERATING' = 'PENDING_APPROVAL';
      if (video.status === 'GENERATING') status = 'GENERATING';
      else if (isPublished) status = 'PUBLISHED';
      else if (video.posts.some(p => p.status === 'PUBLISHING')) status = 'PUBLISHING';
      else if (video.posts.some(p => p.status === 'FAILED')) status = 'FAILED';

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
        title: video.prompt.length > 30 ? video.prompt.substring(0, 30) + '...' : video.prompt,
        thumbnail: video.imageUrl,
        videoUrl: video.videoUrl,
        status: status,
        createdAt: timeString
      };
    });

    res.json({
      success: true,
      data: {
        totalVideos,
        pendingApproval,
        publishedCount,
        recent: formattedRecent
      }
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

export default router;
