import type { AttributeId, CharacterId, ContextTag } from '../engine/types';

export type ItemCategory = 'arma' | 'ferramenta' | 'documento' | 'pessoal' | 'medico' | 'municao' | 'evidencia';
export type StorageLocation = 'hands' | 'bag' | 'pockets';

export type DamageTypeId =
  | 'desarmado'
  | 'improvisada'
  | 'impacto_corte'
  | 'arma_de_fogo'
  | 'vampirico_pesado'
  | 'vampirico_excepcional';

export interface WeaponProfile {
  damageType: DamageTypeId;
  attribute: AttributeId;
  specialty: string;
  tags: ContextTag[];
  firearm: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  slots: number;
  allowed: StorageLocation[];
  usable: boolean;
  effect?: string;
  weapon?: WeaponProfile;
  /** Documento legível vinculado (aparece no diário). */
  documentId?: string;
}

const POCKET_SMALL: StorageLocation[] = ['pockets', 'bag', 'hands'];
const NOT_POCKET: StorageLocation[] = ['bag', 'hands'];

export const UNARMED: WeaponProfile = {
  damageType: 'desarmado', attribute: 'fisico', specialty: 'combate_corpo_a_corpo',
  tags: ['combate_desarmado'], firearm: false,
};

export const ITEMS: ItemDef[] = [
  // Armas (PROVISÓRIO: catálogo para o protótipo; danos seguem a tabela canônica)
  { id: 'revolver_38', name: 'Revólver .38', description: 'Smith & Wesson de cano curto. Já viu dias melhores.', category: 'arma', slots: 1, allowed: NOT_POCKET, usable: true,
    weapon: { damageType: 'arma_de_fogo', attribute: 'reflexo', specialty: 'armas_curtas', tags: [], firearm: true } },
  { id: 'pistola_9mm', name: 'Pistola 9mm', description: 'Beretta 92 bem conservada.', category: 'arma', slots: 1, allowed: NOT_POCKET, usable: true,
    weapon: { damageType: 'arma_de_fogo', attribute: 'reflexo', specialty: 'armas_curtas', tags: [], firearm: true } },
  { id: 'espingarda', name: 'Espingarda calibre 12', description: 'Ocupa as duas mãos.', category: 'arma', slots: 2, allowed: NOT_POCKET, usable: true,
    weapon: { damageType: 'arma_de_fogo', attribute: 'reflexo', specialty: 'armas_longas', tags: ['arma_longo_alcance'], firearm: true } },
  { id: 'faca', name: 'Faca', description: 'Lâmina de cozinha ou de rua — corta do mesmo jeito.', category: 'arma', slots: 1, allowed: NOT_POCKET, usable: true,
    weapon: { damageType: 'impacto_corte', attribute: 'fisico', specialty: 'combate_corpo_a_corpo', tags: [], firearm: false } },
  { id: 'pe_de_cabra', name: 'Pé de cabra', description: 'Ferramenta de trabalho. Às vezes, de outro tipo de trabalho.', category: 'ferramenta', slots: 1, allowed: NOT_POCKET, usable: true,
    weapon: { damageType: 'impacto_corte', attribute: 'fisico', specialty: 'combate_corpo_a_corpo', tags: [], firearm: false } },
  { id: 'garrafa', name: 'Garrafa vazia', description: 'Arma improvisada.', category: 'arma', slots: 1, allowed: NOT_POCKET, usable: true,
    weapon: { damageType: 'improvisada', attribute: 'fisico', specialty: 'combate_corpo_a_corpo', tags: [], firearm: false } },
  // Munição — nunca nos bolsos
  { id: 'municao_38', name: 'Munição .38', description: 'Caixa de cartuchos. Contagem de munição: decisão pendente.', category: 'municao', slots: 1, allowed: NOT_POCKET, usable: false },
  { id: 'municao_9mm', name: 'Munição 9mm', description: 'Dois carregadores extras. Contagem de munição: decisão pendente.', category: 'municao', slots: 1, allowed: NOT_POCKET, usable: false },
  // Ferramentas
  { id: 'lanterna', name: 'Lanterna', description: 'Maglite de metal, pesada.', category: 'ferramenta', slots: 1, allowed: NOT_POCKET, usable: true },
  { id: 'camera', name: 'Câmera analógica', description: 'Nikon FM2 com filme de 36 poses.', category: 'ferramenta', slots: 1, allowed: NOT_POCKET, usable: true },
  { id: 'gravador', name: 'Gravador de fita', description: 'Microcassete. Pilhas pela metade.', category: 'ferramenta', slots: 1, allowed: NOT_POCKET, usable: true },
  { id: 'kit_medico', name: 'Kit médico', description: 'Gaze, sutura, antisséptico, seringas. Não cabe no bolso.', category: 'medico', slots: 1, allowed: NOT_POCKET, usable: true },
  { id: 'livro_simbolos', name: 'Caderno de referências', description: 'Anotações de Maggie sobre símbolos, selos e iconografia religiosa.', category: 'ferramenta', slots: 1, allowed: NOT_POCKET, usable: true },
  // Bolso
  { id: 'gazuas', name: 'Estojo de gazuas', description: 'Pequeno estojo de couro. Cabe no bolso interno.', category: 'ferramenta', slots: 1, allowed: POCKET_SMALL, usable: true },
  { id: 'carteira', name: 'Carteira', description: 'Documentos e alguns dólares.', category: 'pessoal', slots: 1, allowed: POCKET_SMALL, usable: false },
  { id: 'chaves', name: 'Chaves', description: 'Chaves de casa e do trabalho.', category: 'pessoal', slots: 1, allowed: POCKET_SMALL, usable: false },
  { id: 'isqueiro', name: 'Isqueiro', description: 'Zippo amassado.', category: 'pessoal', slots: 1, allowed: POCKET_SMALL, usable: true },
  { id: 'relogio', name: 'Relógio', description: 'Relógio de pulso.', category: 'pessoal', slots: 1, allowed: POCKET_SMALL, usable: false },
  { id: 'pager', name: 'Pager', description: 'Motorola. Toca nas piores horas.', category: 'pessoal', slots: 1, allowed: POCKET_SMALL, usable: false },
  { id: 'bloco_notas', name: 'Bloco de notas', description: 'Pequeno bloco espiral e uma caneta.', category: 'pessoal', slots: 1, allowed: POCKET_SMALL, usable: true },
  { id: 'analgesicos', name: 'Analgésicos', description: 'Frasco pequeno de comprimidos. Efeito em PV: não definido.', category: 'medico', slots: 1, allowed: POCKET_SMALL, usable: false },
  // Itens da campanha
  { id: 'foto_thomas', name: 'Fotografia de Thomas Reed', description: 'Homem de trinta e poucos anos, terno caro, sorriso ensaiado.', category: 'documento', slots: 1, allowed: POCKET_SMALL, usable: false, documentId: 'doc_foto_thomas' },
  { id: 'chave_apartamento', name: 'Chave do apartamento de Thomas', description: 'Chave Medeco com uma etiqueta: “5C”.', category: 'pessoal', slots: 1, allowed: POCKET_SMALL, usable: true },
  { id: 'cartao_victoria', name: 'Cartão de Victoria Whitmore', description: 'Papel grosso, cor de vinho. Apenas um nome e um número de telefone.', category: 'documento', slots: 1, allowed: POCKET_SMALL, usable: false },
  { id: 'agenda_thomas', name: 'Agenda de Thomas Reed', description: 'Agenda de couro de 1992. Várias páginas arrancadas.', category: 'evidencia', slots: 1, allowed: NOT_POCKET, usable: false, documentId: 'doc_agenda' },
  { id: 'fita_secretaria', name: 'Fita da secretária eletrônica', description: 'Microcassete retirado do aparelho de Thomas.', category: 'evidencia', slots: 1, allowed: POCKET_SMALL, usable: false, documentId: 'doc_fita' },
  { id: 'fosforos_nocturne', name: 'Caixa de fósforos', description: 'Preta, com letras prateadas: “NOCTURNE — Ludlow St.”', category: 'evidencia', slots: 1, allowed: POCKET_SMALL, usable: false },
  { id: 'bilhete_capanga', name: 'Bilhete amassado', description: 'Encontrado com um dos invasores.', category: 'evidencia', slots: 1, allowed: POCKET_SMALL, usable: false, documentId: 'doc_bilhete' },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/**
 * PENDENTE (P-24): equipamento inicial de cada profissão ainda não definido
 * pelo criador. Esta lista é PROVISÓRIA, apenas para permitir testes.
 */
export const STARTING_EQUIPMENT: Record<CharacterId, { itemId: string; location: StorageLocation }[]> = {
  jack: [
    { itemId: 'revolver_38', location: 'hands' },
    { itemId: 'municao_38', location: 'bag' },
    { itemId: 'carteira', location: 'pockets' },
    { itemId: 'chaves', location: 'pockets' },
    { itemId: 'isqueiro', location: 'pockets' },
    { itemId: 'bloco_notas', location: 'pockets' },
  ],
  daniel: [
    { itemId: 'kit_medico', location: 'bag' },
    { itemId: 'carteira', location: 'pockets' },
    { itemId: 'chaves', location: 'pockets' },
    { itemId: 'pager', location: 'pockets' },
    { itemId: 'relogio', location: 'pockets' },
  ],
  mick: [
    { itemId: 'pistola_9mm', location: 'hands' },
    { itemId: 'municao_9mm', location: 'bag' },
    { itemId: 'lanterna', location: 'bag' },
    { itemId: 'carteira', location: 'pockets' },
    { itemId: 'chaves', location: 'pockets' },
  ],
  liz: [
    { itemId: 'camera', location: 'bag' },
    { itemId: 'gravador', location: 'bag' },
    { itemId: 'bloco_notas', location: 'pockets' },
    { itemId: 'carteira', location: 'pockets' },
    { itemId: 'chaves', location: 'pockets' },
  ],
  maggie: [
    { itemId: 'livro_simbolos', location: 'bag' },
    { itemId: 'carteira', location: 'pockets' },
    { itemId: 'chaves', location: 'pockets' },
    { itemId: 'isqueiro', location: 'pockets' },
  ],
  ray: [
    { itemId: 'pe_de_cabra', location: 'bag' },
    { itemId: 'lanterna', location: 'bag' },
    { itemId: 'gazuas', location: 'pockets' },
    { itemId: 'carteira', location: 'pockets' },
    { itemId: 'chaves', location: 'pockets' },
  ],
};
