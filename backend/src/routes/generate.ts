import { Router, Request, Response } from 'express';
import multer from 'multer';
import Replicate from 'replicate';
import prisma from '../prisma';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Helper to initialize Replicate dynamically
function getReplicateClient(): Replicate | null {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  return new Replicate({ auth: token });
}

// POST: Start Video Generation
router.post('/', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, model } = req.body;
    const file = req.file;

    if (!file || !prompt) {
      res.status(400).json({ error: 'Image and prompt are required' });
      return;
    }

    // Determine secure protocol (HTTPS behind Nginx reverse proxy)
    const isHttps = req.headers['x-forwarded-proto'] === 'https' || req.secure;
    const protocol = isHttps ? 'https' : 'http';
    
    // Construct the public URL of the uploaded image
    const imageUrl = `${protocol}://${req.get('host')}/api/uploads/${file.filename}`;
    console.log(`Uploaded image public URL: ${imageUrl}`);

    const replicate = getReplicateClient();
    
    // If no Replicate token is configured, use simulated mock mode
    if (!replicate) {
      console.log('No REPLICATE_API_TOKEN found. Running in simulated mode.');
      const mockPredictionId = `mock_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save simulated video in the database
      await prisma.video.create({
        data: {
          id: mockPredictionId,
          prompt: prompt,
          imageUrl: imageUrl,
          status: 'GENERATING',
          userId: 'demo-user-id'
        }
      });

      res.json({
        success: true,
        predictionId: mockPredictionId,
        status: 'starting',
        message: 'Running in simulated mode (no REPLICATE_API_TOKEN set).'
      });
      return;
    }

    // Map frontend model names to Replicate model handles
    let replicateModel: any = "luma/ray";
    let input: any = {
      prompt: prompt,
      image: imageUrl
    };

    if (model === 'kling') {
      replicateModel = "kling-ai/kling-v1.5-video";
      input = {
        prompt: prompt,
        input_image: imageUrl
      };
    } else if (model === 'runway') {
      replicateModel = "bytedance/hotshot-xl";
      input = {
        prompt: prompt,
        image_url: imageUrl
      };
    }

    console.log(`Triggering Replicate model ${replicateModel} with prompt: "${prompt}"`);

    const prediction = await replicate.predictions.create({
      model: replicateModel,
      input: input
    });

    // Save video in the database with GENERATING status
    await prisma.video.create({
      data: {
        id: prediction.id,
        prompt: prompt,
        imageUrl: imageUrl,
        status: 'GENERATING',
        userId: 'demo-user-id'
      }
    });

    res.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status,
      message: 'Video generation started successfully.'
    });
  } catch (error: any) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: 'Failed to start video generation', details: error.message });
  }
});

// GET: Check Generation Status and Update Database
router.get('/status/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const predictionId = req.params.id as string;

    // Handle mock simulations
    if (predictionId.startsWith('mock_')) {
      const finalMockUrl = "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-34351-large.mp4";
      
      // Update database status to COMPLETED
      await prisma.video.updateMany({
        where: { id: predictionId, status: 'GENERATING' },
        data: {
          status: 'COMPLETED',
          videoUrl: finalMockUrl
        }
      });

      // Seed mock publishing tasks if not already done
      const existingPosts = await prisma.post.count({ where: { videoId: predictionId } });
      if (existingPosts === 0) {
        const platforms = ['TIKTOK', 'INSTAGRAM', 'FACEBOOK'];
        for (const platform of platforms) {
          await prisma.post.create({
            data: {
              platform: platform,
              status: 'PENDING_APPROVAL',
              videoId: predictionId,
              userId: 'demo-user-id'
            }
          });
        }
      }

      res.json({
        id: predictionId,
        status: 'succeeded',
        output: [finalMockUrl],
        message: 'Mock generation completed.'
      });
      return;
    }

    const replicate = getReplicateClient();
    if (!replicate) {
      res.status(400).json({ error: 'Replicate token is not configured on the server.' });
      return;
    }

    const prediction = await replicate.predictions.get(predictionId);
    
    // If completed successfully, update status and generate publish queue entries
    if (prediction.status === 'succeeded') {
      const finalUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      
      await prisma.video.update({
        where: { id: predictionId },
        data: {
          status: 'COMPLETED',
          videoUrl: finalUrl
        }
      });

      // Create posts in queue for each social network
      const existingPosts = await prisma.post.count({ where: { videoId: predictionId } });
      if (existingPosts === 0) {
        const platforms = ['TIKTOK', 'INSTAGRAM', 'FACEBOOK'];
        for (const platform of platforms) {
          await prisma.post.create({
            data: {
              platform: platform,
              status: 'PENDING_APPROVAL',
              videoId: predictionId,
              userId: 'demo-user-id'
            }
          });
        }
      }
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      await prisma.video.update({
        where: { id: predictionId },
        data: {
          status: 'FAILED'
        }
      });
    }

    res.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error
    });
  } catch (error: any) {
    console.error('Status Check Error:', error);
    res.status(500).json({ error: 'Failed to get generation status', details: error.message });
  }
});

export default router;
