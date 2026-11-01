import { cache } from "react";
import { RECIPES_DIR, getRecipePath } from "@/config/paths";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import { recipeFrontmatterSchema } from "./schemas";

export interface RecipeMetadata {
  slug: string;
  title: string;
  /** One-line note shown beside the recipe on the index. */
  description: string;
  /** Square thumbnail for the index, e.g. /images/recipes/miso-soup.jpg. */
  image: string;
  lastUpdated: string;
}

export const getRecipeMetadata = cache(
  function getRecipeMetadata(): RecipeMetadata[] {
    return scanMarkdownDir(RECIPES_DIR, recipeFrontmatterSchema)
      .map(({ slug, data }) => ({
        slug,
        title: data.title || slug,
        description: data.description || "",
        image: data.image || "",
        lastUpdated: data.lastUpdated ?? "",
      }))
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }
);

export const getRecipeContent = cache(function getRecipeContent(slug: string) {
  return readMarkdownFile(getRecipePath(slug), recipeFrontmatterSchema);
});
