import { computeLimit, type LimitBreakdown } from './checks';
import { sanityState } from './sanity';
import type { AttributeId, CharacterState, ContextTag } from './types';

/** Etiquetas derivadas do estado do personagem (ex.: paranoia pela Sanidade). */
export function derivedTags(c: CharacterState): ContextTag[] {
  const tags: ContextTag[] = [];
  if (sanityState(c.sanity) === 'paranoia') tags.push('paranoia');
  return tags;
}

export interface CheckSpec {
  attribute: AttributeId;
  specialty?: string;
  tags?: ContextTag[];
}

export function characterLimit(c: CharacterState, spec: CheckSpec, ambientTags: ContextTag[] = []): LimitBreakdown {
  const has = !!spec.specialty && c.specialties.includes(spec.specialty);
  return computeLimit({
    attribute: spec.attribute,
    attributeValue: c.attributes[spec.attribute],
    specialtyId: spec.specialty,
    hasSpecialty: has,
    bonusIds: c.bonuses,
    tags: [...(spec.tags ?? []), ...ambientTags, ...derivedTags(c)],
  });
}
