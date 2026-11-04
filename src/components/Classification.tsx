import type { Protein } from '../domain/types';
import { classificationDisclaimer, codeLabels } from '../domain/typeCode';

export function Classification({ protein, full = false }: { protein: Protein; full?: boolean }) {
  return (
    <section className="classification">
      <p className="type-code">{protein.typeCode}</p>
      <ul>
        {codeLabels(protein.typeCode).map(({ letter, science, personality }) => (
          <li key={letter}>
            <strong>{letter} {science}</strong>{full && <>：{personality}</>}
          </li>
        ))}
      </ul>
      {protein.classificationNote && <p>{protein.classificationNote}</p>}
      {full && <p className="credit">{classificationDisclaimer}</p>}
    </section>
  );
}
