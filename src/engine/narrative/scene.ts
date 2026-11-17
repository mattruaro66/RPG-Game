import { rules } from '../../config/rules';
import { CHARACTER_BY_ID, shortName } from '../../data/characters';
import { actionTest, bestTier, canReroll, rerollActionTest, simpleTest, tierOf, type LimitBreakdown, type TestResult } from '../checks';
import { characterLimit } from '../character';
import { pushNarrative, pushTest, shortTestSummary } from '../log';
import { canAct, needsFocusCheck } from '../sanity';
import type { GameState, PendingTest, TestSource } from '../state';
import type { CharacterId, CharacterState, ContextTag, Dice } from '../types';
import { activeParty, evaluate, renderBlocks } from './conditions';
import { advanceTime, applyEffects, enterDialogueNode } from './effects';
import { content } from './registry';
import type { DialogueOption, Interaction, Outcome, Outcomes, TestSpec } from './types';

const nameOf = (id: CharacterId) => shortName(CHARACTER_BY_ID[id]);

export function currentScene(s: GameState) {
  return content().scenes[s.sceneId];
}

export function interactionKey(sceneId: string, id: string): string {
  return `${sceneId}:${id}`;
}

export function visibleInteractions(s: GameState): Interaction[] {
  const scene = currentScene(s);
  if (!scene) return [];
  return scene.interactions.filter((i) => evaluate(i.if, s) && !(i.once && s.usedInteractions.includes(interactionKey(scene.id, i.id))));
}

export function ambientTags(s: GameState): ContextTag[] {
  return currentScene(s)?.ambientTags ?? [];
}

/** Escolhe a especialidade pertinente que gera o maior limite para o personagem. */
export function limitFor(s: GameState, c: CharacterState, spec: TestSpec): LimitBreakdown {
  const options = [spec.specialty, ...(spec.altSpecialties ?? [])].filter(Boolean) as string[];
  const owned = options.filter((o) => c.specialties.includes(o));
  const candidates = (owned.length ? owned : [spec.specialty]).map((sp) =>
    characterLimit(c, { attribute: spec.attribute, specialty: sp, tags: spec.tags }, ambientTags(s)),
  );
  return candidates.reduce((a, b) => (b.limit > a.limit ? b : a));
}

export function previewTest(s: GameState, c: CharacterState, spec: TestSpec): { value: number; label: string; breakdown?: LimitBreakdown } {
  if (spec.kind === 'd6') return { value: c.attributes[spec.attribute], label: `D6 ≤ ${c.attributes[spec.attribute]}` };
  const b = limitFor(s, c, spec);
  return { value: b.limit, label: `D20 ≤ ${b.limit}`, breakdown: b };
}

function rollFor(s: GameState, dice: Dice, c: CharacterState, spec: TestSpec): TestResult {
  if (spec.kind === 'd6') return simpleTest(dice, { label: spec.label, attribute: spec.attribute, value: c.attributes[spec.attribute] });
  return actionTest(dice, spec.label, limitFor(s, c, spec));
}

function findTestable(src: TestSource): { spec: TestSpec; outcomes: Outcomes; effects?: Interaction['effects']; option?: DialogueOption; interaction?: Interaction } {
  const c = content();
  if (src.type === 'interaction') {
    const it = c.scenes[src.sceneId].interactions.find((i) => i.id === src.interactionId)!;
    return { spec: it.test!, outcomes: it.outcomes!, effects: it.effects, interaction: it };
  }
  const opt = c.dialogues[src.dialogueId].nodes[src.nodeId].options.find((o) => o.id === src.optionId)!;
  return { spec: opt.test!, outcomes: opt.outcomes!, option: opt };
}

function pushOutcome(s: GameState, dice: Dice, o: Outcome | undefined, actorId: CharacterId): void {
  if (!o) return;
  for (const b of renderBlocks(o.text, s)) pushNarrative(s, b.speaker ? 'fala' : 'texto', b.text, b.speaker);
  applyEffects(s, dice, o.effects ?? [], { actorId });
}

