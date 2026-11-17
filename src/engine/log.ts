import { describeTest, type TestResult } from './checks';
import type { GameState, NarrativeKind } from './state';

const MAX_NARRATIVE = 300;
const MAX_DICE = 200;

export function pushNarrative(s: GameState, kind: NarrativeKind, text: string, speaker?: string): void {
  s.seq += 1;
  s.narrative.push({ id: s.seq, kind, text, speaker, time: s.time });
  if (s.narrative.length > MAX_NARRATIVE) s.narrative.splice(0, s.narrative.length - MAX_NARRATIVE);
}

export function pushDiceLines(s: GameState, lines: string[], outcome: string, actor?: string): void {
  s.seq += 1;
  s.diceLog.push({ id: s.seq, time: s.time, actor, lines, outcome });
  if (s.diceLog.length > MAX_DICE) s.diceLog.splice(0, s.diceLog.length - MAX_DICE);
}

export function outcomeLabel(r: TestResult): string {
  if (r.impossible) return 'Impossível';
  if (r.kind === 'd20' && r.critical) return 'Crítico';
  return r.success ? 'Sucesso' : 'Falha';
}

export function pushTest(s: GameState, r: TestResult, actor?: string): void {
  pushDiceLines(s, describeTest(r, actor), outcomeLabel(r), actor);
}

export function shortTestSummary(r: TestResult): string {
  if (r.impossible) return `${r.label}: impossível`;
  if (r.kind === 'd6') return `${r.label} — D6 ${r.roll} vs ${r.effective}: ${outcomeLabel(r)}`;
  return `${r.label} — D20 ${r.rolls.join('→')} vs ${r.breakdown.limit}: ${outcomeLabel(r)}`;
}
