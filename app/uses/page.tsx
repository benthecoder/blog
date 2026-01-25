"use client";

import Image from "next/image";

type Product = {
  name: string;
  image: string;
  link?: string;
};

type Category = {
  name: string;
  items: Product[];
};

const categories: Category[] = [
  {
    name: "tech",
    items: [
      { name: "M4 Max Pro", image: "m4maxpro.png" },
      { name: "M1 Air", image: "m1air.png" },
      { name: "reMarkable 2", image: "remarkable2.png" },
      { name: "Xteink X4", image: "xteinkx4.png" },
      { name: "Apple Keyboard Touch ID", image: "applekeyboard.png" },
      { name: "Apple Trackpad", image: "trackpad.png" },
      { name: "AirPods Pro", image: "airpodspro2.png" },
      { name: "Koss Porta Pro LE Beige", image: "portapro.png" },
    ],
  },
  {
    name: "carry",
    items: [
      { name: "Osprey Axis", image: "osprey.png" },
      { name: "Apple Watch S8", image: "applewatchs8.png" },
      { name: "Fujifilm X100S", image: "fujifilmx100s.png" },
      { name: "Innioasis Y1", image: "innioasis.png" },
    ],
  },
  {
    name: "skincare",
    items: [
      {
        name: "La Roche-Posay Cleanser",
        image: "laroche.png",
        link: "https://www.laroche-posay.us/our-products/acne-oily-skin/acne-cleanser/effaclar-medicated-gel-facial-cleanser-effaborefmin.html",
      },
      { name: "Round Lab Moisturizer", image: "roundlab.png" },
      { name: "Beauty of Joseon SPF", image: "joseonspf.png" },
      { name: "Differin 0.1%", image: "differin.png" },
      { name: "Anua Azelaic 10%", image: "anua.png" },
      { name: "Rugby BP 5%", image: "bp.png" },
    ],
  },
];

const ProductCell = ({ item }: { item: Product }) => {
  const content = (
    <>
      <div className="w-full flex-1 relative mb-1">
        <Image
          src={`/images/uses/${item.image}`}
          alt={item.name}
          fill
          className="object-contain"
        />
      </div>
      <p className="text-[10px] text-center">{item.name}</p>
    </>
  );

  if (item.link) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="aspect-square flex flex-col items-center justify-center p-2 border-r border-b border-japanese-shiraumenezu/40 dark:border-white/10"
        style={{
          cursor: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><text y='20' font-size='20'>🔗</text></svg>") 12 12, pointer`,
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="aspect-square flex flex-col items-center justify-center p-2 border-r border-b border-japanese-shiraumenezu/40 dark:border-white/10">
      {content}
    </div>
  );
};

export default function ProductsPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-12">
        日用品
      </p>

      <div className="w-full max-w-3xl px-4 space-y-12">
        {categories.map((category, i) => (
          <div key={i}>
            <p className="text-[10px] tracking-[0.2em] uppercase opacity-40 mb-4 text-center">
              {category.name}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 border-t border-l border-japanese-shiraumenezu/40 dark:border-white/10">
              {category.items.map((item, j) => (
                <ProductCell key={j} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
