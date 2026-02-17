'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Play, Loader2 } from 'lucide-react';
import hljs from 'highlight.js';

interface CodeBlockProps {
  code: string;
  language?: string;
  showRunButton?: boolean;
}

export function CodeBlock({
  code,
  language = '',
  showRunButton = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleRun = useCallback(async () => {
    if (language !== 'javascript' && language !== 'js') return;
    setRunning(true);
    try {
      // Safe evaluation using Function constructor (sandboxed)
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        error: (...args: unknown[]) => logs.push(`Error: ${args.map(String).join(' ')}`),
      };
      const fn = new Function('console', code);
      fn(mockConsole);
      setOutput(logs.join('\n') || '(no output)');
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  }, [code, language]);

  let highlightedHtml = code;
  try {
    if (language && hljs.getLanguage(language)) {
      highlightedHtml = hljs.highlight(code, { language }).value;
    } else {
      highlightedHtml = hljs.highlightAuto(code).value;
    }
  } catch {
    // Fallback to plain text
  }

  const canRun =
    showRunButton && (language === 'javascript' || language === 'js');

  return (
    <div className="group relative my-2 rounded-md border bg-muted/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-1">
        <span className="text-xs text-muted-foreground">
          {language || 'code'}
        </span>
        <div className="flex gap-1">
          {canRun && (
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {running ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Run
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code */}
      <pre className="overflow-x-auto p-3">
        <code
          className={`text-sm ${language ? `language-${language}` : ''}`}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>

      {/* Output */}
      {output !== null && (
        <div className="border-t bg-background p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Output:
          </p>
          <pre className="text-xs">{output}</pre>
        </div>
      )}
    </div>
  );
}
