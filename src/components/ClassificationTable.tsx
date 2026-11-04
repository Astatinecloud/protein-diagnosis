import data from '../data/proteins.json';
import { codeLabels } from '../domain/typeCode';

const rows = ['ES', 'EB', 'NS', 'NB'];
const columns = ['UH', 'UX', 'TH', 'TX'];
const legend = (code: string) => codeLabels(code).map(({ letter, science }) =>
  letter + ' ' + science).join(' / ');

export function ClassificationTable({ selectedId }: { selectedId: string }) {
  return (
    <table className="classification-table">
      <caption>
        4文字分類表<br />
        行（1・2文字目）: {legend('EN')}、{legend('BS')}<br />
        列（3・4文字目）: {legend('UT')}、{legend('HX')}
      </caption>
      <thead>
        <tr>
          <th scope="col">分類</th>
          {columns.map(col => <th scope="col" key={col}>{col}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row}>
            <th scope="row">{row}</th>
            {columns.map(col => {
              const entry = data.proteins.find(candidate => candidate.typeCode === row + col)!;
              return (
                <td key={col} className={entry.id === selectedId ? 'selected' : ''}>
                  <a href={'#protein-' + entry.id} aria-current={entry.id === selectedId ? 'true' : undefined}>
                    <strong>{entry.typeCode}</strong><br />{entry.nameJa}
                  </a>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
