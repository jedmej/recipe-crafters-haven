import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateImage } from './api/generate-image';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/api', generateImageRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 