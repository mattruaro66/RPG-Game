import type { CaseDef, ClueDef, Dialogue, DocumentDef, EncounterDef, NpcDef, ObjectiveDef, Scene } from './types';

/** Conteúdo narrativo, separado do motor. Novas campanhas registram seu próprio conteúdo. */
export interface CampaignContent {
  id: string;
  title: string;
  startScene: string;
  scenes: Record<string, Scene>;
  dialogues: Record<string, Dialogue>;
  clues: Record<string, ClueDef>;
  npcs: Record<string, NpcDef>;
  documents: Record<string, DocumentDef>;
  objectives: Record<string, ObjectiveDef>;
  cases: Record<string, CaseDef>;
  encounters: Record<string, EncounterDef>;
  locations: Record<string, { id: string; name: string; district: string; description: string }>;
}

let current: CampaignContent | null = null;

export function registerCampaign(c: CampaignContent): void {
  current = c;
}

export function content(): CampaignContent {
  if (!current) throw new Error('Nenhuma campanha registrada.');
  return current;
}
