/**
 * CAMADA INTERNA DA CAMPANHA (seção 31).
 * Nunca exibida ao jogador fora do Modo Mestre. Não é importada por
 * componentes da camada do jogador (diário, cenas, fichas).
 *
 * Tudo o que não foi definido pelo criador está marcado como PENDENTE.
 */

export interface InternalNpcNotes {
  npcId: string;
  realGoals: string[];
  secrets: string[];
  knowledge: string[];
  status: 'CANÔNICO' | 'PROPOSTO' | 'PENDENTE';
}

export const INTERNAL_NPCS: InternalNpcNotes[] = [
  {
    npcId: 'victoria',
    realGoals: ['Encontrar Thomas Reed (canônico).'],
    secrets: ['PENDENTE: a natureza de Victoria e sua relação com a sociedade noturna não foram definidas pelo criador.'],
    knowledge: ['Conhece as atividades financeiras do marido.'],
    status: 'PENDENTE',
  },
  {
    npcId: 'richard',
    realGoals: ['PENDENTE'],
    secrets: ['PROPOSTO: as transferências da Halcyon Holdings são pagamentos, não lavagem. Destinatário PENDENTE.'],
    knowledge: ['PENDENTE: se sabe do caso de Victoria com Thomas.'],
    status: 'PROPOSTO',
  },
  {
    npcId: 'thomas',
    realGoals: ['Expor algo que encontrou numa auditoria da Halcyon Holdings (proposto).'],
    secrets: ['PENDENTE: destino de Thomas (vivo, morto, transformado) — não definido.'],
    knowledge: ['Fez cópias de documentos e as escondeu (proposto).'],
    status: 'PROPOSTO',
  },
];

/** Visão geral da conspiração (seção 18) — referência para o Modo Mestre. */
export const CONSPIRACY_OVERVIEW = [
  'Uma facção necromântica (precursora das linhagens que formarão os Hecata) firmou acordo com grupos de Sangues-Ralos.',
  'Os Sangues-Ralos buscam deixar sua condição inferior; alguns acreditam na diablerie.',
  'O objetivo real dos necromantes é acumular mortes e corpos para um ritual de grande escala.',
  'A Camarilla ainda não compreende que os acontecimentos estão relacionados.',
  'PENDENTE: número de vítimas, artefatos, locais rituais, prazos e condições de vitória.',
  'PROPOSTO: o Nocturne (Ludlow St.) é um ponto de contato entre os invasores e quem os contratou.',
];
