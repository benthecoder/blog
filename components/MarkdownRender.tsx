import Markdown from 'markdown-to-jsx';

interface MarkdownRenderProps {
  content: string;
}

const MarkdownRender: React.FC<MarkdownRenderProps> = ({ content }) => {
  return <Markdown children={content} />;
};

export default MarkdownRender;
