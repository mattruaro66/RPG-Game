import { registerCampaign, type CampaignContent } from '../../engine/narrative/registry';
import { CASES, EXTRA_NPCS, EXTRA_OBJECTIVES, LOCATIONS } from './cases';
import { REED_CLUES, REED_DIALOGUES, REED_DOCUMENTS, REED_ENCOUNTERS, REED_NPCS, REED_OBJECTIVES, REED_SCENES } from './reed';

const byId = <T extends { id: string }>(list: T[]): Record<string, T> => Object.fromEntries(list.map((x) => [x.id, x]));

export const CAMPAIGN: CampaignContent = {
  id: 'nova_iorque_1992',
  title: 'Nova Iorque: 1992',
  startScene: 'escritorio',
  scenes: byId(REED_SCENES),
  dialogues: byId(REED_DIALOGUES),
  clues: byId(REED_CLUES),
  npcs: byId([...REED_NPCS, ...EXTRA_NPCS]),
  documents: byId(REED_DOCUMENTS),
  objectives: byId([...REED_OBJECTIVES, ...EXTRA_OBJECTIVES]),
  cases: byId(CASES),
  encounters: byId(REED_ENCOUNTERS),
  locations: LOCATIONS,
};

registerCampaign(CAMPAIGN);
