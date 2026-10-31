export const traits = {
  action: '行動力',
  harmony: '協調性',
  support: '支援性',
  steady: '安定性',
  flexible: '柔軟性',
  express: '発信力',
  curious: '探究心',
  guard: '守備力',
} as const;

export type Trait = keyof typeof traits;
export const traitKeys = Object.keys(traits) as Trait[];
