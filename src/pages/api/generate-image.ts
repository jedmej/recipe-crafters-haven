import { NextApiRequest, NextApiResponse } from 'next';

const FAL_API_KEY = "1bdc7126-51ab-40f8-bcc5-e304def1a789:d2df7a52cb9f954e7374b8e3828da39c";
const FAL_API_URL = "https://110602490-stable-diffusion-xl.fal.ai/";

export const generateImage = async (req: Request) => {
  // Check method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  let prompt: string;

  // Safely parse request body
  try {
    const body = await req.json();
    prompt = body.prompt;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ 
        message: 'Prompt is required and must be a string' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      message: 'Invalid request body' 
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Validate API key
    if (!FAL_API_KEY) {
      throw new Error('FAL API key is not configured');
    }

    console.log('Sending request to FAL API with prompt:', prompt);

    // Make request to FAL API
    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: "blurry, bad quality, distorted",
        height: 1024,
        width: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        num_images: 1,
        safety_checker: true,
        enhance_prompt: true,
        scheduler: "DPMSolverMultistep",
      }),
    });

    console.log('Received response from FAL API:', response.status);

    // Parse FAL API response
    let data;
    try {
      const textResponse = await response.text();
      console.log('Raw response:', textResponse);
      data = JSON.parse(textResponse);
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Invalid response from image generation API');
    }

    // Check for API errors
    if (!response.ok) {
      console.error('API error response:', data);
      throw new Error(data.message || `API error: ${response.status}`);
    }

    // Validate response data
    if (!data.images?.[0]) {
      console.error('Invalid response structure:', data);
      throw new Error('No image data in response');
    }

    // Return success response
    return new Response(JSON.stringify({ 
      imageUrl: data.images[0],
      message: 'Image generated successfully' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error generating image:', error);
    
    // Return appropriate error response
    return new Response(JSON.stringify({ 
      message: error instanceof Error ? error.message : 'Error generating image',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST = generateImage; 