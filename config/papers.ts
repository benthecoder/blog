/**
 * Topics on /papers, in display order. A paper note's wiki category is
 * `papers/<slug>`; unknown slugs are listed after these under their own name.
 */
export const PAPER_TOPICS = [
  { slug: "llms-and-agents", label: "LLMs & Agents" },
  { slug: "deep-learning-foundations", label: "Deep Learning Foundations" },
  { slug: "ai-for-medicine-and-science", label: "AI for Medicine & Science" },
  { slug: "ai-futures-and-society", label: "AI Futures & Society" },
  { slug: "computing-and-the-mind", label: "Computing & the Mind" },
  { slug: "startups-and-strategy", label: "Startups & Strategy" },
  {
    slug: "investing-markets-and-crypto",
    label: "Investing, Markets & Crypto",
  },
] as const;

/** Wiki category prefix that marks a page as a paper note. */
export const PAPERS_CATEGORY = "papers";
