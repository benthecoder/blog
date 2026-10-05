import Link from "next/link";
import { getWikiTree, type WikiTreeNode } from "@/utils/content/wiki";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "wiki",
  description: "A directory of things I've written up",
};

const TreeNode = ({ node }: { node: WikiTreeNode }) => (
  <section>
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-xs tracking-[0.18em] lowercase text-ink-soft dark:text-chalk-muted">
        {node.name}
      </h2>
      <div className="flex-1 border-t border-rule dark:border-night-rule" />
    </div>

    <ul className="mt-6 space-y-3.5">
      {node.pages.map((page) => (
        <li key={page.slug}>
          <Link
            href={`/wiki/${page.slug}`}
            className="text-[15px] lowercase text-ink dark:text-chalk-soft transition-colors hover:text-ink-strong dark:hover:text-chalk-strong"
          >
            {page.title}
          </Link>
        </li>
      ))}
    </ul>

    {node.children.length > 0 && (
      <div className="mt-8 space-y-10 border-l border-rule dark:border-night-rule pl-6">
        {node.children.map((child) => (
          <TreeNode key={child.name} node={child} />
        ))}
      </div>
    )}
  </section>
);

const WikiPage = () => {
  const tree = getWikiTree();

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {tree.length === 0 ? (
        <p className="text-sm text-ink-strong/40 dark:text-chalk-strong/40">
          Nothing here yet.
        </p>
      ) : (
        <div className="space-y-16">
          {tree.map((node) => (
            <TreeNode key={node.name} node={node} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WikiPage;
