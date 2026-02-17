/**
 * Maps models to LOTR characters based on performance criteria.
 *
 * Character mapping rules:
 * - Gandalf:    Highest solo win rate AND highest collaboration index
 * - Aragorn:    Most consistent across all categories
 * - Legolas:    Highest positive delta when added to council
 * - Gimli:      High solo but lower collaboration index
 * - Boromir:    Strong solo but hurts council outcomes (negative collab index)
 * - Frodo:      Best cost-adjusted performance (quality per dollar)
 * - Sam:        Highest average positive delta when added to any council
 * - Elrond:     Best score in synthesizer role
 * - Glorfindel: Highest win rate in a single category
 * - Erestor:    Lowest error rate
 * - Galdor:     Most triggers for productive additional rounds
 * - Bilbo:      Highest win rate on creative/writing tasks
 */

export interface CharacterDefinition {
  id: string;
  name: string;
  archetype: string;
  description: string;
}

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: 'gandalf',
    name: 'Gandalf',
    archetype: 'The Wise Orchestrator',
    description:
      'Highest solo win rate AND highest collaboration index — great alone and makes everyone better',
  },
  {
    id: 'aragorn',
    name: 'Aragorn',
    archetype: 'The Reluctant King',
    description:
      'Most consistent performer across all prompt categories — reliable under any circumstances',
  },
  {
    id: 'legolas',
    name: 'Legolas',
    archetype: 'The Sharp-Eyed Specialist',
    description:
      'Highest positive delta when added to a council — the precision that catches what others miss',
  },
  {
    id: 'gimli',
    name: 'Gimli',
    archetype: 'The Stubborn Powerhouse',
    description:
      'High solo score but lower collaboration index — devastating alone, clashes in groups',
  },
  {
    id: 'boromir',
    name: 'Boromir',
    archetype: 'The Ambitious Contender',
    description:
      'Strong solo but actively hurts council outcomes — impressive yet corruptive in collaboration',
  },
  {
    id: 'frodo',
    name: 'Frodo',
    archetype: 'The Unexpected Hero',
    description:
      'Best cost-adjusted performance (quality per dollar) — the small model that carries the weight',
  },
  {
    id: 'sam',
    name: 'Sam',
    archetype: 'The Loyal Supporter',
    description:
      'Highest average positive delta when added to any council — makes everyone around them better',
  },
  {
    id: 'elrond',
    name: 'Elrond',
    archetype: 'The Wise Convener',
    description:
      'Best score specifically in the synthesizer role — brings order from chaos',
  },
  {
    id: 'glorfindel',
    name: 'Glorfindel',
    archetype: 'The Ancient Specialist',
    description:
      'Highest win rate in a single category — devastating in their domain',
  },
  {
    id: 'erestor',
    name: 'Erestor',
    archetype: 'The Cautious Advisor',
    description:
      'Lowest error rate across all judgments — conservative, thorough, rarely wrong',
  },
  {
    id: 'galdor',
    name: 'Galdor',
    archetype: 'The Questioner',
    description:
      'Most frequently triggers productive additional deliberation rounds — asks the right questions',
  },
  {
    id: 'bilbo',
    name: 'Bilbo',
    archetype: 'The Storyteller',
    description:
      'Highest win rate on creative and writing tasks — surprising, inventive, full of unexpected angles',
  },
];

export interface ModelMetrics {
  modelId: string;
  soloWinRate: number;
  collaborationIndex: number;
  consistency: number;          // 0-1, higher = more consistent across categories
  councilDelta: number;         // avg win rate delta when model is added to council
  costAdjustedScore: number;    // quality per dollar (win rate / avg cost per judgment)
  synthesizerWinRate: number;   // win rate when serving as synthesizer
  peakCategoryWinRate: number;  // highest win rate in any single category
  peakCategory: string;         // which category they peak in
  errorRate: number;            // fraction of judgments resulting in loss
  additionalRoundTriggers: number;
  creativeWinRate: number;      // win rate on creative/writing tasks
}

export interface CharacterAssignmentResult {
  modelId: string;
  characterId: string;
  characterName: string;
  rationale: string;
}

/**
 * Assigns LOTR characters to models based on their performance metrics.
 * Each character can only be assigned to one model (the best fit).
 * Each model gets at most one character.
 *
 * Characters are assigned in priority order. Once a model gets a character,
 * they are removed from consideration for other characters.
 */
