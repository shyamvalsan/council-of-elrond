'use client';

import { Check } from 'lucide-react';

type Winner = 'model_a' | 'model_b' | 'council' | 'tie';

interface JudgmentBarProps {
  onVote: (winner: Winner) => void;
  currentVote: Winner | null;
  disabled?: boolean;
  isSubmitting?: boolean;
  modelAName?: string;
  modelBName?: string;
}

export function JudgmentBar({
  onVote,
  currentVote,
  disabled = false,
  isSubmitting = false,
  modelAName = 'A',
  modelBName = 'B',
}: JudgmentBarProps) {
  const options: { value: Winner; label: string }[] = [
    { value: 'model_a', label: modelAName },
    { value: 'model_b', label: modelBName },
    { value: 'council', label: 'Council' },
    { value: 'tie', label: 'Tie' },
  ];

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <p className="mb-2 text-center text-sm font-medium">
        Which response was best?
      </p>
      <div className="flex justify-center gap-2">
        {options.map(({ value, label }) => {
          const isSelected = currentVote === value;
          return (
            <button
              key={value}
              onClick={() => onVote(value)}
              disabled={disabled || isSubmitting || (currentVote !== null && !isSelected)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-background hover:bg-muted disabled:opacity-50'
              }`}
            >
              {isSelected && <Check className="h-4 w-4" />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
