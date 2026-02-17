'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './CodeBlock';
import { SVGRenderer } from './SVGRenderer';
import { MermaidRenderer } from './MermaidRenderer';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');

          // Inline code
          if (!className && !codeString.includes('\n')) {
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          }

          // SVG content
          if (language === 'svg' || codeString.trim().startsWith('<svg')) {
            return <SVGRenderer content={codeString} />;
          }

          // Mermaid diagrams
          if (language === 'mermaid') {
            return <MermaidRenderer content={codeString} />;
          }

          // Regular code block
          return (
            <CodeBlock language={language} code={codeString} />
          );
        },
        // Render inline SVG tags
        svg({ children, ...props }) {
          return (
            <SVGRenderer
              content={`<svg ${Object.entries(props)
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ')}>${children}</svg>`}
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
