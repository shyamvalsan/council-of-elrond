'use client';

import { useState } from 'react';
import { Settings, Plus, X, Minus } from 'lucide-react';
import { useModels } from '@/hooks/useModels';
import { DEFAULT_COUNCIL_MEMBERS } from '@/types/models';

interface CouncilConfigProps {
  members: string[];
  maxRounds: number;
  synthesizerStrategy: 'round-robin' | 'voted' | 'fixed';
  onMembersChange: (members: string[]) => void;
  onMaxRoundsChange: (rounds: number) => void;
  onStrategyChange: (strategy: 'round-robin' | 'voted' | 'fixed') => void;
}

export function CouncilConfig({
  members,
  maxRounds,
  synthesizerStrategy,
  onMembersChange,
  onMaxRoundsChange,
  onStrategyChange,
}: CouncilConfigProps) {
  const [open, setOpen] = useState(false);
  const { models } = useModels();

  const addMember = (modelId: string) => {
    if (members.length >= 12) return;
    if (members.includes(modelId)) return;
    onMembersChange([...members, modelId]);
  };

  const removeMember = (modelId: string) => {
    if (members.length <= 3) return;
    onMembersChange(members.filter((m) => m !== modelId));
  };

  const availableToAdd = models.filter((m) => !members.includes(m.id));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Council settings"
        title="Configure council"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded-lg border bg-popover p-4 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold">Council Configuration</h3>

          {/* Members */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium">
              Members ({members.length}/12, min 3)
            </label>
            <div className="space-y-1">
              {members.map((modelId) => {
                const model = models.find((m) => m.id === modelId);
                return (
                  <div
                    key={modelId}
                    className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-xs"
                  >
                    <span className="truncate">
                      {model?.name || modelId.split('/').pop()}
                    </span>
                    <button
                      onClick={() => removeMember(modelId)}
                      disabled={members.length <= 3}
                      className="ml-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {members.length < 12 && availableToAdd.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) addMember(e.target.value);
                  e.target.value = '';
                }}
                className="mt-2 w-full rounded-md border bg-background px-2 py-1 text-xs"
                defaultValue=""
              >
                <option value="" disabled>
                  + Add model...
                </option>
                {availableToAdd.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Max Rounds */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium">
              Max Deliberation Rounds
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onMaxRoundsChange(Math.max(1, maxRounds - 1))}
                className="rounded-md border p-1 hover:bg-muted"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{maxRounds}</span>
              <button
                onClick={() => onMaxRoundsChange(Math.min(3, maxRounds + 1))}
                className="rounded-md border p-1 hover:bg-muted"
              >
                <Plus className="h-3 w-3" />
              </button>
              <span className="text-xs text-muted-foreground">(1-3)</span>
            </div>
          </div>

          {/* Synthesizer Strategy */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium">
              Synthesizer Strategy
            </label>
            <select
              value={synthesizerStrategy}
              onChange={(e) =>
                onStrategyChange(e.target.value as typeof synthesizerStrategy)
              }
              className="w-full rounded-md border bg-background px-2 py-1 text-xs"
            >
              <option value="round-robin">Round Robin</option>
              <option value="voted">Voted</option>
              <option value="fixed">Fixed (first member)</option>
            </select>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
