import { CAMPAIGN } from '../data/campaign';
import { ENEMY_TEMPLATES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { INTERNAL_NPCS, CONSPIRACY_OVERVIEW } from '../data/campaign/internal';
import { essentialCluesWithoutGuarantee, referenceErrors } from '../engine/narrative/validate';
import { visibleInteractions } from '../engine/narrative/scene';
import { deserialize, loadGame, saveGame, serialize, setStorage } from '../persistence/storage';
import { chooseOption, interact, newGame, resolveContact } from '../state/session';
import { partySelection } from './helpers';

describe('Conteúdo da campanha', () => {
  it('não há referências quebradas', () => {
    expect(referenceErrors(CAMPAIGN, new Set(ITEMS.map((i) => i.id)), new Set(ENEMY_TEMPLATES.map((e) => e.id)))).toEqual([]);
  });

  it('pistas essenciais permanecem acessíveis sem depender exclusivamente de rolagem', () => {
    expect(essentialCluesWithoutGuarantee(CAMPAIGN)).toEqual([]);
  });

  it('o diálogo canônico da polícia está preservado', () => {
    const texts = CAMPAIGN.dialogues.victoria.nodes.policia.text.map((t) => t.text).join('\n');
    expect(texts).toContain('— Você sabe que não posso.');
    expect(texts).toContain('Disse com um olhar quase acusatório e um semblante de ligeira vergonha. Uma expressão facial nada fácil de ler.');
    expect(texts).toContain('Jack ergueu as sobrancelhas, esperando uma confissão mais detalhada.');
    expect(texts).toContain('— Meu marido tem amigos na polícia. Amigos em lugares que você provavelmente nem imagina. Se ele descobrir sobre Thomas, não haverá investigação alguma. E, se descobrir que estou procurando por ele, terei problemas muito maiores.');
  });
});

describe('Composição do grupo', () => {
  it('o contato se adapta quando Jack não foi escolhido', () => {
    expect(resolveContact(['jack', 'liz', 'ray', 'mick'])).toBe('jack');
    expect(resolveContact(['daniel', 'liz', 'ray', 'mick'])).toBe('ray');
    expect(resolveContact(['daniel', 'liz', 'maggie', 'mick'])).toBe('liz');
    expect(resolveContact(['daniel', 'mick', 'maggie', 'ray'])).toBe('ray');
  });

  it('a campanha é jogável sem Jack nem Ray (pista essencial do endereço sem dados)', () => {
    let s = newGame(partySelection(['daniel', 'mick', 'liz', 'maggie']), 7);
    expect(s.contactId).toBe('liz');
    s = interact(s, 'esperar_cliente');
    expect(s.dialogue?.dialogueId).toBe('victoria');
    s = chooseOption(s, 'quem');
    s = chooseOption(s, 'voltar');
    s = chooseOption(s, 'recusar');
    expect(s.journal.clues.some((c) => c.id === 'endereco_thomas')).toBe(true);
    s = chooseOption(s, 'fim');
    s = interact(s, 'ir_apartamento');
    expect(s.sceneId).toBe('portaria');
    // Entrada sem teste de dados
    s = interact(s, 'escada_servico');
    expect(s.sceneId).toBe('apartamento');
    s = interact(s, 'sala');
    s = interact(s, 'escrivaninha');
    s = interact(s, 'casaco');
    for (const id of ['apartamento_revirado', 'agenda_thomas', 'fosforos_nocturne']) {
      expect(s.journal.clues.some((c) => c.id === id)).toBe(true);
    }
  });
});

describe('Decisões persistentes e salvamento', () => {
  it('aceitar o caso concede chave e objetivos; a escolha é registrada', () => {
    let s = newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), 11);
    s = interact(s, 'esperar_cliente');
    s = chooseOption(s, 'quem');
    s = chooseOption(s, 'voltar');
    s = chooseOption(s, 'aceitar');
    expect(s.flags.caso_aceito).toBe(true);
    expect(s.decisions.some((d) => d.id === 'aceitou_caso')).toBe(true);
    expect(s.party.some((c) => [...c.inventory.hands, ...c.inventory.bag, ...c.inventory.pockets].some((i) => i.itemId === 'chave_apartamento'))).toBe(true);
    expect(s.npcs.victoria.trust).toBe(1);
  });

  it('o tempo avança com as ações', () => {
    let s = newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), 12);
    const t0 = s.time;
    s = interact(s, 'jornal');
    expect(s.time).toBeGreaterThan(t0);
  });

  it('salvar e recarregar preserva o estado completo', () => {
    const mem = new Map<string, string>();
    setStorage({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) });
    let s = newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), 13);
    s = interact(s, 'jornal');
    s = interact(s, 'gaveta');
    saveGame('slot1', s);
    const loaded = loadGame('slot1');
    expect(loaded).toEqual(s);
    expect(deserialize(serialize(s)).state).toEqual(s);
    // Continuar após carregar mantém a determinação das rolagens
    expect(interact(loaded!, 'esperar_cliente')).toEqual(interact(s, 'esperar_cliente'));
  });

  it('interações únicas não reaparecem', () => {
    let s = newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), 14);
    s = interact(s, 'jornal');
    expect(visibleInteractions(s).some((i) => i.id === 'jornal')).toBe(false);
  });
});

describe('Separação entre camada do jogador e camada interna', () => {
  it('o estado visível ao jogador não contém segredos internos', () => {
    let s = newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), 15);
    s = interact(s, 'esperar_cliente');
    s = chooseOption(s, 'quem');
    const playerVisible = JSON.stringify({ narrative: s.narrative, journal: s.journal });
    for (const n of INTERNAL_NPCS) for (const secret of n.secrets) expect(playerVisible).not.toContain(secret);
    for (const line of CONSPIRACY_OVERVIEW) expect(playerVisible).not.toContain(line);
    expect(playerVisible.toLowerCase()).not.toContain('vampir');
  });
});