/** Teste de foco (Sanidade 2–4 e 1). Retorna false se o personagem perdeu a ação. */
function focusCheck(s: GameState, dice: Dice, c: CharacterState): boolean {
  if (!needsFocusCheck(c)) return true;
  const t = simpleTest(dice, { label: 'Espírito — manter o foco', attribute: 'espirito', value: c.attributes.espirito });
  pushTest(s, t, nameOf(c.id));
  if (!t.success) {
    pushNarrative(s, 'sistema', `${nameOf(c.id)} não consegue se concentrar. A ação se perde.`);
    advanceTime(s, rules.durations.examinar);
    return false;
  }
  return true;
}

function startTest(s: GameState, dice: Dice, src: TestSource, actorId: CharacterId, helperIds: CharacterId[]): void {
  const { spec } = findTestable(src);
  const actor = s.party.find((p) => p.id === actorId);
  if (!actor || !canAct(actor)) {
    pushNarrative(s, 'sistema', 'Esse personagem não pode agir agora.');
    return;
  }
  if (!focusCheck(s, dice, actor)) return;
  const main = rollFor(s, dice, actor, spec);
  pushTest(s, main, nameOf(actorId));
  const helpers: PendingTest['helpers'] = [];
  if (spec.allowCooperation && spec.kind === 'd20') {
    for (const hid of helperIds.filter((h) => h !== actorId).slice(0, 2)) {
      const h = s.party.find((p) => p.id === hid);
      if (!h || !canAct(h)) continue;
      const r = rollFor(s, dice, h, spec);
      pushTest(s, r, `${nameOf(hid)} (cooperação)`);
      helpers.push({ id: hid, result: r });
    }
  }
  const pending: PendingTest = { source: src, actorId, helperIds, main, helpers };
  if (main.kind === 'd20' && canReroll(main, actor.bonuses)) {
    s.pendingTest = pending;
    pushNarrative(s, 'sistema', `${nameOf(actorId)} pode usar Teimosia Inabalável para repetir o D20.`);
    return;
  }
  finalizeTest(s, dice, pending, false);
}

export function finalizeTest(s: GameState, dice: Dice, pending: PendingTest, reroll: boolean): void {
  s.pendingTest = null;
  let main = pending.main;
  if (reroll && main.kind === 'd20') {
    main = rerollActionTest(dice, main);
    pushTest(s, main, nameOf(pending.actorId));
  }
  const { outcomes, effects, option, interaction } = findTestable(pending.source);
  const tier = bestTier([tierOf(main), ...pending.helpers.map((h) => tierOf(h.result))]);
  s.lastTier = tier;
  pushNarrative(s, 'teste', `${nameOf(pending.actorId)}: ${shortTestSummary(main)}${pending.helpers.length ? ` · cooperação: ${pending.helpers.map((h) => `${nameOf(h.id)} ${h.result.success ? 'sucesso' : 'falha'}`).join(', ')}` : ''}`);
  const outcome = tier === 'critico' ? outcomes.critico ?? outcomes.sucesso : tier === 'sucesso' ? outcomes.sucesso : outcomes.falha;
  pushOutcome(s, dice, outcome, pending.actorId);
  if (pending.helpers.some((h) => h.result.success) && outcomes.cooperacao) pushOutcome(s, dice, outcomes.cooperacao, pending.actorId);
  applyEffects(s, dice, effects ?? [], { actorId: pending.actorId });

  if (pending.source.type === 'interaction' && interaction?.once) {
    s.usedInteractions.push(interactionKey(pending.source.sceneId, pending.source.interactionId));
  }
  if (pending.source.type === 'dialogue' && option) {
    if (option.once) s.usedInteractions.push(`dlg:${pending.source.dialogueId}:${option.id}`);
    applyEffects(s, dice, option.effects ?? [], { actorId: pending.actorId });
    if (s.dialogue && !s.combat) {
      const next = outcome.next !== undefined ? outcome.next : option.next;
      if (next === null) closeDialogue(s);
      else if (next) enterDialogueNode(s, dice, pending.source.dialogueId, next);
    }
  }
}

