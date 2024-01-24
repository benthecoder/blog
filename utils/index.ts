import axios from 'axios';
import 'dotenv/config';

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      { input: text, model: 'text-embedding-ada-002' },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
