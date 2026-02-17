'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface UserSettings {
  openrouterKey: string;
  anthropicKey: string;
  openaiKey: string;
  googleKey: string;
  defaultModelA: string;
  defaultModelB: string;
  defaultCouncilMembers: string[];
  maxRounds: number;
  showTranscript: boolean;
  submitToLeaderboard: boolean;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: UserSettings = {
  openrouterKey: '',
  anthropicKey: '',
  openaiKey: '',
  googleKey: '',
  defaultModelA: 'anthropic/claude-opus-4-6',
  defaultModelB: 'openai/gpt-5-2',
  defaultCouncilMembers: [
    'anthropic/claude-opus-4-6',
    'openai/gpt-5-2',
    'google/gemini-3-pro-preview',
  ],
  maxRounds: 3,
  showTranscript: false,
  submitToLeaderboard: true,
  theme: 'system',
};

function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem('council-settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: UserSettings): void {
  localStorage.setItem('council-settings', JSON.stringify(settings));
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    saveSettings(settings);
    onClose();
  };

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* API Keys Section */}
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">API Keys</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Keys are stored in your browser only, never sent to our servers.
            </p>
            <div className="space-y-3">
              {[
                { label: 'OpenRouter', key: 'openrouterKey' as const },
                { label: 'Anthropic', key: 'anthropicKey' as const },
                { label: 'OpenAI', key: 'openaiKey' as const },
                { label: 'Google AI', key: 'googleKey' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium">{label}</label>
                  <div className="relative">
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={settings[key]}
                      onChange={(e) => updateSetting(key, e.target.value)}
                      placeholder={`Enter ${label} API key`}
                      className="w-full rounded-md border bg-background px-3 py-1.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {showKeys ? (
                  <><EyeOff className="h-3 w-3" /> Hide keys</>
                ) : (
                  <><Eye className="h-3 w-3" /> Show keys</>
                )}
              </button>
            </div>
          </div>

          {/* Council Settings */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Council Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Max Deliberation Rounds</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxRounds}
                  onChange={(e) => updateSetting('maxRounds', parseInt(e.target.value, 10))}
                  className="w-20 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showTranscript}
                  onChange={(e) => updateSetting('showTranscript', e.target.checked)}
                  className="rounded"
                />
                Show deliberation transcript by default
              </label>
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Leaderboard</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.submitToLeaderboard}
                onChange={(e) => updateSetting('submitToLeaderboard', e.target.checked)}
                className="rounded"
              />
              Submit judgments to public leaderboard
            </label>
          </div>

          {/* Theme */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Theme</h3>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as UserSettings['theme'])}
              className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
