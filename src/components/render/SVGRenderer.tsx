'use client';

interface SVGRendererProps {
  content: string;
}

export function SVGRenderer({ content }: SVGRendererProps) {
  // Sanitize: only allow valid SVG content
  const isSVG =
    content.trim().startsWith('<svg') || content.trim().startsWith('<?xml');

  if (!isSVG) {
    return <pre className="text-xs text-muted-foreground">{content}</pre>;
  }

  return (
    <div
      className="my-2 overflow-auto rounded-md border bg-white p-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
