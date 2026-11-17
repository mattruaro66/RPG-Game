import { CHARACTER_BY_ID, shortName } from '../../data/characters';
import { ITEM_BY_ID } from '../../data/items';
import { startCombat } from '../combat/combat';
import { applyDamage, rollDamage } from '../damage';
import { autoPlace, makeUid, removeItem, allItems } from '../inventory';
import { pushDiceLines, pushNarrative, pushTest } from '../log';
import { addXp } from '../progression';
import { applyHorrorEvent, HORROR_EVENTS } from '../sanity';
import type { GameState } from '../state';
import { dayIndex, formatDateTime, minutesUntilHour } from '../time';
import type { CharacterId, Dice } from '../types';
import { activeParty, evaluate, interpolate, renderBlocks } from './conditions';
import { content } from './registry';
import type { Effect } from './types';
import { dailyDrift } from './factions';

export interface EffectContext {
  actorId?: CharacterId;
}

function nameOf(id: CharacterId): string {
  return shortName(CHARACTER_BY_ID[id]);
}

export function advanceTime(s: GameState, minutes: number): void {
  if (minutes <= 0) return;
  const before = dayIndex(s.time);
  s.time += minutes;
  const after = dayIndex(s.time);
  for (let d = before + 1; d <= after; d++) dailyDrift(s, d);
}

export function addClue(s: GameState, id: string, extra?: string): void {
  const def = content().clues[id];
  if (!def) throw new Error(`Pista desconhecida: ${id}`);
  const existing = s.journal.clues.find((c) => c.id === id);
  if (existing) {
    if (extra && !existing.extras.includes(extra)) {
      existing.extras.push(extra);
      pushNarrative(s, 'sistema', `Pista atualizada: ${def.title}`);
    }
    return;
  }
  s.journal.clues.push({ id, time: s.time, sceneId: s.sceneId, witnesses: activeParty(s).map((c) => c.id), extras: extra ? [extra] : [] });
  pushNarrative(s, 'sistema', `Nova pista: ${def.title}`);
}

function giveItem(s: GameState, itemId: string, to: CharacterId | undefined): void {
  const def = ITEM_BY_ID[itemId];
  if (!def) throw new Error(`Item desconhecido: ${itemId}`);
  const inst = { uid: makeUid(), itemId };
  const candidates = [
    ...(to ? s.party.filter((c) => c.id === to) : []),
    ...activeParty(s).filter((c) => c.id !== to),
  ];
  for (const c of candidates) {
    const r = autoPlace(c.inventory, inst);
    if (r.ok) {
      c.inventory = r.inventory;
      pushNarrative(s, 'sistema', `${nameOf(c.id)} guardou: ${def.name}.`);
      if (def.documentId && !s.journal.documents.includes(def.documentId)) s.journal.documents.push(def.documentId);
      return;
    }
  }
  s.groundItems[s.sceneId] = [...(s.groundItems[s.sceneId] ?? []), inst];
  pushNarrative(s, 'sistema', `Ninguém tem espaço livre: ${def.name} ficou no local.`);
  if (def.documentId && !s.journal.documents.includes(def.documentId)) s.journal.documents.push(def.documentId);
}

export function enterScene(s: GameState, dice: Dice, sceneId: string): void {
  const scene = content().scenes[sceneId];
  if (!scene) throw new Error(`Cena desconhecida: ${sceneId}`);
  s.sceneId = sceneId;
  s.dialogue = null;
  s.visual = scene.image;
  pushNarrative(s, 'cena', scene.title);
  for (const b of renderBlocks(scene.intro, s)) pushNarrative(s, 'texto', b.text);
  if (!s.journal.locations.includes(scene.location)) s.journal.locations.push(scene.location);
  if (scene.dangerSense) {
    const sensor = activeParty(s).find((c) => c.bonuses.includes('instinto_de_perigo'));
    if (sensor) pushNarrative(s, 'perigo', `${nameOf(sensor.id)} sente um arrepio: ${interpolate(scene.dangerSense, s)}`);
  }
  const first = !s.visitedScenes.includes(sceneId);
  if (first) {
    s.visitedScenes.push(sceneId);
    applyEffects(s, dice, scene.onEnter ?? [], {});
  }
}

export function enterDialogueNode(s: GameState, dice: Dice, dialogueId: string, nodeId: string): void {
  const dlg = content().dialogues[dialogueId];
  const node = dlg?.nodes[nodeId];
  if (!node) throw new Error(`Nó de diálogo desconhecido: ${dialogueId}/${nodeId}`);
  s.dialogue = { dialogueId, nodeId };
  if (dlg.image) s.visual = dlg.image;
  const npc = content().npcs[dlg.npc];
  for (const b of renderBlocks(node.text, s)) {
    const speaker = b.speaker ?? node.speaker;
    const speakerName = speaker === 'narrador' || !speaker ? undefined : speaker === 'npc' ? npc?.name : interpolate(speaker, s);
    pushNarrative(s, speakerName ? 'fala' : 'texto', b.text, speakerName);
  }
  applyEffects(s, dice, node.effects ?? [], {});
}

export function applyEffects(s: GameState, dice: Dice, effects: Effect[], ctx: EffectContext): void {
  for (const e of effects) applyEffect(s, dice, e, ctx);
}

