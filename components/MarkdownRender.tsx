import ReactMarkdown from 'react-markdown';
//import remarkMath from 'remark-math';
//import rehypeKatex from 'rehype-katex';
//import remarkGfm from 'remark-gfm'; // for github flavored markdown

import 'katex/dist/katex.min.css';

interface MarkdownRenderProps {
  content: string;
}

const MarkdownRender: React.FC<MarkdownRenderProps> = ({ content }) => {
  return (
    <ReactMarkdown
      //remarkPlugins={[remarkGfm]}
      //rehypePlugins={[rehypeKatex]}
      children={content}
    />
  );
};

export default MarkdownRender;
