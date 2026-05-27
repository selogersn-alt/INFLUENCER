import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import prisma from '../prisma';

const router = Router();

interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  numberOfImages?: number;
  style?: string;
  negativePrompt?: string;
}

router.post('/', async (req: Request, res: Response) => {
  const { prompt, aspectRatio = '1:1', numberOfImages = 1, style, negativePrompt }: ImageGenerationRequest = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'A prompt of at least 3 characters is required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: 'demo-user-id' } });
    const apiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Google Gemini API Key is not configured.' });
    }

    // Build enhanced prompt with style modifier
    const styleModifiers: Record<string, string> = {
      photorealistic: 'photorealistic, 8K ultra HD, professional photography, sharp focus, cinematic lighting',
      artistic: 'digital art, painterly style, vibrant colors, artistic composition, featured on ArtStation',
      anime: 'anime style, manga art, Studio Ghibli inspired, detailed linework, soft colors',
      fashion: 'high fashion editorial, Vogue magazine style, professional model, luxury brand aesthetic',
      cinematic: 'cinematic still, movie poster quality, dramatic lighting, anamorphic lens, film grain',
    };

    const enhancedPrompt = style && styleModifiers[style]
      ? `${prompt}, ${styleModifiers[style]}`
      : prompt;

    console.log(`Generating images via GoogleGenAI SDK... Prompt: "${enhancedPrompt}"`);

    // Initialize the official Google Gen AI client
    const ai = new GoogleGenAI({ apiKey });

    // Map aspect ratio string to SDK supported values: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
    const allowedRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const finalAspectRatio = allowedRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    const responseSDK = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: Math.min(numberOfImages, 4),
        aspectRatio: finalAspectRatio as any,
        negativePrompt: negativePrompt || undefined,
        personGeneration: 'ALLOW_ADULT' as any,
      }
    });

    if (!responseSDK.generatedImages || responseSDK.generatedImages.length === 0) {
      return res.status(500).json({ success: false, error: 'No images returned from Google GenAI SDK.' });
    }

    const images = responseSDK.generatedImages.map((img: any) => {
      const mimeType = 'image/png';
      const base64 = img.image.imageBytes;
      return {
        base64,
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`,
      };
    });

    return res.json({ 
      success: true, 
      images, 
      prompt: enhancedPrompt, 
      model: 'imagen-4.0-generate-001' 
    });

  } catch (error: any) {
    console.error('Image generation SDK error:', error);
    
    // Bubble up the friendly error message
    const msg = error.message || 'Image generation failed.';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
