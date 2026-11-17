import type { GameState, TrackId } from '../state';

/**
 * Deriva diária dos estados da conspiração.
 * PROVISÓRIO (P-25): taxas apenas para que o mundo não fique imóvel.
 * Não representam prazos ou números definitivos da campanha.
 */
export const DAILY_DRIFT: Partial<Record<TrackId, number>> = {
  atividade_sangues_ralos: 1,
  avanco_necromantes: 1,
  investigacao_camarilla: 1,
};

export const INITIAL_TRACKS: Record<TrackId, number> = {
  atividade_sangues_ralos: 2,
  investigacao_camarilla: 0,
  avanco_necromantes: 2,
  exposicao_mascara: 0,
  risco_protagonistas: 0,
  preparacao_ritual: 1,
};

export function dailyDrift(s: GameState, day: number): void {
  if (day <= s.internal.lastTickDay) return;
  for (const [k, v] of Object.entries(DAILY_DRIFT) as [TrackId, number][]) {
    s.internal.tracks[k] = (s.internal.tracks[k] ?? 0) + v;
  }
  // A preparação do ritual acompanha o avanço necromântico (proporção PROVISÓRIA).
  if (s.internal.tracks.avanco_necromantes % 3 === 0) s.internal.tracks.preparacao_ritual += 1;
  s.internal.lastTickDay = day;
}
