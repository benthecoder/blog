import { Client } from 'pg';
import { PostMetadata } from '../components/PostMetadata';
import getPostMetadata from '../utils/getPostMetadata';
import getPostContent from '../utils/getPostContent';
import { generateEmbedding } from '../utils';

const client = new Client({
  connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
});

export async function storePost(
  post: PostMetadata,
  content: string,
  embedding: number[]
): Promise<void> {
  const { title, slug, date, tags, wordcount } = post;
  await client.query(
    `INSERT INTO blog_posts (title, slug, date, tags, wordcount, content, embedding)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [title, slug, new Date(date), tags, wordcount, content, embedding]
  );
}

async function generateAllEmbeddings() {
  await client.connect();

  try {
    const posts = getPostMetadata();
    for (const post of posts) {
      const matterResult = getPostContent(post.slug);
      const combinedText = `${post.title} ${matterResult.content}`;

      const embedding = await generateEmbedding(combinedText);
      console.log(`Embedding for ${post.title} has been generated.`);

      await storePost(post, matterResult.content, embedding);
    }
    console.log('All posts have been embedded and stored.');
  } catch (error) {
    console.error('Error generating all embeddings:', error);
  } finally {
    await client.end();
  }
}

generateAllEmbeddings();
