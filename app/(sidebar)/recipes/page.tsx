import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getRecipeMetadata } from "@/utils/content/recipes";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "recipes",
  description: "Things I cook, written and re-tested until they're right",
  alternates: { canonical: "/recipes" },
};

const RecipesPage = () => {
  const recipes = getRecipeMetadata();

  return (
    <div className="mx-auto max-w-[65ch] py-12 text-ink-strong dark:text-chalk-strong">
      <h1 className="mb-8 text-2xl font-bold lowercase">recipes</h1>
      {recipes.length === 0 ? (
        <p className="text-sm text-ink-strong/40 dark:text-chalk-strong/40">
          Nothing here yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {recipes.map((recipe) => (
            <li key={recipe.slug}>
              <Link
                href={`/recipes/${recipe.slug}`}
                className="group flex items-start gap-4"
              >
                {recipe.image && (
                  <span className="relative mt-0.5 block size-16 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={recipe.image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span>
                  <span className="font-bold underline-offset-2 group-hover:underline">
                    {recipe.title}
                  </span>
                  {recipe.description && (
                    <span className="mt-1 block text-sm text-ink-strong/60 dark:text-chalk-strong/60">
                      {recipe.description}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-10 text-sm">
        <Link
          href="/groceries"
          className="underline underline-offset-2 hover:text-ink dark:hover:text-chalk-soft"
        >
          groceries i like
        </Link>
      </p>
    </div>
  );
};

export default RecipesPage;
