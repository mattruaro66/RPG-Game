/**
 * Orquestrador da sessão: funções puras (estado → novo estado).
 * Sem React. Cada ação clona o estado, usa o RNG serializado no próprio
 * estado (rolagens reproduzíveis) e aplica as reações do narrador/IA.
 */
import '../data/campaign';
import { chooseCompanionAction, chooseEnemyAction } from '../ai/companion';
import { localNarrator, type NarratorProvider } from '../ai/narrator';
import { rules } from '../config/rules';
import { CHARACTER_BY_ID, shortName } from '../data/characters';
import { currentActorId, isEnemy, partyMember, performCombatAction, type CombatAction } from '../engine/combat/combat';
import { createRng, diceFromRng, newSeed } from '../engine/dice/dice';
import { addItem, autoPlace, findItem, moveItem as invMove, removeItem } from '../engine/inventory';
import { pushNarrative, pushTest, pushDiceLines, shortTestSummary } from '../engine/log';
import { treat as engineTreat, TREATMENTS } from '../engine/medical';
import { advanceTime, applyEffects, enterScene } from '../engine/narrative/effects';
import { INITIAL_TRACKS } from '../engine/narrative/factions';
import { content } from '../engine/narrative/registry';
import { ambientTags, chooseDialogueOption, finalizeTest, performInteraction } from '../engine/narrative/scene';
import { activeParty } from '../engine/narrative/conditions';
import { npcDisplayName } from '../engine/narrative/effects';
import { characterLimit } from '../engine/character';
import { actionTest } from '../engine/checks';
import { createParty, type CharacterSelection } from '../engine/party';
import { addXp } from '../engine/progression';
import { canAct, dailySanityRecovery, isPlayable, psychiatricHelp } from '../engine/sanity';
import { SAVE_VERSION, type GameState, type TrackId } from '../engine/state';
import { dayIndex } from '../engine/time';
import type { CharacterId, ControlMode, Dice } from '../engine/types';
import type { StorageLocation } from '../data/items';
import type { Interpretation } from '../ai/interpreter';

export let narrator: NarratorProvider = localNarrator;

export function setNarrator(n: NarratorProvider): void {
  narrator = n;
}

/** O contato que recebe Victoria: Jack; senão quem tem relação com ele. */
export function resolveContact(ids: CharacterId[]): CharacterId {
  for (const pref of ['jack', 'ray', 'liz'] as CharacterId[]) if (ids.includes(pref)) return pref;
  return ids[0];
}

export function newGame(selections: CharacterSelection[], seed: number = newSeed()): GameState {
  const party = createParty(selections);
  const c = content();
  const s: GameState = {
    version: SAVE_VERSION,
    seed,
    rngState: seed,
    createdAt: new Date().toISOString(),
    party,
    contactId: resolveContact(party.map((p) => p.id)),
    present: [resolveContact(party.map((p) => p.id))],
    time: rules.startMinute,
    sceneId: c.startScene,
    visitedScenes: [],
    usedInteractions: [],
    flags: {},
    journal: { clues: [], people: [], locations: [], documents: [], hypotheses: [], events: [], objectives: [], cases: [] },
    npcs: Object.fromEntries(Object.values(c.npcs).map((n) => [n.id, { trust: n.initialTrust, met: false, state: 'normal' }])),
    internal: { tracks: { ...INITIAL_TRACKS }, factionAttention: {}, vampireKnowledge: 0, lastTickDay: 0 },
    decisions: [],
    groundItems: {},
    combat: null,
    dialogue: null,
    pendingTest: null,
    narrative: [],
    diceLog: [],
    seq: 0,
    gameOver: null,
  };
  return run(s, (d, dice) => {
    d.journal.events.push({ time: d.time, text: `${shortName(CHARACTER_BY_ID[d.contactId])} espera a cliente sozinho no escritório. O resto do grupo está em outros cantos da cidade.` });
    enterScene(d, dice, c.startScene);
  });
}

function reactions(prev: GameState, s: GameState, dice: Dice): void {
  if (s.sceneId !== prev.sceneId) {
    const amb = narrator.ambient(s, dice);
    if (amb) pushNarrative(s, 'ia', amb, 'Narrador');
    const l = narrator.companion(s, 'entrar_cena', dice);
    if (l) pushNarrative(s, 'ia', l.text, l.speaker);
  }
  if (!prev.combat && s.combat) {
    const l = narrator.companion(s, 'combate', dice);
    if (l) pushNarrative(s, 'ia', l.text, l.speaker);
  }
  if (s.journal.clues.length > prev.journal.clues.length) {
    const l = narrator.companion(s, 'pista', dice);
    if (l) pushNarrative(s, 'ia', l.text, l.speaker);
  } else if (s.lastTier) {
    const l = narrator.companion(s, s.lastTier === 'falha' ? 'falha' : 'sucesso', dice);
    if (l) pushNarrative(s, 'ia', l.text, l.speaker);
  }
  s.lastTier = undefined;
  const sanityDropped = s.party.some((c) => (prev.party.find((p) => p.id === c.id)?.sanity ?? 10) > c.sanity);
  if (sanityDropped) {
    const l = narrator.companion(s, 'sanidade', dice);
    if (l) pushNarrative(s, 'ia', l.text, l.speaker);
  }
}

