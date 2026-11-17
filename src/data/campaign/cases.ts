/**
 * Casos iniciais (seção 20). Bellevue e Village Voice estão estruturados
 * para expansão: pistas-gancho, objetivos e NPCs já existem; cenas jogáveis
 * entram nas próximas etapas (ver IMPLEMENTATION_PLAN.md).
 */
import type { CaseDef, NpcDef, ObjectiveDef } from '../../engine/narrative/types';

export const CASES: CaseDef[] = [
  {
    id: 'caso_reed',
    title: 'O desaparecimento de Thomas Reed',
    summary: 'Uma cliente de vermelho quer encontrar o amante, desaparecido há onze dias. Ela acredita que ele está morto e não pode procurar a polícia.',
    centralCharacter: 'jack',
  },
  {
    id: 'caso_bellevue',
    title: 'O paciente do Bellevue',
    summary: 'Um homem morreu no pronto-socorro com uma perda de sangue que os ferimentos não explicam. Seu prontuário desapareceu.',
    centralCharacter: 'daniel',
  },
  {
    id: 'caso_voice',
    title: 'Os corpos sem identificação',
    summary: 'Corpos sem nome, registros incompletos e mortes semelhantes em hospitais diferentes. Uma fonte numa funerária que pediu anonimato.',
    centralCharacter: 'liz',
  },
];

export const EXTRA_OBJECTIVES: ObjectiveDef[] = [
  { id: 'obj_bellevue', caseId: 'caso_bellevue', text: 'Descobrir quem levou o prontuário do paciente do Bellevue.' },
  { id: 'obj_voice', caseId: 'caso_voice', text: 'Encontrar a fonte da funerária que falou com Liz Morgan.' },
];

export const EXTRA_NPCS: NpcDef[] = [
  { id: 'homem_terno', gender: 'm', name: 'Homem de terno escuro', publicRole: 'Esteve no Bellevue pedindo o prontuário.', location: 'Desconhecida', initialTrust: 0, publicNotes: 'Ninguém lembra do rosto dele com clareza.' },
  { id: 'fonte_funeraria', name: 'Fonte da funerária', publicRole: 'Funcionário de funerária que procurou Liz Morgan.', location: 'Desconhecida', initialTrust: 1, publicNotes: 'Pediu anonimato. Deixou de responder.' },
];

export const LOCATIONS = {
  loc_escritorio: { id: 'loc_escritorio', name: 'Escritório de Jack Sullivan', district: 'Midtown', description: 'Quarto andar de um prédio cansado da Rua 46 Oeste.' },
  loc_predio_thomas: { id: 'loc_predio_thomas', name: 'Prédio de Thomas Reed', district: 'Upper East Side', description: 'Rua 78 Leste, nº 211. Pré-guerra, toldo verde.' },
  loc_apartamento: { id: 'loc_apartamento', name: 'Apartamento 5C', district: 'Upper East Side', description: 'O apartamento de Thomas Reed.' },
  loc_rua78: { id: 'loc_rua78', name: 'Rua 78 Leste', district: 'Upper East Side', description: 'Calçada fria, vapor dos bueiros.' },
};
