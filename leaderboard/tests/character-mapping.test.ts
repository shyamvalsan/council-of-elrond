import { describe, it, expect } from 'vitest';
import {
  assignCharacters,
  CHARACTERS,
  generateFlavorText,
} from '../src/server/scoring/character-mapping.js';
import type { ModelMetrics } from '../src/server/scoring/character-mapping.js';

describe('Character Mapping', () => {
  describe('CHARACTERS constant', () => {
    it('should have 12 characters defined', () => {
      expect(CHARACTERS).toHaveLength(12);
    });

    it('should include all expected character IDs', () => {
      const ids = CHARACTERS.map((c) => c.id);
      expect(ids).toContain('gandalf');
      expect(ids).toContain('aragorn');
      expect(ids).toContain('legolas');
      expect(ids).toContain('gimli');
      expect(ids).toContain('boromir');
      expect(ids).toContain('frodo');
      expect(ids).toContain('sam');
      expect(ids).toContain('elrond');
      expect(ids).toContain('glorfindel');
      expect(ids).toContain('erestor');
      expect(ids).toContain('galdor');
      expect(ids).toContain('bilbo');
    });

    it('should have name, archetype, and description for each character', () => {
      for (const character of CHARACTERS) {
        expect(character.name).toBeTruthy();
        expect(character.archetype).toBeTruthy();
        expect(character.description).toBeTruthy();
      }
    });
  });

  describe('assignCharacters', () => {
    it('should return empty array for no models', () => {
      const result = assignCharacters([]);
      expect(result).toHaveLength(0);
    });

    it('should assign Gandalf to model with highest solo win rate AND collaboration index', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'claude',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
        }),
        createMockMetrics({
          modelId: 'gpt',
          soloWinRate: 0.7,
          collaborationIndex: 0.1,
        }),
      ];

      const result = assignCharacters(metrics);
      const gandalf = result.find((a) => a.characterId === 'gandalf');
      expect(gandalf).toBeDefined();
      expect(gandalf!.modelId).toBe('claude');
      expect(gandalf!.rationale).toContain('solo win rate');
      expect(gandalf!.rationale).toContain('collaboration index');
    });

    it('should assign Aragorn to most consistent model', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'claude',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          consistency: 0.7,
        }),
        createMockMetrics({
          modelId: 'gpt',
          soloWinRate: 0.5,
          collaborationIndex: 0.1,
          consistency: 0.95,
        }),
      ];

      const result = assignCharacters(metrics);
      const aragorn = result.find((a) => a.characterId === 'aragorn');
      expect(aragorn).toBeDefined();
      expect(aragorn!.modelId).toBe('gpt');
    });

    it('should assign Legolas to model with highest positive council delta', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'claude',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          councilDelta: 0.1,
        }),
        createMockMetrics({
          modelId: 'gpt',
          soloWinRate: 0.5,
          collaborationIndex: 0.1,
          councilDelta: 0.4,
          consistency: 0.5,
        }),
        createMockMetrics({
          modelId: 'gemini',
          soloWinRate: 0.4,
          collaborationIndex: 0.05,
          councilDelta: 0.05,
          consistency: 0.6,
        }),
      ];

      const result = assignCharacters(metrics);
      const legolas = result.find((a) => a.characterId === 'legolas');
      expect(legolas).toBeDefined();
      expect(legolas!.modelId).toBe('gpt');
    });

    it('should assign Gimli to model with high solo but low collaboration', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          consistency: 0.99,
        }),
        createMockMetrics({
          modelId: 'gimli-model',
          soloWinRate: 0.8,
          collaborationIndex: 0.05,
          consistency: 0.5,
          councilDelta: -0.1,
        }),
      ];

      const result = assignCharacters(metrics);
      const gimli = result.find((a) => a.characterId === 'gimli');
      expect(gimli).toBeDefined();
      expect(gimli!.modelId).toBe('gimli-model');
    });

    it('should assign Boromir to model with strong solo but negative collaboration', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          consistency: 0.99,
        }),
        // Gimli candidate: high solo, low but non-negative collab
        createMockMetrics({
          modelId: 'gimli-model',
          soloWinRate: 0.8,
          collaborationIndex: 0.05,
          consistency: 0.5,
        }),
        // Boromir candidate: strong solo but negative collab index
        createMockMetrics({
          modelId: 'boromir-model',
          soloWinRate: 0.7,
          collaborationIndex: -0.2,
          consistency: 0.5,
          councilDelta: -0.15,
        }),
      ];

      const result = assignCharacters(metrics);
      const boromir = result.find((a) => a.characterId === 'boromir');
      expect(boromir).toBeDefined();
      expect(boromir!.modelId).toBe('boromir-model');
    });

    it('should assign Frodo to model with best cost-adjusted performance', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          costAdjustedScore: 2.0,
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          costAdjustedScore: 1.0,
          consistency: 0.99,
        }),
        createMockMetrics({
          modelId: 'frodo-model',
          soloWinRate: 0.4,
          collaborationIndex: 0.0,
          costAdjustedScore: 10.0,
          consistency: 0.5,
          councilDelta: 0.0,
        }),
      ];

      const result = assignCharacters(metrics);
      const frodo = result.find((a) => a.characterId === 'frodo');
      expect(frodo).toBeDefined();
      expect(frodo!.modelId).toBe('frodo-model');
    });

    it('should assign Elrond to model with best synthesizer win rate', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          synthesizerWinRate: 0.4,
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          consistency: 0.99,
          synthesizerWinRate: 0.3,
        }),
        createMockMetrics({
          modelId: 'elrond-model',
          soloWinRate: 0.3,
          collaborationIndex: 0.0,
          synthesizerWinRate: 0.85,
          consistency: 0.5,
          councilDelta: 0.0,
        }),
      ];

      const result = assignCharacters(metrics);
      const elrond = result.find((a) => a.characterId === 'elrond');
      expect(elrond).toBeDefined();
      expect(elrond!.modelId).toBe('elrond-model');
    });

    it('should assign Glorfindel to model with highest single-category win rate', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          peakCategoryWinRate: 0.7,
          peakCategory: 'code',
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          consistency: 0.99,
          peakCategoryWinRate: 0.6,
          peakCategory: 'general',
        }),
        createMockMetrics({
          modelId: 'glorfindel-model',
          soloWinRate: 0.4,
          collaborationIndex: 0.0,
          peakCategoryWinRate: 0.98,
          peakCategory: 'math',
          consistency: 0.5,
          councilDelta: 0.0,
        }),
      ];

      const result = assignCharacters(metrics);
      const glorfindel = result.find((a) => a.characterId === 'glorfindel');
      expect(glorfindel).toBeDefined();
      expect(glorfindel!.modelId).toBe('glorfindel-model');
      expect(glorfindel!.rationale).toContain('math');
    });

    it('should assign Erestor to model with lowest error rate', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          errorRate: 0.15,
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          consistency: 0.99,
          errorRate: 0.10,
        }),
        // This model gets Glorfindel (highest peak category win rate among remaining)
        createMockMetrics({
          modelId: 'glorfindel-model',
          soloWinRate: 0.4,
          collaborationIndex: 0.0,
          peakCategoryWinRate: 0.95,
          peakCategory: 'code',
          errorRate: 0.20,
          consistency: 0.5,
        }),
        createMockMetrics({
          modelId: 'erestor-model',
          soloWinRate: 0.35,
          collaborationIndex: 0.0,
          errorRate: 0.02,
          consistency: 0.5,
          councilDelta: 0.0,
          peakCategoryWinRate: 0.3,
        }),
      ];

      const result = assignCharacters(metrics);
      const erestor = result.find((a) => a.characterId === 'erestor');
      expect(erestor).toBeDefined();
      expect(erestor!.modelId).toBe('erestor-model');
    });

    it('should assign Galdor to model with most additional round triggers', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          additionalRoundTriggers: 5,
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          consistency: 0.99,
          additionalRoundTriggers: 3,
        }),
        // Glorfindel absorber
        createMockMetrics({
          modelId: 'glorfindel-model',
          soloWinRate: 0.3,
          collaborationIndex: 0.0,
          peakCategoryWinRate: 0.95,
          peakCategory: 'code',
          consistency: 0.5,
        }),
        // Erestor absorber (lowest error among remaining)
        createMockMetrics({
          modelId: 'erestor-model',
          soloWinRate: 0.3,
          collaborationIndex: 0.0,
          errorRate: 0.01,
          peakCategoryWinRate: 0.2,
          consistency: 0.5,
        }),
        createMockMetrics({
          modelId: 'galdor-model',
          soloWinRate: 0.35,
          collaborationIndex: 0.0,
          additionalRoundTriggers: 20,
          consistency: 0.5,
          councilDelta: 0.0,
          peakCategoryWinRate: 0.2,
          errorRate: 0.25,
        }),
      ];

      const result = assignCharacters(metrics);
      const galdor = result.find((a) => a.characterId === 'galdor');
      expect(galdor).toBeDefined();
      expect(galdor!.modelId).toBe('galdor-model');
    });

    it('should assign Bilbo to model with highest creative/writing win rate', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'gandalf-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          creativeWinRate: 0.5,
        }),
        createMockMetrics({
          modelId: 'aragorn-model',
          soloWinRate: 0.5,
          collaborationIndex: 0.0,
          consistency: 0.99,
          creativeWinRate: 0.4,
        }),
        // Glorfindel absorber
        createMockMetrics({
          modelId: 'glorfindel-model',
          soloWinRate: 0.3,
          collaborationIndex: 0.0,
          peakCategoryWinRate: 0.95,
          peakCategory: 'math',
          consistency: 0.5,
          creativeWinRate: 0.1,
        }),
        // Erestor absorber
        createMockMetrics({
          modelId: 'erestor-model',
          soloWinRate: 0.3,
          collaborationIndex: 0.0,
          errorRate: 0.01,
          peakCategoryWinRate: 0.2,
          consistency: 0.5,
          creativeWinRate: 0.1,
        }),
        // Galdor absorber
        createMockMetrics({
          modelId: 'galdor-model',
          soloWinRate: 0.3,
          collaborationIndex: 0.0,
          additionalRoundTriggers: 10,
          peakCategoryWinRate: 0.2,
          errorRate: 0.25,
          consistency: 0.5,
          creativeWinRate: 0.1,
        }),
        createMockMetrics({
          modelId: 'bilbo-model',
          soloWinRate: 0.35,
          collaborationIndex: 0.0,
          creativeWinRate: 0.95,
          consistency: 0.5,
          councilDelta: 0.0,
          peakCategoryWinRate: 0.2,
          errorRate: 0.30,
          additionalRoundTriggers: 0,
        }),
      ];

      const result = assignCharacters(metrics);
      const bilbo = result.find((a) => a.characterId === 'bilbo');
      expect(bilbo).toBeDefined();
      expect(bilbo!.modelId).toBe('bilbo-model');
    });

    it('should not assign the same model to multiple characters', () => {
      // Only one model => it gets only one character
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'only-model',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
          consistency: 0.95,
          councilDelta: 0.5,
          costAdjustedScore: 10,
          synthesizerWinRate: 0.9,
          peakCategoryWinRate: 0.99,
          creativeWinRate: 0.95,
          additionalRoundTriggers: 20,
          errorRate: 0.01,
        }),
      ];

      const result = assignCharacters(metrics);
      expect(result).toHaveLength(1);
    });

    it('should not assign the same character to multiple models', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'model-1',
          soloWinRate: 0.9,
          collaborationIndex: 0.3,
        }),
        createMockMetrics({
          modelId: 'model-2',
          soloWinRate: 0.85,
          collaborationIndex: 0.25,
          consistency: 0.5,
        }),
      ];

      const result = assignCharacters(metrics);
      const characterIds = result.map((a) => a.characterId);
      const uniqueCharacterIds = new Set(characterIds);
      expect(characterIds.length).toBe(uniqueCharacterIds.size);
    });

    it('should handle many models and assign up to 12 characters', () => {
      const metrics: ModelMetrics[] = [];
      for (let i = 0; i < 15; i++) {
        metrics.push(
          createMockMetrics({
            modelId: `model-${i}`,
            soloWinRate: 0.3 + i * 0.04,
            collaborationIndex: (i % 5) * 0.1 - 0.1,
            consistency: 0.5 + (i % 3) * 0.15,
            councilDelta: (i % 4) * 0.1 - 0.05,
            costAdjustedScore: i * 2,
            synthesizerWinRate: i * 0.05,
            peakCategoryWinRate: 0.3 + i * 0.05,
            peakCategory: ['code', 'creative', 'reasoning', 'factual', 'math'][i % 5]!,
            errorRate: 0.5 - i * 0.03,
            additionalRoundTriggers: i * 2,
            creativeWinRate: i * 0.06,
          })
        );
      }

      const result = assignCharacters(metrics);
      expect(result.length).toBeLessThanOrEqual(12);
      expect(result.length).toBeGreaterThan(0);

      // All assignments should have unique model IDs
      const modelIds = result.map((a) => a.modelId);
      expect(new Set(modelIds).size).toBe(modelIds.length);

      // All assignments should have unique character IDs
      const charIds = result.map((a) => a.characterId);
      expect(new Set(charIds).size).toBe(charIds.length);
    });

    it('should not assign Gandalf if no model has both positive solo win rate and positive collaboration index', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'model-a',
          soloWinRate: 0.0,
          collaborationIndex: 0.0,
          consistency: 0.5,
        }),
      ];

      const result = assignCharacters(metrics);
      const gandalf = result.find((a) => a.characterId === 'gandalf');
      expect(gandalf).toBeUndefined();
    });

    it('should not assign Gimli if no model meets the solo threshold', () => {
      const metrics: ModelMetrics[] = [
        createMockMetrics({
          modelId: 'model-a',
          soloWinRate: 0.2, // Below 0.4 threshold
          collaborationIndex: 0.05,
          consistency: 0.5,
        }),
      ];

      const result = assignCharacters(metrics);
      const gimli = result.find((a) => a.characterId === 'gimli');
      expect(gimli).toBeUndefined();
    });
  });

  describe('generateFlavorText', () => {
    it('should generate text containing the model ID for known characters', () => {
      for (const character of CHARACTERS) {
        const text = generateFlavorText(character.id, 'test-model');
        expect(text).toContain('test-model');
      }
    });

    it('should generate Gandalf flavor text with wizard reference', () => {
      const text = generateFlavorText('gandalf', 'claude');
      expect(text).toContain('wizard');
      expect(text).toContain('claude');
    });

    it('should generate Sam flavor text with carrying reference', () => {
      const text = generateFlavorText('sam', 'gpt');
      expect(text).toContain('carry');
      expect(text).toContain('gpt');
    });

    it('should generate Frodo flavor text with Ring reference', () => {
      const text = generateFlavorText('frodo', 'gemini');
      expect(text).toContain('Ring');
      expect(text).toContain('gemini');
    });

    it('should return fallback text for unknown character ID', () => {
      const text = generateFlavorText('unknown-character', 'some-model');
      expect(text).toContain('some-model');
      expect(text).toContain('Council of Elrond');
    });

    it('should generate unique text for each character', () => {
      const texts = new Set<string>();
      for (const character of CHARACTERS) {
        const text = generateFlavorText(character.id, 'model');
        texts.add(text);
      }
      // All should be unique
      expect(texts.size).toBe(CHARACTERS.length);
    });
  });
});

// Helper to create mock ModelMetrics with sensible defaults
function createMockMetrics(overrides: Partial<ModelMetrics> = {}): ModelMetrics {
  return {
    modelId: 'test-model',
    soloWinRate: 0.5,
    collaborationIndex: 0,
    consistency: 0.8,
    councilDelta: 0,
    costAdjustedScore: 0,
    synthesizerWinRate: 0,
    peakCategoryWinRate: 0.5,
    peakCategory: 'general',
    errorRate: 0.3,
    additionalRoundTriggers: 0,
    creativeWinRate: 0,
    ...overrides,
  };
}
