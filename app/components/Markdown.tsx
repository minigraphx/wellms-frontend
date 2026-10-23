import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownProps {
  content: string | null | undefined;
  className?: string;
}

// Wellms stores rich text as Markdown (admin editor, course import). Older content can be HTML,
// so raw HTML is parsed as well, then sanitized with GitHub's schema: authors can enter anything.
export function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null;

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
