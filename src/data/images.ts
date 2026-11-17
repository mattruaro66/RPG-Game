/**
 * Catálogo de imagens do jogo.
 *
 * Cada "vaga" (slot) representa algo que a tela pode mostrar: um local, um
 * NPC, um protagonista ou um objeto. Uma vaga pode ter:
 *  - uma foto de acervo embutida no jogo (`bundled`, com crédito e licença);
 *  - uma imagem enviada pelo mestre/dono pela própria página (sobrepõe a foto);
 *  - nada: a tela mostra uma moldura noir com a legenda.
 *
 * `prompt` é o texto pronto para geradores de imagem (Midjourney, DALL·E,
 * Firefly…), em inglês, que é a língua em que eles respondem melhor.
 */

export type ImageKind = 'local' | 'npc' | 'protagonista' | 'objeto';

export interface BundledImage {
  file: string;
  credit: string;
  license: string;
  source: string;
}

export interface ImageSlot {
  id: string;
  kind: ImageKind;
  title: string;
  caption: string;
  prompt: string;
  /** Mantém a cor (ex.: o vermelho de Victoria); as demais viram preto e branco. */
  keepColor?: boolean;
  bundled?: BundledImage;
}

export const NOIR_STYLE =
  'black and white 35mm film photograph, New York City, December 1992, film noir lighting, deep shadows, high contrast, visible film grain, Kodak Tri-X 400 pushed, documentary realism, no text, no watermark, no logos';

const slot = (id: string, kind: ImageKind, title: string, caption: string, subject: string, extra: Partial<ImageSlot> = {}): ImageSlot => ({
  id,
  kind,
  title,
  caption,
  prompt: `${subject}, ${extra.keepColor ? NOIR_STYLE.replace('black and white', 'black and white with selective red color only') : NOIR_STYLE}`,
  ...extra,
});

