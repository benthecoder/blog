import { Coffee, ShoppingBag, Trees, Utensils, Palette } from "lucide-react";
import { createElement } from "react";

export const categoryIcons = {
  food: Utensils,
  cafes: Coffee,
  art: Palette,
  shop: ShoppingBag,
  outdoors: Trees,
};

export function CategoryIcon({
  category,
  size = 16,
}: {
  category: keyof typeof categoryIcons;
  size?: number;
}) {
  return createElement(categoryIcons[category], {
    size,
    strokeWidth: 1.6,
    "aria-hidden": true,
  });
}
