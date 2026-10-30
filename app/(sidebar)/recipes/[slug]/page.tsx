import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getRecipeMetadata, getRecipeContent } from "@/utils/content/recipes";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { pageMetadata } from "@/utils/pageMetadata";

export const dynamic = "force-static";

type Params = Promise<{ slug: string }>;

const linkClasses =
  "text-sm underline underline-offset-2 hover:text-ink dark:hover:text-chalk-soft";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const recipe = getRecipeMetadata().find((r) => r.slug === slug);
  if (!recipe) return;

  return pageMetadata({
    title: recipe.title,
    description: recipe.description,
    path: `/recipes/${slug}`,
  });
}

export const generateStaticParams = async () =>
  getRecipeMetadata().map((recipe) => ({ slug: recipe.slug }));

const RecipePage = async ({ params }: { params: Params }) => {
  const { slug } = await params;
  const recipes = getRecipeMetadata();
  const index = recipes.findIndex((r) => r.slug === slug);
  if (index === -1) return notFound();

  const recipe = recipes[index];
  const next =
    recipes.length > 1 ? recipes[(index + 1) % recipes.length] : null;
  const content = getRecipeContent(slug);

  return (
    <div className="mx-auto max-w-[65ch] pb-12 text-ink-strong dark:text-chalk-strong">
      <h1 className="mb-6 text-2xl font-bold lowercase">{recipe.title}</h1>

      {recipe.image && (
        <div className="relative mb-8 aspect-[4/3] w-full overflow-hidden rounded-md">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            sizes="(max-width: 768px) 100vw, 65ch"
            loading="eager"
            className="object-cover"
          />
        </div>
      )}

      <article className="prose prose-sm dark:prose-invert max-w-none prose-h2:mt-6 prose-h2:mb-2 prose-h2:text-sm prose-headings:font-bold prose-headings:lowercase prose-headings:text-ink-strong dark:prose-headings:text-chalk-strong prose-a:text-ink dark:prose-a:text-chalk-soft">
        <MarkdownContent content={content.content} />
      </article>

      <div className="mt-6 flex justify-between">
        <Link href="/recipes" className={linkClasses}>
          go back
        </Link>
        {next && (
          <Link href={`/recipes/${next.slug}`} className={linkClasses}>
            go next
          </Link>
        )}
      </div>
    </div>
  );
};

export default RecipePage;
