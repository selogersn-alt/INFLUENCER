import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import prisma from '../prisma';

const router = Router();

// --- POST /api/generate-text (Enhanced with Tones & Platform Customization) ---
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoPrompt, tone = 'aesthetic', platforms = ['tiktok', 'instagram', 'facebook'] } = req.body;

    if (!videoPrompt) {
      res.status(400).json({ error: 'Video prompt is required' });
      return;
    }

    // Récupérer la clé Gemini dynamique
    const user = await prisma.user.findUnique({ where: { id: 'demo-user-id' } });
    const apiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'Google Gemini API Key has not been configured yet.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const tonePrompts: Record<string, string> = {
      aesthetic: 'très esthétique, poétique, élégant, inspirant, axé style de vie luxueux et raffiné.',
      hype: 'ultra-dynamique, énergique, moderne, rempli d\'enthousiasme, utilisant le jargon des tendances.',
      humorous: 'drôle, plein d\'esprit, sarcastique mais charmant, créant une complicité immédiate par le rire.',
      mysterious: 'intrigant, énigmatique, posant des questions philosophiques ou curieuses, laissant planer le doute.',
      engaging: 'axé sur la conversation, invitant directement les abonnés à commenter ou partager leur avis.',
    };

    const toneDesc = tonePrompts[tone] || tonePrompts.aesthetic;

    const systemPrompt = `Tu es le Community Manager expert d'une influenceuse lifestyle/mode très populaire sur TikTok, Instagram et Facebook.
À partir de la description de la vidéo suivante, génère un objet JSON strict (sans aucun formatage markdown \`\`\`) contenant des publications adaptées pour les réseaux sélectionnés : ${platforms.join(', ')}.

Le ton requis est : ${toneDesc}

Description de la vidéo : "${videoPrompt}"

Format du JSON attendu :
{
  "title": "Un titre global court accrocheur (max 5 mots)",
  "posts": {
    "tiktok": {
      "caption": "Légende TikTok très dynamique, emojis, hashtags spécifiques TikTok en fin de texte",
      "hashtags": "#PourToi #fyp #viral #mode"
    },
    "instagram": {
      "caption": "Légende Instagram esthétique, aérée, emojis élégants, hashtags axés lifestyle/esthétique",
      "hashtags": "#InstaGood #OOTD #Aesthetic"
    },
    "facebook": {
      "caption": "Légende Facebook plus rédigée et engageante, encourageant le partage et les commentaires",
      "hashtags": "#Lifestyle #Influenceuse #FacebookReels"
    }
  }
}

Ne génère que l'objet JSON pour les plateformes demandées (${platforms.join(', ')}). Ne mets pas de bloc de code markdown.`;

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

    const data = JSON.parse(generatedText);

    res.json({
      success: true,
      data: {
        title: data.title,
        posts: data.posts
      }
    });
  } catch (error: any) {
    console.error('Text Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate text using Gemini', details: error.message });
  }
});

// --- POST /api/generate-text/optimize-prompt (Magic Wand Prompt Enhancer) ---
router.post('/optimize-prompt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, type = 'image' } = req.body;

    if (!prompt || prompt.trim().length < 3) {
      res.status(400).json({ error: 'Prompt must be at least 3 characters long.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: 'demo-user-id' } });
    const apiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'Google Gemini API Key is not configured.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptInstructions = type === 'video'
      ? `Optimise le prompt vidéo suivant pour obtenir un rendu cinématique ultra-réaliste, fluide et dynamique.
Ajoute des descriptions précises sur les mouvements de caméra (panoramique, zoom lent, drone), la lumière (dorée, néon, contrastée), le stylisme de l'influenceuse et les expressions.
Garde l'essence du prompt initial, mais enrichis-le de façon professionnelle (Max 80 mots).

Prompt initial : "${prompt}"

Retourne UNIQUEMENT le prompt enrichi final, sans aucune phrase de politesse ou explication.`
      : `Optimise le prompt de génération d'image suivant pour obtenir un rendu photoréaliste et éditorial de niveau magazine de mode.
Ajoute des détails précis sur la composition, l'appareil photo/lentille (ex: 85mm portrait, 35mm street view, f/1.8), le style d'éclairage (cinématique, soft, volumétrique), l'attitude, l'expression, le maquillage et la texture de peau naturelle.
Garde l'essence du prompt initial, mais rends-le digne d'un pro de l'IA (Max 80 mots).

Prompt initial : "${prompt}"

Retourne UNIQUEMENT le prompt enrichi final, sans aucune phrase de politesse ou explication.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptInstructions,
    });

    const optimized = response.text;
    if (!optimized) {
      throw new Error("Empty optimization response from Gemini");
    }

    res.json({
      success: true,
      optimizedPrompt: optimized.trim()
    });
  } catch (error: any) {
    console.error('Prompt Optimization Error:', error);
    res.status(500).json({ error: 'Failed to optimize prompt', details: error.message });
  }
});

export default router;