function checkGameOver(s: GameState): void {
  if (s.gameOver) return;
  if (!s.party.some(isPlayable)) {
    s.gameOver = { reason: 'Nenhum protagonista continua em condições de seguir com a investigação.' };
  } else if (!s.combat && !s.party.some(canAct)) {
    s.gameOver = { reason: 'Ninguém do grupo está em condições de agir. A noite engole o que restou deles.' };
  }
  if (s.gameOver) pushNarrative(s, 'sistema', s.gameOver.reason);
}

/** Executa uma alteração com dados reproduzíveis e reações do narrador. */
export function run(state: GameState, fn: (draft: GameState, dice: Dice) => void, opts: { react?: boolean } = {}): GameState {
  const draft: GameState = structuredClone(state);
  const rng = createRng(draft.rngState);
  const dice = diceFromRng(rng);
  fn(draft, dice);
  if (opts.react !== false) reactions(state, draft, dice);
  checkGameOver(draft);
  draft.rngState = rng.state;
  return draft;
}

// ---------------------------------------------------------------------------
// Exploração e diálogo
// ---------------------------------------------------------------------------

export function interact(s: GameState, interactionId: string, actorId?: CharacterId, helperIds: CharacterId[] = []): GameState {
  return run(s, (d, dice) => performInteraction(d, dice, interactionId, actorId, helperIds));
}

export function chooseOption(s: GameState, optionId: string, actorId?: CharacterId, helperIds: CharacterId[] = []): GameState {
  return run(s, (d, dice) => chooseDialogueOption(d, dice, optionId, actorId, helperIds));
}

export function resolvePending(s: GameState, reroll: boolean): GameState {
  if (!s.pendingTest) return s;
  return run(s, (d, dice) => finalizeTest(d, dice, d.pendingTest!, reroll));
}

/**
 * Resposta livre do jogador, já interpretada. Se corresponder a uma ação
 * disponível, o motor a executa com as regras normais. Senão, aplica o
 * improviso validado: falas, narração, um teste de dados opcional (rolado
 * pelo motor) e ±1 de confiança de um NPC presente. Improviso nunca cria
 * pistas, itens ou fatos.
 */
export function freeText(s: GameState, playerText: string, interp: Interpretation, speakerId?: CharacterId): GameState {
  const text = playerText.trim();
  if (!text) return s;
  return run(s, (d, dice) => {
    const actor = interp.actorId ?? speakerId;
    const speaker = shortName(CHARACTER_BY_ID[actor ?? d.contactId]);
    if (interp.actionId && d.dialogue) {
      chooseDialogueOption(d, dice, interp.actionId, actor ?? undefined, [], text);
      return;
    }
    pushNarrative(d, 'fala', text, speaker);
    if (interp.actionId) {
      performInteraction(d, dice, interp.actionId, actor ?? undefined);
      return;
    }
    advanceTime(d, interp.minutes);
    for (const l of interp.lines) {
      if (l.who === 'narrador') pushNarrative(d, 'texto', l.text);
      else pushNarrative(d, 'fala', l.text, npcDisplayName(d, l.who));
    }
    if (interp.test) {
      const who = d.party.find((c) => c.id === (actor ?? d.contactId) && canAct(c)) ?? activeParty(d).find(canAct);
      if (who) {
        const b = characterLimit(who, { attribute: interp.test.attribute, specialty: interp.test.specialty ?? undefined }, ambientTags(d));
        const r = actionTest(dice, interp.test.reason, b);
        pushTest(d, r, shortName(CHARACTER_BY_ID[who.id]));
        pushNarrative(d, 'teste', `${shortName(CHARACTER_BY_ID[who.id])}: ${shortTestSummary(r)}`);
        d.lastTier = r.success ? 'sucesso' : 'falha';
        pushNarrative(d, 'texto', r.success ? interp.test.success : interp.test.failure);
      }
    }
    if (interp.trust) {
      const n = d.npcs[interp.trust.npc];
      if (n) d.npcs[interp.trust.npc] = { ...n, trust: n.trust + interp.trust.delta };
    }
    if (interp.notice) pushNarrative(d, 'sistema', interp.notice);
  });
}

// ---------------------------------------------------------------------------
// Combate
// ---------------------------------------------------------------------------

export function isAiTurn(s: GameState): boolean {
  const id = currentActorId(s);
  if (!id) return false;
  if (isEnemy(s, id)) return true;
  return partyMember(s, id)?.control === 'ia';
}

