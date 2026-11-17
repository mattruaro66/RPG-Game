import type { CampaignContent } from './registry';
import type { Effect, Outcomes } from './types';

/**
 * Valida a regra 22.2: pistas essenciais não podem depender exclusivamente
 * de sucesso em dados. Uma pista essencial deve ser concedida por pelo menos
 * um caminho que não exija sucesso: interação sem teste, efeito sempre
 * aplicado, resultado de falha, opção de diálogo sem teste ou efeito de nó.
 */
export function guaranteedClueSources(c: CampaignContent): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (effects: Effect[] | undefined, where: string) => {
    for (const e of effects ?? []) {
      if (e.type === 'clue') out.set(e.id, [...(out.get(e.id) ?? []), where]);
    }
  };
  const addFailure = (o: Outcomes | undefined, where: string) => add(o?.falha.effects, `${where} (falha)`);

  for (const scene of Object.values(c.scenes)) {
    add(scene.onEnter, `${scene.id}:onEnter`);
    for (const it of scene.interactions) {
      add(it.effects, `${scene.id}:${it.id}`);
      if (it.test) addFailure(it.outcomes, `${scene.id}:${it.id}`);
    }
  }
  for (const d of Object.values(c.dialogues)) {
    for (const [nid, node] of Object.entries(d.nodes)) {
      add(node.effects, `${d.id}/${nid}`);
      for (const o of node.options) {
        if (!o.test) add(o.effects, `${d.id}/${nid}/${o.id}`);
        else addFailure(o.outcomes, `${d.id}/${nid}/${o.id}`);
      }
    }
  }
  for (const enc of Object.values(c.encounters)) {
    // Todos os desfechos de um combate são alcançáveis; considera-se garantido apenas
    // o que aparece em TODOS os desfechos possíveis.
    const sets = [enc.onVictory, enc.onFlee, enc.onEnemiesFled].map((l) => new Set(l.filter((e) => e.type === 'clue').map((e) => (e as { id: string }).id)));
    for (const id of sets[0]) if (sets.every((s) => s.has(id))) out.set(id, [...(out.get(id) ?? []), `encontro:${enc.id}`]);
  }
  return out;
}

export function essentialCluesWithoutGuarantee(c: CampaignContent): string[] {
  const sources = guaranteedClueSources(c);
  return Object.values(c.clues)
    .filter((cl) => cl.importance === 'essencial' && !sources.has(cl.id))
    .map((cl) => cl.id);
}

/** Verifica referências quebradas no conteúdo (cenas, pistas, itens, diálogos). */
export function referenceErrors(c: CampaignContent, itemIds: Set<string>, enemyIds: Set<string>): string[] {
  const errors: string[] = [];
  const check = (effects: Effect[] | undefined, where: string) => {
    for (const e of effects ?? []) {
      if (e.type === 'clue' && !c.clues[e.id]) errors.push(`${where}: pista ${e.id}`);
      if (e.type === 'goto' && !c.scenes[e.scene]) errors.push(`${where}: cena ${e.scene}`);
      if (e.type === 'item' && !itemIds.has(e.itemId)) errors.push(`${where}: item ${e.itemId}`);
      if (e.type === 'dialogue' && !c.dialogues[e.id]) errors.push(`${where}: diálogo ${e.id}`);
      if (e.type === 'combat' && !c.encounters[e.encounter]) errors.push(`${where}: encontro ${e.encounter}`);
      if (e.type === 'objective' && !c.objectives[e.id]) errors.push(`${where}: objetivo ${e.id}`);
      if (e.type === 'document' && !c.documents[e.id]) errors.push(`${where}: documento ${e.id}`);
      if ((e.type === 'meet' || e.type === 'trust' || e.type === 'npcState') && !c.npcs[e.npc]) errors.push(`${where}: npc ${e.npc}`);
      if (e.type === 'case' && !c.cases[e.id]) errors.push(`${where}: caso ${e.id}`);
    }
  };
  const checkOutcomes = (o: Outcomes | undefined, where: string) => {
    if (!o) return;
    for (const k of ['critico', 'sucesso', 'falha', 'cooperacao'] as const) check(o[k]?.effects, `${where}/${k}`);
  };
  for (const s of Object.values(c.scenes)) {
    check(s.onEnter, s.id);
    for (const it of s.interactions) {
      check(it.effects, `${s.id}:${it.id}`);
      checkOutcomes(it.outcomes, `${s.id}:${it.id}`);
      if (it.test && !it.outcomes) errors.push(`${s.id}:${it.id}: teste sem resultados`);
    }
  }
  for (const d of Object.values(c.dialogues)) {
    if (!d.nodes[d.start]) errors.push(`${d.id}: nó inicial inexistente`);
    for (const [nid, n] of Object.entries(d.nodes)) {
      check(n.effects, `${d.id}/${nid}`);
      for (const o of n.options) {
        check(o.effects, `${d.id}/${nid}/${o.id}`);
        checkOutcomes(o.outcomes, `${d.id}/${nid}/${o.id}`);
        if (typeof o.next === 'string' && !d.nodes[o.next]) errors.push(`${d.id}/${nid}/${o.id}: nó ${o.next}`);
      }
    }
  }
  for (const enc of Object.values(c.encounters)) {
    for (const e of enc.enemies) if (!enemyIds.has(e)) errors.push(`${enc.id}: inimigo ${e}`);
    for (const l of [enc.onVictory, enc.onFlee, enc.onEnemiesFled, enc.onDefeat]) check(l, `encontro:${enc.id}`);
  }
  return errors;
}
