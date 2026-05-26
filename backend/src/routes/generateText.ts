import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import prisma from '../prisma';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoPrompt } = req.body;

    if (!videoPrompt) {
      res.status(400).json({ error: 'Video prompt is required to generate text context' });
      return;
    }

    // Récupérer la clé Gemini dynamique de l'utilisateur ou du .env
    const user = await prisma.user.findUnique({ where: { id: 'demo-user-id' } });
    const apiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'Google Gemini API Key has not been configured yet.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });


    console.log(`Generating text via Gemini for prompt: ${videoPrompt}`);

    // Prompt système pour guider Gemini
    const systemPrompt = `Tu es le Community Manager expert d'une influenceuse lifestyle/mode très populaire sur TikTok, Instagram Reels et Facebook Reels. 
À partir de la description de la vidéo suivante, génère un objet JSON strict (sans aucun formatage markdown \`\`\`) contenant :
- "title": Un titre très court et accrocheur (idéal pour TikTok/YouTube Shorts).
- "description": Une légende engageante avec des emojis, posant souvent une question à l'audience pour créer de l'interaction.
- "hashtags": Une liste de 5 à 8 hashtags pertinents séparés par des espaces (ex: #Paris #OOTD).

Description de la vidéo : ${videoPrompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const generatedText = response.text;
    
    if (!generatedText) {
      throw new Error("Empty response from Gemini");
    }

    // Parsing du JSON retourné par Gemini
    const data = JSON.parse(generatedText);

    res.json({
      success: true,
      data: {
        title: data.title,
        description: data.description,
        hashtags: data.hashtags
      }
    });
  } catch (error) {
    console.error('Text Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate text using Gemini' });
  }
});

export default router;