export function combatAction(s: GameState, action: CombatAction): GameState {
  if (!s.combat) return s;
  const enc = content().encounters[s.combat.encounterId];
  return run(s, (d, dice) => performCombatAction(d, dice, action, enc), { react: false });
}

export function combatAiStep(s: GameState): GameState {
  if (!s.combat || s.combat.result || !isAiTurn(s)) return s;
  const enc = content().encounters[s.combat.encounterId];
  return run(s, (d, dice) => {
    const id = currentActorId(d)!;
    const action = isEnemy(d, id) ? chooseEnemyAction(d, id, dice) : chooseCompanionAction(d, id as CharacterId, dice);
    performCombatAction(d, dice, action, enc);
  }, { react: false });
}

export function finishCombat(s: GameState): GameState {
  if (!s.combat?.result) return s;
  return run(s, (d, dice) => {
    const cb = d.combat!;
    const enc = content().encounters[cb.encounterId];
    const deaths = Object.values(cb.enemies).filter((e) => e.status === 'morto').length;
    if (deaths) {
      d.flags.mortes_em_combate = (Number(d.flags.mortes_em_combate) || 0) + deaths;
      d.internal.tracks.risco_protagonistas += 2;
      d.internal.factionAttention.policia = (d.internal.factionAttention.policia ?? 0) + 2;
      d.journal.events.push({ time: d.time, text: `${deaths === 1 ? 'Um homem morreu' : `${deaths} homens morreram`} no confronto: ${enc.title}.` });
      d.decisions.push({ id: `mortes_${cb.encounterId}`, label: `Houve mortes em: ${enc.title}.`, time: d.time });
    }
    const result = cb.result!;
    d.combat = null;
    advanceTime(d, 5);
    const effects = result === 'vitoria' ? enc.onVictory : result === 'fuga' ? enc.onFlee : result === 'inimigos_fugiram' ? enc.onEnemiesFled : enc.onDefeat;
    applyEffects(d, dice, effects, {});
    const wounded = d.party.find((c) => c.hp < c.maxHp && isPlayable(c));
    if (wounded) {
      const l = narrator.companion(d, 'ferido', dice);
      if (l) pushNarrative(d, 'ia', l.text, l.speaker);
    }
  });
}

// ---------------------------------------------------------------------------
// Cuidados: tratamento médico, Sanidade, Psiquiatria
// ---------------------------------------------------------------------------

export function treatOutOfCombat(s: GameState, healerId: CharacterId, targetId: CharacterId, specialty: string): GameState {
  if (s.combat) return s;
  return run(s, (d, dice) => {
    const healer = d.party.find((c) => c.id === healerId)!;
    const target = d.party.find((c) => c.id === targetId)!;
    const r = engineTreat(dice, healer, target, specialty);
    const hn = shortName(CHARACTER_BY_ID[healerId]);
    const tn = shortName(CHARACTER_BY_ID[targetId]);
    if (!r.ok) {
      pushNarrative(d, 'sistema', `${hn} não pode tratar ${tn}: ${r.reason}`);
      return;
    }
    advanceTime(d, rules.durations.tratamento);
    if (r.test) pushTest(d, r.test, hn);
    d.party = d.party.map((c) => (c.id === r.target.id ? r.target : c.id === r.healer.id ? r.healer : c));
    if (r.healed > 0) {
      pushDiceLines(d, [`Recuperação: ${TREATMENTS[specialty].label}`, `D6: ${r.healRoll}`, `PV recuperados: ${r.healed}`], `+${r.healed} PV`, hn);
      pushNarrative(d, 'sistema', `${hn} trata ${tn}: +${r.healed} PV.`);
    } else pushNarrative(d, 'sistema', `${hn} tenta tratar ${tn}, sem resultado.`);
  });
}

export function dailySanity(s: GameState, charId: CharacterId): GameState {
  return run(s, (d, dice) => {
    const idx = d.party.findIndex((c) => c.id === charId);
    const r = dailySanityRecovery(dice, d.party[idx], dayIndex(d.time));
    const n = shortName(CHARACTER_BY_ID[charId]);
    if (!r.test) {
      pushNarrative(d, 'sistema', `${n}: ${r.reason}`);
      return;
    }
    pushTest(d, r.test, n);
    d.party[idx] = r.character;
    pushNarrative(d, 'sistema', r.test.success ? `${n} recupera 1 ponto de Sanidade.` : `${n} não consegue se recompor hoje.`);
  }, { react: false });
}

