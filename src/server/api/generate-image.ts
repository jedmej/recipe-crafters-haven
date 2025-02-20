import express from 'express';
import { fal } from '@fal-ai/client';

const router = express.Router();

fal.config({ credentials: process.env.FAL_API_KEY });

router.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required and must be a string' });
    }

    const result = await fal.subscribe('fal-ai/stable-diffusion-xl', {
      input: {
        prompt: prompt,
        negative_prompt: "blurry, bad quality, distorted",
        image_size: "square_hd",
        num_inference_steps: 30,
        scheduler: "DPMSolverMultistep",
        guidance_scale: 7.5,
        num_images: 1,
        safety_checker: true,
        enhance_prompt: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generation in progress:", update.logs);
        }
      },
    });

    if (!result.images?.[0]) {
      throw new Error('No image generated');
    }

    res.json({ 
      imageUrl: result.images[0].url,
      message: 'Image generated successfully' 
    });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error generating image' 
    });
  }
});

export { router as generateImage }; 