export const IMAGE_SLOTS: ImageSlot[] = [
  // Locais
  slot('cena_prologo', 'local', 'Manhattan, inverno de 1992', 'A cidade que nunca dorme.', 'wide view of the Manhattan skyline at dusk in winter 1992 with the Twin Towers, lit office windows, cold haze over the river'),
  slot('cena_escritorio', 'local', 'Escritório de Jack Sullivan', 'Rua 46 Oeste, quarto andar.', 'small run-down private investigator office on the 4th floor of an old Midtown building, wooden desk covered with unpaid bills and envelopes, cast-iron radiator, venetian blinds casting striped shadows, neon from the street outside, rotary phone, overflowing ashtray, dusk'),
  slot('cena_portaria', 'local', 'Portaria, Rua 78 Leste', 'Mármore gasto e um espelho dourado.', 'lobby of a prewar Upper East Side apartment building at night, worn marble floor, gilded mirror, brass elevator doors, a doorman desk with a tiny television glowing, green awning visible through glass doors'),
  slot('cena_apartamento', 'local', 'Apartamento 5C', 'Alguém já esteve aqui.', 'ransacked upscale Manhattan apartment living room at night, drawers pulled out on the floor, slashed sofa cushions, books torn from shelves, a gold wristwatch untouched on the coffee table, cold streetlight through tall windows, mahogany desk'),
  slot('cena_invasao', 'local', 'Corredor do quinto andar', 'Passos pesados param diante do 5C.', 'dim apartment building hallway, two young men in leather jackets silhouetted at an apartment door, one holding a ring of keys, single bare bulb, long shadows, tension'),
  slot('cena_rua', 'local', 'Rua 78 Leste, noite', 'Vapor sobe dos bueiros.', 'Upper East Side street at night in winter, steam rising from manholes, wet asphalt reflecting streetlights, a dark sedan with its engine running, yellow cab passing'),
  slot('cena_fim', 'local', 'Midtown, madrugada', 'Café requentado e pistas sobre a mesa.', 'detective office at 3am, single desk lamp, evidence spread on the desk: a leather datebook, a matchbox, a microcassette, photocopies, a cold cup of coffee, tired figures in silhouette'),
  slot('loc_ludlow', 'local', 'Ludlow Street', 'Lower East Side.', 'Lower East Side street with tenements and fire escapes at night, an unmarked black door with a small silver sign, 1990s club scene, punks and goths smoking outside'),
  slot('loc_bellevue', 'local', 'Bellevue Hospital', 'Pronto-socorro, Manhattan.', 'exterior of Bellevue Hospital in Manhattan at night, ambulance bay lights, wet pavement, 1990s'),

  // NPCs
  slot('npc_victoria', 'npc', 'Victoria Whitmore', 'A cliente.', 'portrait of an elegant woman in her thirties wearing an extravagant red dress, a long red overcoat to the ankles, dark sunglasses at night and leather gloves, standing in a dark office doorway, unreadable expression', { keepColor: true }),
  slot('npc_sal', 'npc', 'Sal Benedetto', 'O porteiro.', 'portrait of a 60-year-old doorman in a uniform with brass buttons and a cap, sitting behind a lobby desk, tired kind eyes, small TV glow on his face'),
  slot('npc_thomas', 'npc', 'Thomas Reed', 'Retrato de estúdio, outubro de 1991.', 'studio portrait of a 38-year-old financial consultant in a grey suit and wine-colored tie, practiced confident smile, 1991 corporate headshot'),
  slot('npc_invasores', 'npc', 'Os invasores', 'Dois homens de jaqueta de couro.', 'two young street criminals in leather jackets in a stairwell, one with a knife on his belt, the other with a hand hidden inside his jacket, nervous eyes'),

  // Protagonistas
  slot('retrato_jack', 'protagonista', 'Jack Sullivan', 'Investigador particular, 42 anos.', 'portrait of a 42-year-old cynical private investigator and former NYPD cop, rumpled trench coat, loosened tie, five o\'clock shadow, observant tired eyes'),
  slot('retrato_daniel', 'protagonista', 'Daniel Mercer', 'Médico do Bellevue, 36 anos.', 'portrait of a 36-year-old emergency room doctor, reserved and methodical, scrubs under a winter coat, stethoscope, exhausted after a 30-hour shift'),
  slot('retrato_mick', 'protagonista', 'Mick Donovan', 'Operativo, 38 anos.', 'portrait of a 38-year-old former soldier working private security, short haircut, disciplined posture, bomber jacket, protective watchful stare'),
  slot('retrato_liz', 'protagonista', 'Liz Morgan', 'Jornalista do Village Voice, 31 anos.', 'portrait of a 31-year-old investigative journalist from a downtown alternative weekly, determined curious expression, notebook and pen, wool coat, newsroom background'),
  slot('retrato_maggie', 'protagonista', 'Maggie Holloway', 'Pesquisadora ocultista, 32 anos.', 'portrait of a 32-year-old independent researcher of occult history among stacks of old books in a rare bookshop, introspective intellectual gaze, reading glasses'),
  slot('retrato_ray', 'protagonista', 'Ray Vega', 'Especialista em fechaduras, 34 anos.', 'portrait of a 34-year-old locksmith and security technician, discreet and resourceful, work jacket, lockpick set in hand, kneeling by a door'),

  // Objetos e pistas
  slot('obj_jornal', 'objeto', 'Daily News, página doze', '“Corpo sem identificação encontrado no Pier 40.”', 'close-up of a folded 1992 tabloid newspaper page with a short article about an unidentified body found at a Hudson River pier, coffee ring stain'),
  slot('obj_promissoria', 'objeto', 'A nota promissória', 'Trezentos mil dólares.', 'close-up of a promissory note for three hundred thousand dollars on heavy paper among pawn tickets in a desk drawer'),
  slot('obj_cartao', 'objeto', 'Cartão cor de vinho', 'Apenas um nome e um telefone.', 'close-up of a thick wine-colored business card with only a name and phone number on a dark desk', { keepColor: true }),
  slot('obj_agenda', 'objeto', 'A agenda de Thomas', 'Páginas arrancadas depois de 19 de novembro.', 'close-up of a leather 1992 datebook lying open, several pages torn out neatly at the binding'),
  slot('obj_secretaria', 'objeto', 'A secretária eletrônica', 'A luz vermelha pisca. Três mensagens.', 'close-up of an early 1990s answering machine with a blinking light and a microcassette, in a dark apartment'),
  slot('obj_banheiro', 'objeto', 'O banheiro', 'Limpo demais.', 'spotless bathroom with a clawfoot tub, faint dark stains in the grout around the drain, bleach bottle on the floor, harsh light'),
  slot('obj_fosforos', 'objeto', 'Caixa de fósforos do Nocturne', 'Um símbolo desenhado por dentro da tampa.', 'close-up of a black matchbox with silver letters reading NOCTURNE, open, a hand-drawn ink symbol inside the lid: a circle cut by a vertical line surrounded by small marks like teeth'),
  slot('obj_halcyon', 'objeto', 'Transferências da Halcyon', 'Assinatura autorizada: R. Whitmore.', 'photocopies of bank wire transfer orders in a manila envelope hidden in a desk compartment, handwritten note in the margin'),
  slot('obj_seda', 'objeto', 'O sedã escuro', 'O motor ligado. Ninguém desce.', 'dark sedan parked across the street at night with engine running, fogged windows, seen from a fifth-floor window'),
];

export const IMAGE_BY_ID: Record<string, ImageSlot> = Object.fromEntries(IMAGE_SLOTS.map((s) => [s.id, s]));

export const KIND_LABELS: Record<ImageKind, string> = {
  local: 'Locais',
  npc: 'Personagens não jogáveis',
  protagonista: 'Protagonistas',
  objeto: 'Objetos e pistas',
};
