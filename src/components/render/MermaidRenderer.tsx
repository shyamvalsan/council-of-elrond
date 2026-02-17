'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidRendererProps {
  content: string;
}

export function MermaidRenderer({ content }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
        });

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, content);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    }

    renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [content]);

  if (error) {
    return (
      <div className="my-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
        <p className="text-xs text-destructive">Mermaid error: {error}</p>
        <pre className="mt-2 text-xs text-muted-foreground">{content}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-2 flex items-center justify-center rounded-md border bg-muted/30 p-8">
        <span className="text-sm text-muted-foreground">Rendering diagram...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-2 overflow-auto rounded-md border bg-white p-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
