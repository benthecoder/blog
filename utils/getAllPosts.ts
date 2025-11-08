import fs from "fs";
import path from "path";

// Import shared paths
import { POSTS_DIR } from "@/config/paths";

export function getAllPosts(includeDrafts: boolean = false) {
  const postsDirectory = POSTS_DIR;

  function getMarkdownFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries.reduce<string[]>((files, entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return [...files, ...getMarkdownFiles(fullPath)];
      } else if (entry.name.endsWith(".md")) {
        return [...files, fullPath];
      }
      return files;
    }, []);
  }

  const allFiles = getMarkdownFiles(postsDirectory);

  if (includeDrafts) {
    return allFiles;
  }

  // Exclude drafts folder
  return allFiles.filter(
    (file) => !file.includes("/drafts/") && !file.includes("\\drafts\\")
  );
}