export function psychiatry(s: GameState, doctorId: CharacterId, targetId: CharacterId): GameState {
  return run(s, (d) => {
    const di = d.party.findIndex((c) => c.id === doctorId);
    const ti = d.party.findIndex((c) => c.id === targetId);
    const r = psychiatricHelp(d.party[di], d.party[ti], dayIndex(d.time));
    const dn = shortName(CHARACTER_BY_ID[doctorId]);
    const tn = shortName(CHARACTER_BY_ID[targetId]);
    if (!r.ok) {
      pushNarrative(d, 'sistema', `${dn}: ${r.reason}`);
      return;
    }
    d.party[di] = r.doctor;
    d.party[ti] = r.target;
    advanceTime(d, 30);
    pushNarrative(d, 'sistema', `${dn} conversa longamente com ${tn}. ${tn} recupera 1 ponto de Sanidade.`);
  }, { react: false });
}

// ---------------------------------------------------------------------------
// Inventário
// ---------------------------------------------------------------------------

export function moveItem(s: GameState, charId: CharacterId, uid: string, to: StorageLocation): GameState {
  return run(s, (d) => {
    const c = d.party.find((p) => p.id === charId)!;
    const r = invMove(c.inventory, uid, to);
    if (!r.ok) pushNarrative(d, 'sistema', r.reason ?? 'Não foi possível mover o item.');
    else c.inventory = r.inventory;
  }, { react: false });
}

export function transferItem(s: GameState, fromId: CharacterId, uid: string, toId: CharacterId): GameState {
  return run(s, (d) => {
    const from = d.party.find((p) => p.id === fromId)!;
    const to = d.party.find((p) => p.id === toId)!;
    const f = findItem(from.inventory, uid);
    if (!f) return;
    const placed = autoPlace(to.inventory, f.inst);
    if (!placed.ok) {
      pushNarrative(d, 'sistema', `${shortName(CHARACTER_BY_ID[toId])} não tem espaço livre.`);
      return;
    }
    from.inventory = removeItem(from.inventory, uid).inventory;
    to.inventory = placed.inventory;
  }, { react: false });
}

export function dropItem(s: GameState, charId: CharacterId, uid: string): GameState {
  return run(s, (d) => {
    const c = d.party.find((p) => p.id === charId)!;
    const r = removeItem(c.inventory, uid);
    if (!r.removed) return;
    c.inventory = r.inventory;
    d.groundItems[d.sceneId] = [...(d.groundItems[d.sceneId] ?? []), r.removed];
  }, { react: false });
}

export function pickUp(s: GameState, uid: string, charId: CharacterId, loc?: StorageLocation): GameState {
  return run(s, (d) => {
    const ground = d.groundItems[d.sceneId] ?? [];
    const inst = ground.find((i) => i.uid === uid);
    const c = d.party.find((p) => p.id === charId);
    if (!inst || !c) return;
    const r = loc ? addItem(c.inventory, inst, loc) : autoPlace(c.inventory, inst);
    if (!r.ok) {
      pushNarrative(d, 'sistema', `${shortName(CHARACTER_BY_ID[charId])} não tem espaço livre.`);
      return;
    }
    c.inventory = r.inventory;
    d.groundItems[d.sceneId] = ground.filter((i) => i.uid !== uid);
  }, { react: false });
}

// ---------------------------------------------------------------------------
// Diário e Modo Mestre
// ---------------------------------------------------------------------------

export function addHypothesis(s: GameState, text: string): GameState {
  const t = text.trim();
  if (!t) return s;
  return run(s, (d) => {
    d.seq += 1;
    d.journal.hypotheses.push({ id: `h${d.seq}`, text: t, time: d.time });
  }, { react: false });
}

export function removeHypothesis(s: GameState, id: string): GameState {
  return run(s, (d) => {
    d.journal.hypotheses = d.journal.hypotheses.filter((h) => h.id !== id);
  }, { react: false });
}

export function setControl(s: GameState, charId: CharacterId, mode: ControlMode): GameState {
  return run(s, (d) => {
    const c = d.party.find((p) => p.id === charId);
    if (c) c.control = mode;
  }, { react: false });
}

export function gmGrantXp(s: GameState, target: CharacterId | 'todos', amount: number): GameState {
  return run(s, (d) => {
    d.party = d.party.map((c) => (target === 'todos' || c.id === target ? addXp(c, amount) : c));
    pushNarrative(d, 'sistema', `O narrador concede ${amount} XP a ${target === 'todos' ? 'todo o grupo' : shortName(CHARACTER_BY_ID[target])}.`);
  }, { react: false });
}

export function gmAdvanceTime(s: GameState, minutes: number): GameState {
  return run(s, (d) => {
    advanceTime(d, minutes);
    pushNarrative(d, 'sistema', `O tempo passa (${minutes} min).`);
  }, { react: false });
}

export function gmTrack(s: GameState, track: TrackId, delta: number): GameState {
  return run(s, (d) => {
    d.internal.tracks[track] = Math.max(0, d.internal.tracks[track] + delta);
  }, { react: false });
}
