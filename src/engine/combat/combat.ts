import { CANONICAL, rules } from '../../config/rules';
import { CHARACTER_BY_ID, shortName } from '../../data/characters';
import { ENEMY_BY_ID } from '../../data/enemies';
import { ITEM_BY_ID, UNARMED, type WeaponProfile } from '../../data/items';
import { actionTest, bestTier, canReroll, computeLimit, rerollActionTest, simpleTest, tierOf, type ActionTestResult, type TestResult, type Tier } from '../checks';
import { characterLimit } from '../character';
import { applyDamage, applyLethalityRules, rollDamage, DAMAGE_TABLE } from '../damage';
import { findItem, itemDef, moveItem } from '../inventory';
import { pushNarrative, pushTest, shortTestSummary, pushDiceLines } from '../log';
import { treat, TREATMENTS } from '../medical';
import { canAct } from '../sanity';
import type { CombatState, Combatant, EnemyInstance, GameState } from '../state';
import type { AttributeId, CharacterId, CharacterState, ContextTag, Dice } from '../types';
import { moveToEndOfQueue, rollInitiative } from './initiative';
import type { EncounterDef } from '../narrative/types';
import { activeParty } from '../narrative/conditions';

export type CombatAction =
  | { type: 'atacar'; targetId: string; weaponUid: string | null; helperIds?: CharacterId[] }
  | { type: 'defender' }
  | { type: 'cobertura' }
  | { type: 'tratar'; targetId: CharacterId; specialty: string }
  | { type: 'usar_item'; itemUid: string }
  | { type: 'ambiente'; interactionId: string }
  | { type: 'fugir' };

const COMBAT_TAGS: ContextTag[] = ['combate', 'perigo_real'];

let enemyCounter = 0;

