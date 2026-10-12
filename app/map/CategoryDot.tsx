import type { Palette } from "@/app/providers";
import type { Category } from "@/utils/places";

const categoryPalettes: Record<Category, Palette> = {
  food: "vermillion",
  cafes: "gold",
  art: "rose",
  shop: "steel",
  outdoors: "olive",
};

export default function CategoryDot({ category }: { category: Category }) {
  return (
    <span
      className="category-dot colophon-swatch"
      data-palette={categoryPalettes[category]}
      data-category={category}
      aria-hidden="true"
    />
  );
}