export function applyEffect(s: GameState, dice: Dice, e: Effect, ctx: EffectContext): void {
  const c = content();
  switch (e.type) {
    case 'clue':
      addClue(s, e.id, e.extra);
      break;
    case 'flag':
      s.flags[e.key] = e.value ?? true;
      break;
    case 'item':
      giveItem(s, e.itemId, e.to === 'actor' ? ctx.actorId : e.to);
      break;
    case 'removeItem':
      for (const ch of s.party) {
        const inst = allItems(ch.inventory).find((i) => i.itemId === e.itemId);
        if (inst) {
          ch.inventory = removeItem(ch.inventory, inst.uid).inventory;
          break;
        }
      }
      break;
    case 'time':
      advanceTime(s, e.minutes);
      break;
    case 'sanity': {
      const targets = e.who === 'actor' && ctx.actorId ? s.party.filter((p) => p.id === ctx.actorId) : activeParty(s);
      for (const t of targets) {
        const r = applyHorrorEvent(dice, t, e.event);
        if (r.test) pushTest(s, r.test, nameOf(t.id));
        const idx = s.party.findIndex((p) => p.id === t.id);
        s.party[idx] = r.change.character;
        if (r.change.after < r.change.before) {
          pushNarrative(s, 'sistema', `${nameOf(t.id)} perde ${r.change.before - r.change.after} de Sanidade (${HORROR_EVENTS[e.event].label}).`);
        }
        if (r.change.note) pushNarrative(s, 'sistema', `${nameOf(t.id)}: ${r.change.note}`);
      }
      break;
    }
    case 'damage': {
      const target = s.party.find((p) => p.id === ctx.actorId);
      if (!target) break;
      const d = rollDamage(dice, e.damageType, false);
      pushDiceLines(s, [`Dano: ${d.formula}`, `Dados: ${d.rolls.join(' + ')} → ${d.total}`], `${d.total} de dano`, nameOf(target.id));
      const r = applyDamage(target, d.total);
      s.party = s.party.map((p) => (p.id === target.id ? r.target : p));
      pushNarrative(s, 'sistema', `${nameOf(target.id)} sofre ${d.total} de dano. ${r.outcome.note}`.trim());
      break;
    }
    case 'xp': {
      const ids = e.who === 'actor' && ctx.actorId ? [ctx.actorId] : activeParty(s).map((p) => p.id);
      s.party = s.party.map((p) => (ids.includes(p.id) ? addXp(p, e.amount) : p));
      pushNarrative(s, 'sistema', `+${e.amount} XP (${e.who === 'actor' && ctx.actorId ? nameOf(ctx.actorId) : 'grupo'}).`);
      break;
    }
    case 'trust': {
      const n = s.npcs[e.npc] ?? { trust: c.npcs[e.npc]?.initialTrust ?? 0, met: false, state: 'normal' };
      s.npcs[e.npc] = { ...n, trust: n.trust + e.delta };
      break;
    }
    case 'npcState': {
      const n = s.npcs[e.npc] ?? { trust: c.npcs[e.npc]?.initialTrust ?? 0, met: false, state: 'normal' };
      s.npcs[e.npc] = { ...n, state: e.state };
      break;
    }
    case 'meet': {
      const n = s.npcs[e.npc] ?? { trust: c.npcs[e.npc]?.initialTrust ?? 0, met: false, state: 'normal' };
      s.npcs[e.npc] = { ...n, met: true };
      if (!s.journal.people.includes(e.npc)) s.journal.people.push(e.npc);
      break;
    }
    case 'track':
      s.internal.tracks[e.track] = Math.max(0, (s.internal.tracks[e.track] ?? 0) + e.delta);
      break;
    case 'attention':
      s.internal.factionAttention[e.faction] = Math.max(0, (s.internal.factionAttention[e.faction] ?? 0) + e.delta);
      break;
    case 'knowledge':
      s.internal.vampireKnowledge = Math.max(0, s.internal.vampireKnowledge + e.delta);
      break;
    case 'objective': {
      const o = s.journal.objectives.find((x) => x.id === e.id);
      if (o && o.status === e.status) break;
      if (o) o.status = e.status;
      else s.journal.objectives.push({ id: e.id, status: e.status });
      const def = c.objectives[e.id];
      if (def) pushNarrative(s, 'sistema', e.status === 'ativo' ? `Novo objetivo: ${def.text}` : `Objetivo ${e.status === 'concluido' ? 'concluído' : 'falhou'}: ${def.text}`);
      break;
    }
    case 'case': {
      const k = s.journal.cases.find((x) => x.id === e.id);
      if (k) k.status = e.status;
      else s.journal.cases.push({ id: e.id, status: e.status });
      break;
    }
    case 'decision':
      s.decisions.push({ id: e.id, label: e.label, time: s.time });
      s.flags[`decisao_${e.id}`] = true;
      break;
    case 'document':
      if (!s.journal.documents.includes(e.id)) s.journal.documents.push(e.id);
      break;
    case 'location':
      if (!s.journal.locations.includes(e.id)) s.journal.locations.push(e.id);
      break;
    case 'event':
      s.journal.events.push({ time: s.time, text: interpolate(e.text, s) });
      break;
    case 'goto':
      enterScene(s, dice, e.scene);
      break;
    case 'dialogue':
      enterDialogueNode(s, dice, e.id, e.node ?? c.dialogues[e.id].start);
      break;
    case 'endDialogue':
      s.dialogue = null;
      s.visual = c.scenes[s.sceneId]?.image;
      break;
    case 'combat': {
      const enc = c.encounters[e.encounter];
      if (!enc) throw new Error(`Encontro desconhecido: ${e.encounter}`);
      s.dialogue = null;
      startCombat(s, dice, enc);
      break;
    }
    case 'narrate':
      pushNarrative(s, e.kind ?? 'texto', interpolate(e.text, s));
      break;
    case 'restUntil':
      advanceTime(s, minutesUntilHour(s.time, e.hour));
      pushNarrative(s, 'sistema', `Amanhece. ${formatDateTime(s.time)}.`);
      break;
    case 'endChapter':
      s.flags.fim_capitulo_1 = true;
      break;
  }
}

export { evaluate };
