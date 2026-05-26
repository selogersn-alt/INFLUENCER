import { Router, Request, Response } from 'express';
import multer from 'multer';
import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';

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
    // Multer saves files with random hex names in 'uploads/'.
    // We serve them publicly under '/api/uploads/'
    const imageUrl = `${protocol}://${req.get('host')}/api/uploads/${file.filename}`;
    console.log(`Uploaded image public URL: ${imageUrl}`);

    const replicate = getReplicateClient();
    
    // If no Replicate token is configured, use simulated mock mode so the app remains usable
    if (!replicate) {
      console.log('No REPLICATE_API_TOKEN found. Running in simulated mode.');
      const mockPredictionId = `mock_${Math.random().toString(36).substr(2, 9)}`;
      res.json({
        success: true,
        predictionId: mockPredictionId,
        status: 'starting',
        message: 'Running in simulated mode (no REPLICATE_API_TOKEN set).'
      });
      return;
    }

    // Map frontend model names to Replicate model handles
    // Default to Luma Ray
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

// GET: Check Generation Status
router.get('/status/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const predictionId = req.params.id;

    // Handle mock simulations
    if (predictionId.startsWith('mock_')) {
      res.json({
        id: predictionId,
        status: 'succeeded',
        output: [
          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80"
        ],
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
    
    res.json({
      id: prediction.id,
      status: prediction.status, // starting, processing, succeeded, failed, canceled
      output: prediction.output, // usually an array of URLs or a single URL string
      error: prediction.error
    });
  } catch (error: any) {
    console.error('Status Check Error:', error);
    res.status(500).json({ error: 'Failed to get generation status', details: error.message });
  }
});

export default router;
