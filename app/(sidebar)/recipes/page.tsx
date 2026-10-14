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
        <table className="w-full border-collapse border border-ink-strong dark:border-chalk-strong">
          <tbody>
            {recipes.map((recipe) => (
              <tr
                key={recipe.slug}
                className="border border-ink-strong dark:border-chalk-strong"
              >
                <td className="w-[150px] border border-ink-strong p-0 align-middle dark:border-chalk-strong">
                  <div className="relative size-[150px] bg-paper-sunken dark:bg-night-raised">
                    {recipe.image && (
                      <Image
                        src={recipe.image}
                        alt=""
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="border border-ink-strong p-3 align-middle text-sm dark:border-chalk-strong">
                  <Link
                    href={`/recipes/${recipe.slug}`}
                    className="font-bold underline underline-offset-2 hover:text-ink dark:hover:text-chalk-soft"
                  >
                    {recipe.title}
                  </Link>
                  {recipe.description && (
                    <p className="mt-3">{recipe.description}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecipesPage;
