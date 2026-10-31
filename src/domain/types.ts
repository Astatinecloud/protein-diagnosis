import type { Trait } from './traits';

export type Vector = Record<Trait, number>;

export interface Option {
  id: string;
  label: string;
  scores: Partial<Vector>;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface QuestionSet {
  version: number;
  questions: Question[];
}

export interface Protein {
  id: string;
  nameJa: string;
  nameEn: string;
  typeName: string;
  catchCopy: string;
  personality: string;
  strengths: string[];
  weaknesses: string[];
  biology: string;
  funFact: string;
  profile: Vector;
  structure: {
    pdbId: string;
    description: string;
    organism: string;
    method: string;
    resolution: string;
    kind: string;
    assembly: string;
    citation: string;
    note: string;
    assemblyId: string;
  };
}