export function assignCharacters(
  metrics: ModelMetrics[]
): CharacterAssignmentResult[] {
  if (metrics.length === 0) return [];

  const assignments: CharacterAssignmentResult[] = [];
  const assignedModels = new Set<string>();
  const assignedCharacters = new Set<string>();

  function tryAssign(
    characterId: string,
    characterName: string,
    modelId: string,
    rationale: string
  ): boolean {
    if (assignedModels.has(modelId) || assignedCharacters.has(characterId)) {
      return false;
    }
    assignments.push({ modelId, characterId, characterName, rationale });
    assignedModels.add(modelId);
    assignedCharacters.add(characterId);
    return true;
  }

  function available(m: ModelMetrics): boolean {
    return !assignedModels.has(m.modelId);
  }

  // Sort candidates helper
  const candidates = [...metrics];

  // 1. Gandalf: Highest solo win rate AND highest collaboration index
  // We look for the model that scores best on BOTH criteria
  const gandalfCandidates = candidates
    .filter(available)
    .filter((m) => m.soloWinRate > 0 && m.collaborationIndex > 0)
    .sort(
      (a, b) =>
        b.soloWinRate + b.collaborationIndex - (a.soloWinRate + a.collaborationIndex)
    );
  if (gandalfCandidates.length > 0) {
    const g = gandalfCandidates[0]!;
    tryAssign(
      'gandalf',
      'Gandalf',
      g.modelId,
      `Highest combined solo win rate (${(g.soloWinRate * 100).toFixed(1)}%) and collaboration index (${(g.collaborationIndex * 100).toFixed(1)}%)`
    );
  }

  // 2. Aragorn: Most consistent across all categories
  const aragornCandidates = candidates
    .filter(available)
    .sort((a, b) => b.consistency - a.consistency);
  if (aragornCandidates.length > 0) {
    const a = aragornCandidates[0]!;
    tryAssign(
      'aragorn',
      'Aragorn',
      a.modelId,
      `Most consistent across categories (consistency score: ${(a.consistency * 100).toFixed(1)}%)`
    );
  }

  // 3. Legolas: Highest positive delta when added to council
  const legolasCandidates = candidates
    .filter(available)
    .filter((m) => m.councilDelta > 0)
    .sort((a, b) => b.councilDelta - a.councilDelta);
  if (legolasCandidates.length > 0) {
    const l = legolasCandidates[0]!;
    tryAssign(
      'legolas',
      'Legolas',
      l.modelId,
      `Highest positive council delta (+${(l.councilDelta * 100).toFixed(1)}% win rate when added)`
    );
  }

  // 4. Gimli: High solo but lower collaboration index
  const gimliCandidates = candidates
    .filter(available)
    .filter((m) => m.soloWinRate > 0.4 && m.collaborationIndex < 0.1)
    .sort((a, b) => b.soloWinRate - a.soloWinRate);
  if (gimliCandidates.length > 0) {
    const g = gimliCandidates[0]!;
    tryAssign(
      'gimli',
      'Gimli',
      g.modelId,
      `High solo win rate (${(g.soloWinRate * 100).toFixed(1)}%) but low collaboration index (${(g.collaborationIndex * 100).toFixed(1)}%)`
    );
  }

  // 5. Boromir: Strong solo but hurts council outcomes (negative collab index)
  const boromirCandidates = candidates
    .filter(available)
    .filter((m) => m.soloWinRate > 0.3 && m.collaborationIndex < 0)
    .sort((a, b) => a.collaborationIndex - b.collaborationIndex); // most negative first
  if (boromirCandidates.length > 0) {
    const b = boromirCandidates[0]!;
    tryAssign(
      'boromir',
      'Boromir',
      b.modelId,
      `Strong solo (${(b.soloWinRate * 100).toFixed(1)}%) but hurts councils (collab index: ${(b.collaborationIndex * 100).toFixed(1)}%)`
    );
  }

  // 6. Frodo: Best cost-adjusted performance
  const frodoCandidates = candidates
    .filter(available)
    .filter((m) => m.costAdjustedScore > 0)
    .sort((a, b) => b.costAdjustedScore - a.costAdjustedScore);
  if (frodoCandidates.length > 0) {
    const f = frodoCandidates[0]!;
    tryAssign(
      'frodo',
      'Frodo',
      f.modelId,
      `Best cost-adjusted score (${f.costAdjustedScore.toFixed(2)} quality per dollar)`
    );
  }

  // 7. Sam: Highest average positive delta when added to any council
  // (Similar to Legolas but we use a separate metric - Sam is about boosting others)
  const samCandidates = candidates
    .filter(available)
    .filter((m) => m.councilDelta > 0)
    .sort((a, b) => b.councilDelta - a.councilDelta);
  if (samCandidates.length > 0) {
    const s = samCandidates[0]!;
    tryAssign(
      'sam',
      'Sam',
      s.modelId,
      `Highest positive delta when added to councils (+${(s.councilDelta * 100).toFixed(1)}%)`
    );
  }

  // 8. Elrond: Best score in synthesizer role
  const elrondCandidates = candidates
    .filter(available)
    .filter((m) => m.synthesizerWinRate > 0)
    .sort((a, b) => b.synthesizerWinRate - a.synthesizerWinRate);
  if (elrondCandidates.length > 0) {
    const e = elrondCandidates[0]!;
    tryAssign(
      'elrond',
      'Elrond',
      e.modelId,
      `Best synthesizer win rate (${(e.synthesizerWinRate * 100).toFixed(1)}%)`
    );
  }

  // 9. Glorfindel: Highest win rate in a single category
  const glorfindelCandidates = candidates
    .filter(available)
    .sort((a, b) => b.peakCategoryWinRate - a.peakCategoryWinRate);
  if (glorfindelCandidates.length > 0) {
    const g = glorfindelCandidates[0]!;
    tryAssign(
      'glorfindel',
      'Glorfindel',
      g.modelId,
      `Highest single-category win rate: ${(g.peakCategoryWinRate * 100).toFixed(1)}% in ${g.peakCategory}`
    );
  }

  // 10. Erestor: Lowest error rate
  const erestorCandidates = candidates
    .filter(available)
    .sort((a, b) => a.errorRate - b.errorRate);
  if (erestorCandidates.length > 0) {
    const e = erestorCandidates[0]!;
    tryAssign(
      'erestor',
      'Erestor',
      e.modelId,
      `Lowest error rate (${(e.errorRate * 100).toFixed(1)}%)`
    );
  }

  // 11. Galdor: Most triggers for productive additional rounds
  const galdorCandidates = candidates
    .filter(available)
    .filter((m) => m.additionalRoundTriggers > 0)
    .sort((a, b) => b.additionalRoundTriggers - a.additionalRoundTriggers);
  if (galdorCandidates.length > 0) {
    const g = galdorCandidates[0]!;
    tryAssign(
      'galdor',
      'Galdor',
      g.modelId,
      `Most productive additional round triggers (${g.additionalRoundTriggers})`
    );
  }

  // 12. Bilbo: Highest win rate on creative/writing tasks
  const bilboCandidates = candidates
    .filter(available)
    .filter((m) => m.creativeWinRate > 0)
    .sort((a, b) => b.creativeWinRate - a.creativeWinRate);
  if (bilboCandidates.length > 0) {
    const b = bilboCandidates[0]!;
    tryAssign(
      'bilbo',
      'Bilbo',
      b.modelId,
      `Highest creative/writing win rate (${(b.creativeWinRate * 100).toFixed(1)}%)`
    );
  }

  return assignments;
}

