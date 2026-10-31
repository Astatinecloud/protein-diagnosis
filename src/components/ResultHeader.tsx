import type { Protein } from '../domain/types';

export function ResultHeader({ protein }: { protein: Protein }) {
  return (
    <header className="result-header">
      <p className="eyebrow">あなたは</p>
      <h1>{protein.typeName}タイプ！</h1>
      <p className="protein-name">
        {protein.nameJa}
        <span>{protein.nameEn}</span>
      </p>
    </header>
  );
}
