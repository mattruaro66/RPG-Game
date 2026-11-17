import type { ContextTag } from '../engine/types';

export type BonusSpecial = 'repetir_d20' | 'memoria_fotografica' | 'ambidestro' | 'sinal_de_perigo';

export interface OnusDef {
  description: string;
  /** Dispara se QUALQUER uma destas etiquetas estiver presente. */
  whenAny?: ContextTag[];
  /** Dispara se NENHUMA destas etiquetas estiver presente. */
  whenMissing?: ContextTag[];
  /** Nunca dispara se alguma destas estiver presente. */
  exceptWhen?: ContextTag[];
  /** Exige que a ação esteja no domínio do bônus (etiquetas de ativação). */
  requiresActivation: boolean;
}

export interface BonusDef {
  id: string;
  number: number;
  name: string;
  description: string;
  /** Etiquetas que ativam o +5. Vazio = sem modificador numérico. */
  activation: ContextTag[];
  positiveModifier: 0 | 5;
  onus?: OnusDef;
  special?: BonusSpecial;
  specialRules?: string;
}

// CANÔNICO: 20 bônus. A tradução para etiquetas de contexto é PROVISÓRIA (P-23).
export const BONUSES: BonusDef[] = [
  {
    id: 'olho_clinico', number: 1, name: 'Olho Clínico',
    description: '+5 para perceber detalhes e irregularidades.',
    activation: ['perceber_detalhes'], positiveModifier: 5,
  },
  {
    id: 'memoria_fotografica', number: 2, name: 'Memória Fotográfica',
    description: 'Permite recuperar detalhes de conversas, documentos, imagens e acontecimentos anteriormente presenciados. Não cria informações que o personagem nunca conheceu.',
    activation: [], positiveModifier: 0, special: 'memoria_fotografica',
    specialRules: 'Revela detalhes adicionais de pistas descobertas na presença do personagem.',
  },
  {
    id: 'labia', number: 3, name: 'Lábia',
    description: '+5 em argumentação, persuasão e negociações informais.',
    activation: ['argumentacao', 'persuasao', 'negociacao'], positiveModifier: 5,
  },
  {
    id: 'presenca_marcante', number: 4, name: 'Presença Marcante',
    description: '+5 em situações de autoridade, atenção e impacto social.',
    activation: ['autoridade', 'impacto_social'], positiveModifier: 5,
    onus: {
      description: 'Quando precisa passar despercebido, utiliza atributo +8 em vez de +10 na especialidade aplicável, perdendo também o bônus +5.',
      whenAny: ['passar_despercebido'], requiresActivation: false,
    },
  },
  {
    id: 'camaleao_social', number: 5, name: 'Camaleão Social',
    description: '+5 para adaptar comportamento e comunicação a ambientes sociais.',
    activation: ['adaptacao_social'], positiveModifier: 5,
  },
  {
    id: 'sangue_frio', number: 6, name: 'Sangue Frio',
    description: '+5 para manter a compostura diante de intimidação, provocações e pressão psicológica.',
    activation: ['intimidacao', 'provocacao', 'pressao_psicologica'], positiveModifier: 5,
    onus: {
      description: 'Quando precisa demonstrar empatia, consolar, ajudar ou agir em benefício de outra pessoa, utiliza atributo +8 em vez de +10 na especialidade aplicável.',
      whenAny: ['empatia', 'consolar', 'ajudar_outro'], requiresActivation: false,
    },
  },
  {
    id: 'mira_perfeita', number: 7, name: 'Mira Perfeita',
    description: '+5 para precisão em ações com armas de longo alcance.',
    activation: ['arma_longo_alcance'], positiveModifier: 5,
  },
  {
    id: 'agil', number: 8, name: 'Ágil',
    description: '+5 em equilíbrio, coordenação e movimentação.',
    activation: ['equilibrio', 'coordenacao', 'movimentacao'], positiveModifier: 5,
  },
  {
    id: 'resistente', number: 9, name: 'Resistente',
    description: '+5 em esforço físico, fadiga e resistência a adversidades.',
    activation: ['esforco_fisico', 'fadiga', 'adversidade_fisica'], positiveModifier: 5,
  },
  {
    id: 'reflexos_instintivos', number: 10, name: 'Reflexos Instintivos',
    description: '+5 para reagir a acontecimentos inesperados.',
    activation: ['reacao_inesperada'], positiveModifier: 5,
  },
  {
    id: 'improvisador', number: 11, name: 'Improvisador',
    description: '+5 para desenvolver soluções criativas com recursos disponíveis.',
    activation: ['solucao_criativa'], positiveModifier: 5,
  },
  {
    id: 'leitor_de_pessoas', number: 12, name: 'Leitor de Pessoas',
    description: '+5 para interpretar emoções, comportamentos e intenções.',
    activation: ['interpretar_pessoas'], positiveModifier: 5,
    onus: {
      description: 'Quando emocionalmente envolvido com a pessoa analisada, utiliza atributo +8 em vez de +10 na especialidade aplicável.',
      whenAny: ['envolvimento_emocional'], requiresActivation: true,
    },
  },
  {
    id: 'instinto_de_perigo', number: 13, name: 'Instinto de Perigo',
    description: '+5 para perceber ameaças e riscos. O narrador pode sinalizar uma sensação de perigo sem revelar sua origem.',
    activation: ['perceber_ameaca'], positiveModifier: 5, special: 'sinal_de_perigo',
    onus: {
      description: 'Em ambientes com pessoas além do próprio grupo, apresenta dificuldade de concentração e socialização, utilizando atributo +8 na especialidade aplicável. Não se aplica ao combate.',
      whenAny: ['ambiente_com_estranhos'], exceptWhen: ['combate'], requiresActivation: false,
    },
  },
  {
    id: 'mente_estrategica', number: 14, name: 'Mente Estratégica',
    description: '+5 para planejamento, avaliação de riscos e antecipação de consequências.',
    activation: ['planejamento', 'avaliacao_risco', 'antecipacao'], positiveModifier: 5,
    onus: {
      description: 'Sob pressão ou paranoia, utiliza atributo +8 na especialidade aplicável.',
      whenAny: ['sob_pressao', 'paranoia'], requiresActivation: true,
    },
  },
  {
    id: 'foco_absoluto', number: 15, name: 'Foco Absoluto',
    description: '+5 para concentração e execução cuidadosa de atividades.',
    activation: ['concentracao', 'execucao_cuidadosa'], positiveModifier: 5,
  },
  {
    id: 'sobrevivente', number: 16, name: 'Sobrevivente',
    description: '+5 para superar adversidades e permanecer funcional em situações de perigo.',
    activation: ['superar_adversidade'], positiveModifier: 5,
    onus: {
      description: 'Fora de situações de perigo real, utiliza atributo +8 na especialidade aplicável.',
      whenMissing: ['perigo_real'], requiresActivation: true,
    },
  },
  {
    id: 'teimosia_inabalavel', number: 17, name: 'Teimosia Inabalável',
    description: 'Permite repetir uma rolagem de D20 uma vez por teste. O segundo resultado é obrigatório, mesmo quando pior.',
    activation: [], positiveModifier: 0, special: 'repetir_d20',
    onus: {
      description: 'Quando contradito, utiliza atributo +8 na especialidade aplicável.',
      whenAny: ['contradito'], requiresActivation: false,
    },
  },
  {
    id: 'lutador_marcial', number: 18, name: 'Lutador Marcial',
    description: '+5 para combate desarmado e técnicas marciais.',
    activation: ['combate_desarmado', 'tecnica_marcial'], positiveModifier: 5,
  },
  {
    id: 'maos_habilidosas', number: 19, name: 'Mãos Habilidosas',
    description: '+5 para precisão manual, reparos e manipulação de mecanismos.',
    activation: ['precisao_manual', 'reparo', 'mecanismo'], positiveModifier: 5,
    onus: {
      description: 'Quando as mãos estão feridas ou sob pressão, utiliza atributo +8 na especialidade aplicável.',
      whenAny: ['maos_feridas', 'sob_pressao'], requiresActivation: true,
    },
  },
  {
    id: 'ambidestro', number: 20, name: 'Ambidestro',
    description: 'Permite utilizar qualquer mão com a mesma capacidade, sem penalidade por mão secundária.',
    activation: [], positiveModifier: 0, special: 'ambidestro',
    specialRules: 'O protótipo não aplica penalidade por mão secundária; o bônus fica registrado para uso futuro.',
  },
];

export const BONUS_BY_ID: Record<string, BonusDef> = Object.fromEntries(BONUSES.map((b) => [b.id, b]));
