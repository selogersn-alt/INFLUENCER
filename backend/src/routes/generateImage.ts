import { Router, Request, Response } from 'express';

const router = Router();

interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  numberOfImages?: number;
  style?: string;
}

router.post('/', async (req: Request, res: Response) => {
  const { prompt, aspectRatio = '1:1', numberOfImages = 1, style }: ImageGenerationRequest = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'A prompt of at least 3 characters is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
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

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const body = {
      instances: [{ prompt: enhancedPrompt }],
      parameters: {
        sampleCount: Math.min(numberOfImages, 4),
        aspectRatio,
        safetySetting: 'BLOCK_ONLY_HIGH',
        personGeneration: 'ALLOW_ADULT',
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Imagen API error:', errText);

      // Try fallback with gemini-2.0-flash if imagen-3 fails
      return await fallbackGeneration(req, res, enhancedPrompt, apiKey, numberOfImages);
    }

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
      return res.status(500).json({ success: false, error: 'No images returned from Imagen API.' });
    }

    const images = data.predictions.map((pred: { bytesBase64Encoded: string; mimeType?: string }) => ({
      base64: pred.bytesBase64Encoded,
      mimeType: pred.mimeType || 'image/png',
      dataUrl: `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`,
    }));

    return res.json({ success: true, images, prompt: enhancedPrompt, model: 'imagen-3.0-generate-002' });

  } catch (error: unknown) {
    console.error('Image generation error:', error);
    return res.status(500).json({ success: false, error: 'Image generation failed. Check server logs.' });
  }
});

// Fallback: use Gemini 2.0 Flash for image generation
async function fallbackGeneration(req: Request, res: Response, prompt: string, apiKey: string, count: number) {
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
    const body = {
      contents: [{
        parts: [{ text: `Generate a high-quality image: ${prompt}` }]
      }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ success: false, error: `API error: ${errText.slice(0, 200)}` });
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imageParts = parts.filter((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData);

    if (imageParts.length === 0) {
      return res.status(500).json({ success: false, error: 'No images returned from fallback API.' });
    }

    const images = imageParts.map((p: { inlineData: { mimeType: string; data: string } }) => ({
      base64: p.inlineData.data,
      mimeType: p.inlineData.mimeType,
      dataUrl: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
    }));

    return res.json({ success: true, images, prompt, model: 'gemini-2.0-flash-image' });
  } catch (err) {
    console.error('Fallback generation error:', err);
    return res.status(500).json({ success: false, error: 'Both primary and fallback image generation failed.' });
  }
}

export default router;
