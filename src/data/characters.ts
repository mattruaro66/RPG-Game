import type { Attributes, CharacterId, ProfessionId } from '../engine/types';

/** Perfil de personalidade usado pela IA para controlar companheiros. */
export interface PersonalityProfile {
  /** 0–1: tendência a atacar. */
  aggression: number;
  /** 0–1: tendência a se proteger (cobertura / defesa / fuga). */
  caution: number;
  /** 0–1: tendência a ajudar aliados feridos. */
  care: number;
  /** Falas curtas por situação. Usadas pelo narrador local. */
  lines: Partial<Record<CompanionTrigger, string[]>>;
}

export type CompanionTrigger =
  | 'entrar_cena'
  | 'pista'
  | 'falha'
  | 'sucesso'
  | 'perigo'
  | 'combate'
  | 'ferido'
  | 'sanidade';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  nickname?: string;
  profession: ProfessionId;
  age: number;
  occupation: string;
  personality: string;
  background: string;
  /** CANÔNICO = estabelecido; PROPOSTO = biografia/relação ainda refinável. */
  backgroundStatus: 'CANÔNICO' | 'PROPOSTO';
  attributes: Attributes;
  /** Relações propostas (seção 21). */
  knows: CharacterId[];
  ai: PersonalityProfile;
  /** Iniciais para o retrato tipográfico. */
  initials: string;
}

