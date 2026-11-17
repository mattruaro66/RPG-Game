import { CANONICAL, rules } from '../config/rules';
import { ITEM_BY_ID, type ItemDef, type StorageLocation } from '../data/items';
import type { InventoryState, ItemInstance } from './types';

export const LOCATION_LABELS: Record<StorageLocation, string> = {
  hands: 'Mãos',
  bag: 'Bolsa / mochila',
  pockets: 'Bolsos',
};

export function emptyInventory(): InventoryState {
  return { hands: [], bag: [], pockets: [] };
}

let uidCounter = 0;
export function makeUid(prefix = 'it'): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter.toString(36)}`;
}

export function itemDef(inst: ItemInstance): ItemDef {
  const d = ITEM_BY_ID[inst.itemId];
  if (!d) throw new Error(`Item desconhecido: ${inst.itemId}`);
  return d;
}

export function capacity(loc: StorageLocation): number {
  if (loc === 'hands') return CANONICAL.handsCapacity;
  if (loc === 'bag') return CANONICAL.bagCapacity;
  return rules.pocketCapacity ?? Infinity;
}

export function usedSlots(inv: InventoryState, loc: StorageLocation): number {
  return inv[loc].reduce((sum, i) => sum + (loc === 'pockets' ? 1 : itemDef(i).slots), 0);
}

export function canPlace(inv: InventoryState, itemId: string, loc: StorageLocation): { ok: boolean; reason?: string } {
  const def = ITEM_BY_ID[itemId];
  if (!def) return { ok: false, reason: 'Item desconhecido.' };
  if (!def.allowed.includes(loc)) {
    return { ok: false, reason: loc === 'pockets' ? `${def.name} não cabe nos bolsos.` : `${def.name} não pode ficar em: ${LOCATION_LABELS[loc]}.` };
  }
  const need = loc === 'pockets' ? 1 : def.slots;
  if (usedSlots(inv, loc) + need > capacity(loc)) return { ok: false, reason: `${LOCATION_LABELS[loc]}: sem espaço.` };
  return { ok: true };
}

export function addItem(inv: InventoryState, inst: ItemInstance, loc: StorageLocation): { inventory: InventoryState; ok: boolean; reason?: string } {
  const c = canPlace(inv, inst.itemId, loc);
  if (!c.ok) return { inventory: inv, ok: false, reason: c.reason };
  return { inventory: { ...inv, [loc]: [...inv[loc], inst] }, ok: true };
}

/** Coloca o item no primeiro local permitido com espaço: bolsos (se pequeno) → bolsa → mãos. */
export function autoPlace(inv: InventoryState, inst: ItemInstance): { inventory: InventoryState; ok: boolean; location?: StorageLocation } {
  const order: StorageLocation[] = ['pockets', 'bag', 'hands'];
  for (const loc of order) {
    const r = addItem(inv, inst, loc);
    if (r.ok) return { inventory: r.inventory, ok: true, location: loc };
  }
  return { inventory: inv, ok: false };
}

export function findItem(inv: InventoryState, uid: string): { loc: StorageLocation; inst: ItemInstance } | null {
  for (const loc of ['hands', 'bag', 'pockets'] as StorageLocation[]) {
    const inst = inv[loc].find((i) => i.uid === uid);
    if (inst) return { loc, inst };
  }
  return null;
}

export function removeItem(inv: InventoryState, uid: string): { inventory: InventoryState; removed: ItemInstance | null } {
  const f = findItem(inv, uid);
  if (!f) return { inventory: inv, removed: null };
  return { inventory: { ...inv, [f.loc]: inv[f.loc].filter((i) => i.uid !== uid) }, removed: f.inst };
}

export function moveItem(inv: InventoryState, uid: string, to: StorageLocation): { inventory: InventoryState; ok: boolean; reason?: string } {
  const f = findItem(inv, uid);
  if (!f) return { inventory: inv, ok: false, reason: 'Item não encontrado.' };
  if (f.loc === to) return { inventory: inv, ok: true };
  const without = removeItem(inv, uid).inventory;
  const r = addItem(without, f.inst, to);
  if (!r.ok) return { inventory: inv, ok: false, reason: r.reason };
  return r;
}

export function allItems(inv: InventoryState): ItemInstance[] {
  return [...inv.hands, ...inv.bag, ...inv.pockets];
}

export function hasItem(inv: InventoryState, itemId: string): boolean {
  return allItems(inv).some((i) => i.itemId === itemId);
}

export function weaponsInHands(inv: InventoryState): ItemInstance[] {
  return inv.hands.filter((i) => !!itemDef(i).weapon);
}