export function createEnemy(templateId: string, suffix?: string): EnemyInstance {
  const t = ENEMY_BY_ID[templateId];
  if (!t) throw new Error(`Inimigo desconhecido: ${templateId}`);
  enemyCounter += 1;
  return {
    uid: `inimigo_${templateId}_${enemyCounter}`,
    templateId,
    name: suffix ? `${t.name} ${suffix}` : t.name,
    kind: t.kind,
    attributes: { ...t.attributes },
    specialties: [...t.specialties],
    hp: t.hp,
    maxHp: t.hp,
    status: 'ativo',
    criticalHits: 0,
    traits: [...t.traits],
    weaponItemId: t.weaponItemId,
  };
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export function partyMember(s: GameState, id: string): CharacterState | undefined {
  return s.party.find((c) => c.id === id);
}

export function combatantName(s: GameState, id: string): string {
  const c = partyMember(s, id);
  if (c) return shortName(CHARACTER_BY_ID[c.id]);
  return s.combat?.enemies[id]?.name ?? id;
}

export function isAble(s: GameState, id: string): boolean {
  const cb = s.combat?.combatants[id];
  if (!cb || cb.fled) return false;
  const c = partyMember(s, id);
  if (c) return canAct(c);
  const e = s.combat!.enemies[id];
  return !!e && e.status === 'ativo';
}

export function currentActorId(s: GameState): string | null {
  const cb = s.combat;
  if (!cb || cb.result) return null;
  return cb.order[cb.turnIndex] ?? null;
}

export function isEnemy(s: GameState, id: string): boolean {
  return !!s.combat?.enemies[id];
}

export function weaponProfileFor(s: GameState, id: string, weaponUid: string | null): WeaponProfile {
  const c = partyMember(s, id);
  if (c) {
    if (!weaponUid) return UNARMED;
    const f = findItem(c.inventory, weaponUid);
    if (f && f.loc === 'hands') return itemDef(f.inst).weapon ?? UNARMED;
    return UNARMED;
  }
  const e = s.combat!.enemies[id];
  return (e?.weaponItemId && ITEM_BY_ID[e.weaponItemId]?.weapon) || UNARMED;
}

export function bestWeaponUid(c: CharacterState): string | null {
  const w = c.inventory.hands.find((i) => ITEM_BY_ID[i.itemId]?.weapon);
  return w ? w.uid : null;
}

/** Traços canônicos de inimigos: +1, não cumulativo no mesmo teste. */
export function enemyTraitModifier(e: EnemyInstance, attribute: AttributeId, opts: { melee: boolean; groupSize: number }): number {
  let mod = 0;
  if (e.traits.includes('criminoso_comum')) {
    if (attribute === 'fisico' || attribute === 'reflexo') mod = 1; // em combate
    if (attribute === 'reflexo' && opts.groupSize >= 2) mod = Math.max(mod, 1);
  }
  if (e.traits.includes('capanga_profissional') && attribute === 'fisico' && opts.melee) mod = Math.max(mod, 1);
  return Math.min(mod, 1);
}

function activeEnemyCount(cb: CombatState): number {
  return Object.values(cb.enemies).filter((e) => e.status === 'ativo' && !cb.combatants[e.uid]?.fled).length;
}

function attackTest(s: GameState, dice: Dice, id: string, weapon: WeaponProfile, label: string): ActionTestResult {
  const c = partyMember(s, id);
  if (c) {
    const b = characterLimit(c, { attribute: weapon.attribute, specialty: weapon.specialty, tags: weapon.tags }, COMBAT_TAGS);
    let r = actionTest(dice, label, b);
    if (!r.success && rules.teimosiaAutoInCombat && canReroll(r, c.bonuses)) r = rerollActionTest(dice, r);
    return r;
  }
  const e = s.combat!.enemies[id];
  const mod = enemyTraitModifier(e, weapon.attribute, { melee: !weapon.firearm, groupSize: activeEnemyCount(s.combat!) });
  const b = computeLimit({
    attribute: weapon.attribute,
    attributeValue: e.attributes[weapon.attribute],
    specialtyId: weapon.specialty,
    hasSpecialty: e.specialties.includes(weapon.specialty),
    bonusIds: [],
    tags: [...weapon.tags, ...COMBAT_TAGS],
    traitModifier: mod,
  });
  return actionTest(dice, label, b);
}

function d6For(s: GameState, dice: Dice, id: string, attribute: AttributeId, label: string) {
  const c = partyMember(s, id);
  if (c) return simpleTest(dice, { label, attribute, value: c.attributes[attribute] });
  const e = s.combat!.enemies[id];
  const mod = enemyTraitModifier(e, attribute, { melee: false, groupSize: activeEnemyCount(s.combat!) });
  return simpleTest(dice, { label, attribute, value: e.attributes[attribute], traitModifier: mod });
}

function log(s: GameState, text: string): void {
  s.combat!.log.push(text);
  pushNarrative(s, 'texto', text);
}

// ---------------------------------------------------------------------------
// Início do combate
// ---------------------------------------------------------------------------

export function startCombat(s: GameState, dice: Dice, enc: EncounterDef): void {
  const enemies: Record<string, EnemyInstance> = {};
  const counts: Record<string, number> = {};
  enc.enemies.forEach((tid) => (counts[tid] = (counts[tid] ?? 0) + 1));
  const seen: Record<string, number> = {};
  for (const tid of enc.enemies) {
    seen[tid] = (seen[tid] ?? 0) + 1;
    const e = createEnemy(tid, counts[tid] > 1 ? String(seen[tid]) : undefined);
    enemies[e.uid] = e;
  }
  const partyIds = activeParty(s).filter(canAct).map((c) => c.id);
  const participants = [
    ...partyIds.map((id) => {
      const c = partyMember(s, id)!;
      return {
        id,
        relevantSpecialty: c.specialties.some((sp) => rules.initiativeSpecialties.includes(sp)),
        operativo: c.profession === 'operativo',
      };
    }),
    ...Object.values(enemies).map((e) => ({
      id: e.uid,
      relevantSpecialty: e.specialties.some((sp) => rules.initiativeSpecialties.includes(sp)),
      operativo: false,
    })),
  ];
  const init = rollInitiative(dice, participants);
  const combatants: Record<string, Combatant> = {};
  for (const e of init) {
    combatants[e.id] = {
      id: e.id,
      side: enemies[e.id] ? 'inimigos' : 'grupo',
      initiative: e.total,
      initiativeRolls: [e.roll, ...e.tiebreaks],
      inCover: false,
      defending: false,
      fled: false,
    };
  }
  s.combat = {
    encounterId: enc.id,
    round: 1,
    order: init.map((e) => e.id),
    turnIndex: 0,
    acted: [],
    combatants,
    enemies,
    log: [],
    result: null,
    moraleBroken: false,
    interactionsUsed: [],
  };
  pushNarrative(s, 'sistema', `Combate: ${enc.title}`);
  pushNarrative(s, 'texto', enc.intro);
  const lines = init.map((e) => `${combatantName(s, e.id)}: D6 ${e.roll}${e.bonus ? ` + ${e.bonus}` : ''} = ${e.total}${e.tiebreaks.length ? ` (desempate: ${e.tiebreaks.join(', ')})` : ''}`);
  pushDiceLines(s, ['Iniciativa', ...lines], 'Ordem definida');
  log(s, `Ordem de iniciativa: ${init.map((e) => combatantName(s, e.id)).join(' → ')}.`);
  ensureAbleCurrent(s);
}

// ---------------------------------------------------------------------------
// Turnos
// ---------------------------------------------------------------------------

function ensureAbleCurrent(s: GameState): void {
  const cb = s.combat!;
  checkEnd(s);
  if (cb.result) return;
  let guard = 0;
  while (guard++ < 100) {
    const id = cb.order[cb.turnIndex];
    if (id !== undefined && isAble(s, id) && !cb.acted.includes(id)) {
      cb.combatants[id].defending = false; // defesa dura até o próximo turno do personagem
      return;
    }
    if (cb.turnIndex < cb.order.length - 1) {
      cb.turnIndex += 1;
    } else {
      endRound(s);
      checkEnd(s);
      if (cb.result) return;
      cb.turnIndex = 0;
    }
  }
}

function endRound(s: GameState): void {
  const cb = s.combat!;
  if (cb.moraleBroken) {
    for (const e of Object.values(cb.enemies)) {
      if (e.status === 'ativo' && e.traits.includes('criminoso_comum') && !e.traits.includes('nao_abandona_combate')) {
        cb.combatants[e.uid].fled = true;
        e.status = 'fugiu';
        log(s, `${e.name} perde a coragem e foge escada abaixo.`);
      }
    }
    cb.moraleBroken = false;
  }
  cb.round += 1;
  cb.acted = [];
  log(s, `— Rodada ${cb.round} —`);
}

export function checkEnd(s: GameState): void {
  const cb = s.combat!;
  if (cb.result) return;
  const enemiesUp = Object.values(cb.enemies).filter((e) => e.status === 'ativo' && !cb.combatants[e.uid].fled);
  const partyUp = s.party.filter((c) => cb.combatants[c.id] && canAct(c) && !cb.combatants[c.id].fled);
  if (enemiesUp.length === 0) {
    const anyFled = Object.values(cb.enemies).some((e) => e.status === 'fugiu');
    cb.result = anyFled ? 'inimigos_fugiram' : 'vitoria';
  } else if (partyUp.length === 0) {
    const anyFled = s.party.some((c) => cb.combatants[c.id]?.fled);
    cb.result = anyFled ? 'fuga' : 'derrota';
  }
  if (cb.result) log(s, `Fim do combate: ${RESULT_LABELS[cb.result]}.`);
}

export const RESULT_LABELS: Record<NonNullable<CombatState['result']>, string> = {
  vitoria: 'os agressores foram neutralizados',
  fuga: 'o grupo conseguiu fugir',
  derrota: 'o grupo foi derrotado',
  inimigos_fugiram: 'os agressores fugiram',
};

function endTurn(s: GameState, actorId: string): void {
  const cb = s.combat!;
  if (!cb.acted.includes(actorId)) cb.acted.push(actorId);
  const idx = cb.order.indexOf(actorId);
  if (idx >= 0) cb.turnIndex = idx;
  if (cb.turnIndex < cb.order.length - 1) cb.turnIndex += 1;
  else {
    endRound(s);
    cb.turnIndex = 0;
  }
  ensureAbleCurrent(s);
}

// ---------------------------------------------------------------------------
// Cooperação (seção 10.4)
// ---------------------------------------------------------------------------

/** P-14: só pode cooperar fora de sua posição quem ainda não agiu nesta rodada. */
export function eligibleHelpers(s: GameState, actorId: string): CharacterId[] {
  const cb = s.combat;
  if (!cb || isEnemy(s, actorId)) return [];
  return s.party
    .filter((c) => c.id !== actorId && isAble(s, c.id) && !cb.acted.includes(c.id))
    .map((c) => c.id);
}

export interface CooperationCheck {
  helperId: CharacterId;
  reflexTest: TestResult;
  joined: boolean;
  actionTest?: ActionTestResult;
}

export function resolveCooperationReflex(s: GameState, dice: Dice, helperIds: CharacterId[], actorId: string): CooperationCheck[] {
  const cb = s.combat!;
  const valid = helperIds.filter((h) => eligibleHelpers(s, actorId).includes(h)).slice(0, CANONICAL.maxCooperationHelpers);
  const out: CooperationCheck[] = [];
  for (const h of valid) {
    const t = d6For(s, dice, h, 'reflexo', 'Reflexo — cooperar fora da iniciativa');
    pushTest(s, t, combatantName(s, h));
    if (t.success) {
      out.push({ helperId: h, reflexTest: t, joined: true });
      log(s, `${combatantName(s, h)} entra na ação sem perder seu turno.`);
    } else {
      cb.order = moveToEndOfQueue(cb.order, h);
      cb.turnIndex = cb.order.indexOf(actorId);
      out.push({ helperId: h, reflexTest: t, joined: false });
      log(s, `${combatantName(s, h)} hesita: a cooperação não acontece e vai para o final da fila.`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

export interface AttackReport {
  tier: Tier;
  hit: boolean;
  blockedBy?: 'cobertura' | 'esquiva';
  damage?: number;
  critical: boolean;
}

export function performAttack(s: GameState, dice: Dice, attackerId: string, targetId: string, weaponUid: string | null, helperIds: CharacterId[] = []): AttackReport {
  const cb = s.combat!;
  const weapon = weaponProfileFor(s, attackerId, weaponUid);
  const aName = combatantName(s, attackerId);
  const tName = combatantName(s, targetId);
  const main = attackTest(s, dice, attackerId, weapon, `Ataque (${DAMAGE_TABLE[weapon.damageType].label})`);
  pushTest(s, main, aName);
  const tiers: Tier[] = [tierOf(main)];

  if (helperIds.length) {
    const coop = resolveCooperationReflex(s, dice, helperIds, attackerId);
    for (const c of coop.filter((x) => x.joined)) {
      const hw = weaponProfileFor(s, c.helperId, bestWeaponUid(partyMember(s, c.helperId)!));
      const ht = attackTest(s, dice, c.helperId, hw, 'Ataque cooperativo');
      pushTest(s, ht, combatantName(s, c.helperId));
      tiers.push(tierOf(ht));
    }
  }

  const tier = bestTier(tiers);
  if (tier === 'falha') {
    log(s, `${aName} ataca ${tName} e erra. (${shortTestSummary(main)})`);
    return { tier, hit: false, critical: false };
  }

  const tcb = cb.combatants[targetId];
  if (tcb.inCover && weapon.firearm) {
    const ct = d6For(s, dice, targetId, rules.coverTestAttribute, 'Cobertura');
    pushTest(s, ct, tName);
    if (ct.success) {
      log(s, `${aName} dispara contra ${tName}, mas a cobertura absorve o tiro.`);
      return { tier, hit: false, blockedBy: 'cobertura', critical: tier === 'critico' };
    }
  }
  if (tcb.defending) {
    const dt = d6For(s, dice, targetId, rules.defenseTestAttribute, 'Defesa / esquiva');
    pushTest(s, dt, tName);
    if (dt.success) {
      log(s, `${tName} se esquiva do ataque de ${aName}.`);
      return { tier, hit: false, blockedBy: 'esquiva', critical: tier === 'critico' };
    }
  }

  const critical = tier === 'critico';
  const dmg = rollDamage(dice, weapon.damageType, critical);
  pushDiceLines(
    s,
    [`Dano: ${dmg.formula}`, `Dados: ${dmg.rolls.join(' + ')}${dmg.modifier ? ` ${dmg.modifier > 0 ? '+' : '−'} ${Math.abs(dmg.modifier)}` : ''} = ${dmg.raw}`, ...(dmg.raw !== dmg.base ? [`Dano mínimo aplicado: ${dmg.base}`] : []), ...(critical ? [`Crítico: total dobrado → ${dmg.total}`] : []), `Total: ${dmg.total}`],
    `${dmg.total} de dano`,
    aName,
  );

  const target = partyMember(s, targetId);
  if (target) {
    const leth = applyLethalityRules({ kind: 'humano', criticalHits: 0, firearm: weapon.firearm, critical, isProtagonist: true });
    const idx = s.party.findIndex((c) => c.id === targetId);
    if (leth.killed) {
      s.party[idx] = { ...target, hp: 0, status: 'morto' };
      log(s, `${aName} acerta ${tName} em cheio. ${leth.note}`);
    } else {
      const r = applyDamage(target, dmg.total);
      s.party[idx] = r.target;
      log(s, `${aName} acerta ${tName}: ${dmg.total} de dano${critical ? ' (crítico)' : ''}. ${r.outcome.note}`.trim());
    }
    return { tier, hit: true, damage: dmg.total, critical };
  }

  const e = cb.enemies[targetId];
  const leth = applyLethalityRules({ kind: e.kind, criticalHits: e.criticalHits, firearm: weapon.firearm, critical, isProtagonist: false });
  e.criticalHits = leth.criticalHits;
  if (leth.destroyed) {
    e.status = 'destruido';
    e.hp = 0;
  } else if (leth.killed) {
    e.status = 'morto';
    e.hp = 0;
  } else if (e.kind === 'vampiro' || e.kind === 'vampiro_mestre') {
    // P-10: zerar PV não destrói um vampiro.
    e.hp = Math.max(0, e.hp - dmg.total);
  } else {
    const r = applyDamage(e, dmg.total);
    Object.assign(e, r.target);
  }
  const statusNote = e.status === 'morto' ? 'Está morto.' : e.status === 'portas_da_morte' ? 'Cai, sem condições de lutar.' : e.status === 'destruido' ? 'Foi destruído.' : '';
  log(s, `${aName} acerta ${tName}: ${dmg.total} de dano${critical ? ' (crítico)' : ''}. ${leth.note ?? ''} ${statusNote}`.replace(/\s+/g, ' ').trim());
  return { tier, hit: true, damage: dmg.total, critical };
}

export function performCombatAction(s: GameState, dice: Dice, action: CombatAction, encounter?: EncounterDef): void {
  const cb = s.combat;
  if (!cb || cb.result) return;
  const actorId = currentActorId(s);
  if (!actorId) return;
  const name = combatantName(s, actorId);
  const me = cb.combatants[actorId];

  switch (action.type) {
    case 'atacar': {
      if (!isAble(s, action.targetId)) {
        log(s, `${name} não encontra um alvo válido.`);
        break;
      }
      performAttack(s, dice, actorId, action.targetId, action.weaponUid, action.helperIds ?? []);
      break;
    }
    case 'defender': {
      me.defending = true;
      log(s, `${name} se prepara para se defender ou esquivar.`);
      break;
    }
    case 'cobertura': {
      const t = d6For(s, dice, actorId, rules.coverTestAttribute, 'Procurar cobertura');
      pushTest(s, t, name);
      if (t.success) {
        me.inCover = true;
        log(s, `${name} se protege atrás de uma cobertura.`);
      } else log(s, `${name} não encontra cobertura a tempo.`);
      break;
    }
    case 'tratar': {
      const healer = partyMember(s, actorId);
      const target = partyMember(s, action.targetId);
      if (!healer || !target) break;
      const r = treat(dice, healer, target, action.specialty, COMBAT_TAGS);
      if (r.test) pushTest(s, r.test, name);
      if (!r.ok) {
        log(s, `${name} não pode tratar ${combatantName(s, target.id)}: ${r.reason}`);
        return; // não consome o turno
      }
      s.party = s.party.map((c) => (c.id === r.target.id ? r.target : c.id === r.healer.id ? r.healer : c));
      if (r.healed > 0) {
        pushDiceLines(s, [`Recuperação: ${TREATMENTS[action.specialty].label}`, `D6: ${r.healRoll}`, `PV recuperados: ${r.healed}`], `+${r.healed} PV`, name);
        log(s, `${name} trata ${combatantName(s, target.id)} (+${r.healed} PV).`);
      } else log(s, `${name} tenta tratar ${combatantName(s, target.id)}, sem sucesso.`);
      break;
    }
    case 'usar_item': {
      const c = partyMember(s, actorId);
      if (!c) break;
      const f = findItem(c.inventory, action.itemUid);
      if (!f) break;
      const r = moveItem(c.inventory, action.itemUid, 'hands');
      if (!r.ok) {
        log(s, `${name}: ${r.reason}`);
        return;
      }
      s.party = s.party.map((p) => (p.id === c.id ? { ...p, inventory: r.inventory } : p));
      log(s, `${name} empunha ${itemDef(f.inst).name}.`);
      break;
    }
    case 'ambiente': {
      const def = encounter?.environment.find((x) => x.id === action.interactionId);
      if (!def || cb.interactionsUsed.includes(def.id)) break;
      cb.interactionsUsed.push(def.id);
      const t = d6For(s, dice, actorId, def.attribute, def.label);
      pushTest(s, t, name);
      if (t.success) {
        if (def.effect === 'quebrar_moral') cb.moraleBroken = true;
        log(s, `${name}: ${def.description}`);
      } else log(s, `${name} tenta, mas não surte efeito.`);
      break;
    }
    case 'fugir': {
      const c = partyMember(s, actorId);
      let success = false;
      if (c && c.specialties.includes(rules.fleeSpecialty)) {
        const b = characterLimit(c, { attribute: 'reflexo', specialty: rules.fleeSpecialty, tags: ['movimentacao'] }, COMBAT_TAGS);
        let r = actionTest(dice, 'Fuga (Evasão)', b);
        if (!r.success && rules.teimosiaAutoInCombat && canReroll(r, c.bonuses)) r = rerollActionTest(dice, r);
        pushTest(s, r, name);
        success = r.success;
      } else {
        const t = d6For(s, dice, actorId, 'reflexo', 'Fuga');
        pushTest(s, t, name);
        success = t.success;
      }
      if (success) {
        me.fled = true;
        me.inCover = false;
        log(s, `${name} consegue escapar.`);
      } else log(s, `${name} tenta fugir, mas fica encurralado.`);
      break;
    }
  }
  endTurn(s, actorId);
}