// CANÔNICO: nomes, profissões e atributos (13 pontos cada).
export const CHARACTERS: CharacterDef[] = [
  {
    id: 'jack', name: 'Jack Sullivan', profession: 'investigador', age: 42,
    occupation: 'Investigador particular, ex-policial do NYPD',
    personality: 'Cínico, pragmático, observador.',
    background: 'Possui um pequeno escritório em Midtown e enfrenta dificuldades financeiras. Está envolvido em uma investigação particular sobre o desaparecimento de Thomas Reed.',
    backgroundStatus: 'CANÔNICO',
    attributes: { fisico: 2, reflexo: 2, raciocinio: 5, presenca: 2, espirito: 2 },
    knows: ['liz', 'ray'],
    initials: 'JS',
    ai: {
      aggression: 0.5, caution: 0.4, care: 0.3,
      lines: {
        entrar_cena: ['Ninguém limpa um lugar assim por acaso.', 'Olhos abertos. Lugar quieto demais é lugar que já foi visitado.'],
        pista: ['Anota isso. Daqui a dois dias vai fazer sentido.', 'Aí está. Sempre sobra alguma coisa.'],
        falha: ['Deixa. A gente acha por outro caminho.', 'Vinte anos nisso e ainda erro o óbvio.'],
        sucesso: ['Nada mal.', 'Viu? Paciência paga as contas. Quase todas.'],
        perigo: ['Não gosto disso. Fiquem atrás de mim.'],
        combate: ['Calma. Ninguém precisa sair daqui num saco.'],
        ferido: ['Já levei pior... acho.'],
        sanidade: ['Isso não é normal. Nada disso é normal.'],
      },
    },
  },
  {
    id: 'daniel', name: 'Daniel Mercer', profession: 'medico', age: 36,
    occupation: 'Médico de emergência no Bellevue Hospital, Manhattan',
    personality: 'Reservado, metódico, racional e persistente.',
    background: 'Presencia a morte de um paciente com perda sanguínea incompatível com os ferimentos encontrados. A documentação médica do paciente desaparece.',
    backgroundStatus: 'CANÔNICO',
    attributes: { fisico: 2, reflexo: 2, raciocinio: 4, presenca: 2, espirito: 3 },
    knows: ['mick'],
    initials: 'DM',
    ai: {
      aggression: 0.15, caution: 0.6, care: 0.95,
      lines: {
        entrar_cena: ['Vou olhar com calma. Pressa mata mais que bala.'],
        pista: ['Isso é consistente com o que vi no Bellevue.', 'Precisamos registrar isso direito.'],
        falha: ['Não tenho dados suficientes. Ainda.'],
        sucesso: ['É um começo.'],
        perigo: ['Se alguém se ferir, me chamem antes de tentar qualquer coisa.'],
        combate: ['Fiquem conscientes. Eu cuido do resto.'],
        ferido: ['Pressão no ferimento. Agora.'],
        sanidade: ['Respira. Conta até dez. Funciona mais do que parece.'],
      },
    },
  },
  {
    id: 'mick', name: 'Michael Donovan', nickname: 'Mick', profession: 'operativo', age: 38,
    occupation: 'Ex-militar, segurança privada',
    personality: 'Disciplinado, prático, protetor e experiente em situações de risco.',
    background: 'Conhece Daniel Mercer e Raymond Vega por experiências profissionais anteriores.',
    backgroundStatus: 'PROPOSTO',
    attributes: { fisico: 4, reflexo: 4, raciocinio: 2, presenca: 1, espirito: 2 },
    knows: ['daniel', 'ray'],
    initials: 'MD',
    ai: {
      aggression: 0.8, caution: 0.3, care: 0.5,
      lines: {
        entrar_cena: ['Duas saídas. Uma janela. Guardem isso.', 'Eu vou na frente.'],
        pista: ['Bom. Agora vamos sair daqui antes que alguém volte.'],
        falha: ['Acontece. Reagrupa e tenta de novo.'],
        sucesso: ['Limpo.'],
        perigo: ['Contato. Todo mundo abaixado.'],
        combate: ['Cobertura! Agora!', 'Fiquem atrás de mim.'],
        ferido: ['Tô bem. Continua.'],
        sanidade: ['Já vi gente travar assim no campo. Fica comigo.'],
      },
    },
  },
  {
    id: 'liz', name: 'Elizabeth Morgan', nickname: 'Liz', profession: 'jornalista', age: 31,
    occupation: 'Jornalista investigativa do The Village Voice',
    personality: 'Determinada, curiosa, persuasiva e questionadora.',
    background: 'Recebe informações sobre cadáveres não identificados, registros incompletos e desaparecimentos.',
    backgroundStatus: 'CANÔNICO',
    attributes: { fisico: 1, reflexo: 2, raciocinio: 3, presenca: 5, espirito: 2 },
    knows: ['jack', 'maggie'],
    initials: 'LM',
    ai: {
      aggression: 0.2, caution: 0.65, care: 0.5,
      lines: {
        entrar_cena: ['Alguém sabe alguma coisa. Sempre tem alguém.'],
        pista: ['Isso conversa com aquela história dos corpos sem nome.', 'Isso daria uma primeira página. Se alguém deixasse publicar.'],
        falha: ['Ok. Pergunta errada. Vou achar a certa.'],
        sucesso: ['Agora sim temos uma história.'],
        perigo: ['Tem alguém observando a gente. Eu sinto.'],
        combate: ['Isso não estava na pauta!'],
        ferido: ['Droga... continua, continua.'],
        sanidade: ['Eu preciso escrever isso antes que pareça um sonho.'],
      },
    },
  },
  {
    id: 'maggie', name: 'Margaret Holloway', nickname: 'Maggie', profession: 'ocultista', age: 32,
    occupation: 'Pesquisadora independente, ligada ao mercado de livros',
    personality: 'Intelectual, introspectiva, interessada em fenômenos históricos e religiosos.',
    background: 'Possui conhecimentos que ajudam Liz a investigar elementos simbólicos e ocultistas.',
    backgroundStatus: 'PROPOSTO',
    attributes: { fisico: 1, reflexo: 2, raciocinio: 4, presenca: 2, espirito: 4 },
    knows: ['liz', 'ray'],
    initials: 'MH',
    ai: {
      aggression: 0.1, caution: 0.7, care: 0.6,
      lines: {
        entrar_cena: ['Há uma ordem nisso. Só não sei ainda qual.'],
        pista: ['Já vi algo parecido. Num livro que ninguém deveria ter.', 'Os símbolos raramente mentem. As pessoas, sim.'],
        falha: ['Preciso das minhas referências.'],
        sucesso: ['Interessante... muito interessante.'],
        perigo: ['O ar mudou. Vocês sentiram?'],
        combate: ['Isso não se resolve com força, vocês sabem disso.'],
        ferido: ['Estou bem. Só... me deem um minuto.'],
        sanidade: ['Algumas coisas não deveriam ser lidas em voz alta.'],
      },
    },
  },
  {
    id: 'ray', name: 'Raymond Vega', nickname: 'Ray', profession: 'infiltrador', age: 34,
    occupation: 'Técnico especializado em segurança e fechaduras',
    personality: 'Discreto, engenhoso, observador e adaptável.',
    background: 'Realiza trabalhos para Jack Sullivan e possui conexões com Michael e Maggie.',
    backgroundStatus: 'PROPOSTO',
    attributes: { fisico: 2, reflexo: 4, raciocinio: 3, presenca: 3, espirito: 1 },
    knows: ['jack', 'mick', 'maggie'],
    initials: 'RV',
    ai: {
      aggression: 0.35, caution: 0.75, care: 0.3,
      lines: {
        entrar_cena: ['Fechadura de boa qualidade. Alguém se preocupava com visitas.'],
        pista: ['Ninguém olha onde eu olho. Por isso eu acho.'],
        falha: ['Hm. Não foi dessa vez.'],
        sucesso: ['Moleza.'],
        perigo: ['Passos no corredor. Silêncio.'],
        combate: ['Eu não fui pago pra isso.'],
        ferido: ['Ai. Ok. Ok.'],
        sanidade: ['Eu só abro portas. Ninguém falou o que tinha atrás delas.'],
      },
    },
  },
];

export const CHARACTER_BY_ID: Record<CharacterId, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
) as Record<CharacterId, CharacterDef>;

export function displayName(def: CharacterDef): string {
  return def.nickname ? `${def.name.split(' ')[0]} “${def.nickname}” ${def.name.split(' ').slice(1).join(' ')}` : def.name;
}

export function shortName(def: CharacterDef): string {
  return def.nickname ?? def.name.split(' ')[0];
}
