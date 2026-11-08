import type { Category } from "@/utils/places";

// Colors come from the --map-cat-* tokens, keyed by data-category in map.css.
export default function CategoryDot({ category }: { category: Category }) {
  return (
    <span
      className="category-dot"
      data-category={category}
      aria-hidden="true"
    />
  );
}
