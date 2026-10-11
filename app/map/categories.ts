import {
  Coffee,
  ShoppingBag,
  Trees,
  Utensils,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import type { Category } from "@/utils/places";

export const categoryIcons = {
  food: Utensils,
  cafes: Coffee,
  art: Palette,
  shop: ShoppingBag,
  outdoors: Trees,
} satisfies Record<Category, LucideIcon>;

export function CategoryIcon({
  category,
  size = 16,
}: {
  category: Category;
  size?: number;
}) {
  return createElement(categoryIcons[category], {
    size,
    strokeWidth: 1.6,
    "aria-hidden": true,
  });
}
