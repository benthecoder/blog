export const generateEmbedding = async (prompt: string) => {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      method: 'POST',
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: prompt,
      }),
    });

    if (!res.ok) {
      // Log the error status and the response text
      const errorText = await res.text();
      console.error(
        `Failed to generate embedding, status: ${res.status}, response: ${errorText}`
      );
      throw new Error(`Failed to generate embedding, status: ${res.status}`);
    }

    const embeddings = await res.json();

    // Check if the embeddings data array is present and has at least one element
    if (!embeddings.data || embeddings.data.length === 0) {
      throw new Error('No embeddings data received from OpenAI API');
    }

    return embeddings.data[0].embedding;
  } catch (error: unknown) {
    // Log the error message and stack trace
    if (error instanceof Error) {
      console.error(
        'Error during embedding generation:',
        error.message,
        error.stack
      );
    } else {
      console.error('An unknown error occurred during search:', error);
    }
    throw error;
  }
};
