'use client';

import { useModels } from '@/hooks/useModels';
import type { ModelInfo } from '@/types/models';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  label?: string;
  apiKey?: string;
}

export function ModelSelector({
  value,
  onChange,
  label,
  apiKey,
}: ModelSelectorProps) {
  const { models, isLoading, error } = useModels(apiKey);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModel = models.find((m) => m.id === value);
  const displayName = selectedModel?.name || value.split('/').pop() || 'Select model';

  return (
    <div className="relative w-56" ref={dropdownRef}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
        disabled={isLoading}
      >
        <span className="truncate">
          {isLoading ? 'Loading...' : displayName}
        </span>
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      {open && !isLoading && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
          {error ? (
            <p className="p-3 text-sm text-destructive">{error}</p>
          ) : (
            models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onChange(model.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
                  model.id === value ? 'bg-muted font-medium' : ''
                }`}
              >
                <div className="flex-1 truncate">
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {model.id}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
