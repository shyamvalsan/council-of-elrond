'use client';

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useModels } from '@/hooks/useModels';

const BUDGET_STEPS = [8192, 16384, 24576, 32768];
const BUDGET_LABELS: Record<number, string> = {
  8192: '8K',
  16384: '16K',
  24576: '24K',
  32768: '32K',
};

interface CouncilConfigProps {
  members: string[];
  contextBudget: number;
  onMembersChange: (members: string[]) => void;
  onContextBudgetChange: (budget: number) => void;
}

export function CouncilConfig({
  members,
  contextBudget,
  onMembersChange,
  onContextBudgetChange,
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

  const budgetIndex = BUDGET_STEPS.indexOf(contextBudget);
  const sliderValue = budgetIndex >= 0 ? budgetIndex : 1;

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

          {/* Context Budget */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium">
              Context Budget
            </label>
            <input
              type="range"
              min={0}
              max={BUDGET_STEPS.length - 1}
              step={1}
              value={sliderValue}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                onContextBudgetChange(BUDGET_STEPS[idx]);
              }}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              {BUDGET_STEPS.map((step) => (
                <span
                  key={step}
                  className={step === contextBudget ? 'font-semibold text-primary' : ''}
                >
                  {BUDGET_LABELS[step]}
                </span>
              ))}
            </div>
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
