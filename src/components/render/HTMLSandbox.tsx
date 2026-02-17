'use client';

import { useRef, useEffect, useState } from 'react';

interface HTMLSandboxProps {
  content: string;
  height?: number;
}

export function HTMLSandbox({ content, height = 300 }: HTMLSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(height);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(content);
    doc.close();

    // Auto-resize
    const resizeObserver = new ResizeObserver(() => {
      const body = doc.body;
      if (body) {
        const newHeight = body.scrollHeight + 20;
        setIframeHeight(Math.min(newHeight, 600));
      }
    });

    if (doc.body) {
      resizeObserver.observe(doc.body);
    }

    return () => resizeObserver.disconnect();
  }, [content]);

  return (
    <div className="my-2 overflow-hidden rounded-md border">
      <div className="border-b bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        HTML Preview
      </div>
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        style={{ width: '100%', height: `${iframeHeight}px`, border: 'none' }}
        title="HTML sandbox"
      />
    </div>
  );
}
