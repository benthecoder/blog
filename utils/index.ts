export const generateEmbedding = async (prompt: string) => {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: prompt,
    }),
  });
  const embeddings = await res.json();

  return embeddings.data[0].embedding;
};
