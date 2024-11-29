import fs from 'fs';
import path from 'path';

export function getAllPosts() {
  const postsDirectory = path.join(process.cwd(), 'posts');

  // Get all markdown files recursively
  function getMarkdownFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries.reduce<string[]>((files, entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return [...files, ...getMarkdownFiles(fullPath)];
      } else if (entry.name.endsWith('.md')) {
        return [...files, fullPath];
      }
      return files;
    }, []);
  }

  return getMarkdownFiles(postsDirectory);
}
