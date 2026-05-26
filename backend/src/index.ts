import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRouter from './routes/generate';
import publishRouter from './routes/publish';
import generateTextRouter from './routes/generateText';
import dashboardRouter from './routes/dashboard';
import settingsRouter from './routes/settings';
import generateImageRouter from './routes/generateImage';
import prisma from './prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/uploads', express.static('uploads'));

app.use('/api/generate', generateRouter);
app.use('/api/publish', publishRouter);
app.use('/api/generate-text', generateTextRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/generate-image', generateImageRouter);

// Auto-seed default user on startup
async function seed() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          id: 'demo-user-id',
          email: 'demo@aistudio.com',
          name: 'Demo Influencer CM'
        }
      });
      console.log('Seeded default demo user.');
    }
  } catch (error) {
    console.error('Database seeding failed:', error);
  }
}
seed();

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
