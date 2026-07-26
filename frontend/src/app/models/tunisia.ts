/**
 * The 24 Tunisian governorates, used by every address form.
 * Single source of truth — do not re-declare this list in a component.
 */
export const TUNISIA_GOVERNORATES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
  'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia',
  'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
  'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
] as const;

export type Governorate = (typeof TUNISIA_GOVERNORATES)[number];
