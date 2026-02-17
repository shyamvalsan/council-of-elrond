'use client';

import katex from 'katex';
import { useMemo } from 'react';

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
}

export function MathRenderer({ content, displayMode = false }: MathRendererProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(content, {
        displayMode,
        throwOnError: false,
        trust: false,
      });
    } catch {
      return content;
    }
  }, [content, displayMode]);

  return (
    <span
      className={displayMode ? 'my-2 block text-center' : 'inline'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
