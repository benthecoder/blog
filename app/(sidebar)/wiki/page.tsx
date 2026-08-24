import Link from "next/link";
import { getWikiTree, type WikiTreeNode } from "@/utils/content/wiki";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "wiki",
  description: "A directory of things I've written up",
};

const TreeNode = ({ node }: { node: WikiTreeNode }) => (
  <div>
    <h2 className="text-sm text-ink-strong/40 dark:text-chalk-strong/40 mb-3 lowercase">
      {node.name}
    </h2>
    <div className="pl-4 space-y-2.5">
      {node.pages.map((page) => (
        <div key={page.slug}>
          <Link
            href={`/wiki/${page.slug}`}
            className="text-sm text-ink dark:text-chalk-soft hover:underline underline-offset-2 lowercase"
          >
            {page.title}
          </Link>
        </div>
      ))}
      {node.children.map((child) => (
        <TreeNode key={child.name} node={child} />
      ))}
    </div>
  </div>
);

const WikiPage = () => {
  const tree = getWikiTree();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {tree.length === 0 ? (
        <p className="text-sm text-ink-strong/40 dark:text-chalk-strong/40">
          Nothing here yet.
        </p>
      ) : (
        <div className="space-y-10">
          {tree.map((node) => (
            <TreeNode key={node.name} node={node} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WikiPage;