/**
 * Generate flavor text for a character assignment.
 */
export function generateFlavorText(
  characterId: string,
  modelId: string
): string {
  const flavorTexts: Record<string, string> = {
    gandalf: `"A wizard is never late, nor is he early. He arrives precisely when he means to -- and with the correct answer." -- Gandalf on ${modelId}`,
    aragorn: `"I would have gone with you to the end. Into the very fires of Mordor." Aragorn's steadiness lives in ${modelId}.`,
    legolas: `"They're taking the hobbits to Isengard!" With eyes like ${modelId}, nothing escapes notice.`,
    gimli: `"Certainty of death. Small chance of success. What are we waiting for?" ${modelId} charges in alone.`,
    boromir: `"One does not simply walk into Mordor." Nor does one simply add ${modelId} to a council without consequence.`,
    frodo: `"I will take the Ring, though I do not know the way." ${modelId} carries burdens far beyond its size.`,
    sam: `"I can't carry it for you, but I can carry you!" ${modelId} lifts every council it joins.`,
    elrond: `"The ring cannot be destroyed by any craft that we here possess." But ${modelId} can synthesize what none alone could see.`,
    glorfindel: `"Even the very wise cannot see all ends." But in its domain, ${modelId} sees everything.`,
    erestor: `"Counsel could be found in Rivendell that was both wise and thorough." ${modelId} rarely errs.`,
    galdor: `"What power still remains lies with us." ${modelId} asks the questions that make councils great.`,
    bilbo: `"I am quite ready for another adventure!" ${modelId} turns every prompt into a tale worth telling.`,
  };

  return flavorTexts[characterId] ?? `${modelId} has earned a place at the Council of Elrond.`;
}