export function performInteraction(s: GameState, dice: Dice, interactionId: string, actorId?: CharacterId, helperIds: CharacterId[] = []): void {
  if (s.pendingTest || s.combat || s.dialogue) return;
  const scene = currentScene(s);
  const it = scene.interactions.find((i) => i.id === interactionId);
  if (!it || !evaluate(it.if, s)) return;
  if (it.once && s.usedInteractions.includes(interactionKey(scene.id, it.id))) return;

  pushNarrative(s, 'sistema', `▸ ${it.label}`);
  if (it.image) s.visual = it.image;
  const duration = it.timeCost ?? defaultDuration(it.kind);
  advanceTime(s, duration);
  for (const b of renderBlocks(it.text, s)) pushNarrative(s, b.speaker ? 'fala' : 'texto', b.text, b.speaker);

  if (it.test) {
    const actor = actorId ?? defaultActor(s, it.test);
    if (!actor) return;
    startTest(s, dice, { type: 'interaction', sceneId: scene.id, interactionId: it.id }, actor, helperIds);
    return;
  }
  if (it.once) s.usedInteractions.push(interactionKey(scene.id, it.id));
  applyEffects(s, dice, it.effects ?? [], { actorId });
}

export function defaultDuration(kind: Interaction['kind']): number {
  const d = rules.durations;
  switch (kind) {
    case 'examinar': return d.examinar;
    case 'investigar': return d.investigar;
    case 'dialogo': return d.dialogo;
    case 'mover': return d.deslocamento;
    case 'esperar': return d.esperar;
    default: return d.examinar;
  }
}

export function defaultActor(s: GameState, spec: TestSpec): CharacterId | undefined {
  const able = activeParty(s).filter(canAct);
  if (!able.length) return undefined;
  return able.reduce((a, b) => (previewTest(s, b, spec).value > previewTest(s, a, spec).value ? b : a)).id;
}

// ---------------------------------------------------------------------------
// Diálogos
// ---------------------------------------------------------------------------

export function currentDialogueNode(s: GameState) {
  if (!s.dialogue) return null;
  const dlg = content().dialogues[s.dialogue.dialogueId];
  return { dialogue: dlg, node: dlg.nodes[s.dialogue.nodeId], npc: content().npcs[dlg.npc] };
}

export function visibleOptions(s: GameState): DialogueOption[] {
  const cur = currentDialogueNode(s);
  if (!cur) return [];
  return cur.node.options.filter((o) => evaluate(o.if, s) && !(o.once && s.usedInteractions.includes(`dlg:${cur.dialogue.id}:${o.id}`)));
}

function closeDialogue(s: GameState): void {
  s.dialogue = null;
  s.visual = currentScene(s)?.image;
}

/**
 * Executa uma opção de diálogo. Com `spokenText`, a fala exibida é a do
 * jogador (resposta livre) em vez do rótulo da opção.
 */
export function chooseDialogueOption(s: GameState, dice: Dice, optionId: string, actorId?: CharacterId, helperIds: CharacterId[] = [], spokenText?: string): void {
  if (s.pendingTest || s.combat) return;
  const cur = currentDialogueNode(s);
  if (!cur) return;
  const opt = visibleOptions(s).find((o) => o.id === optionId);
  if (!opt) return;
  const speaker = actorId ?? s.contactId;
  pushNarrative(s, 'fala', spokenText ?? opt.label, nameOf(speaker));
  advanceTime(s, 3);
  if (opt.test) {
    const actor = actorId ?? defaultActor(s, opt.test);
    if (!actor) return;
    startTest(s, dice, { type: 'dialogue', dialogueId: cur.dialogue.id, nodeId: s.dialogue!.nodeId, optionId: opt.id }, actor, helperIds);
    return;
  }
  if (opt.once) s.usedInteractions.push(`dlg:${cur.dialogue.id}:${opt.id}`);
  applyEffects(s, dice, opt.effects ?? [], { actorId: speaker });
  if (s.dialogue && !s.combat) {
    if (opt.next === null) closeDialogue(s);
    else if (opt.next) enterDialogueNode(s, dice, cur.dialogue.id, opt.next);
  }
}
