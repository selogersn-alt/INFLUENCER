import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRouter from './routes/generate';
import publishRouter from './routes/publish';
import generateTextRouter from './routes/generateText';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/generate', generateRouter);
app.use('/api/publish', publishRouter);
app.use('/api/generate-text', generateTextRouter);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
