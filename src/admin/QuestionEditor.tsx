import { traitKeys, traits } from '../domain/traits';
import type { Question } from '../domain/types';

export function QuestionEditor({ question, index, change, move }: {
  question: Question;
  index: number;
  change: (question: Question) => void;
  move: (direction: number) => void;
}) {
  return (
    <fieldset className="question-editor">
      <legend>Q{index + 1}</legend>
      <div className="actions">
        <button disabled={index === 0} onClick={() => move(-1)}>上へ</button>
        <button disabled={index === 7} onClick={() => move(1)}>下へ</button>
      </div>
      <label>質問文
        <textarea value={question.text} onChange={event => change({ ...question, text: event.target.value })} />
      </label>
      {question.options.map((option, oi) => {
        const update = (next: typeof option) => change({
          ...question, options: question.options.map((value, i) => i === oi ? next : value),
        });
        return (
          <fieldset key={option.id}>
            <legend>選択肢{'ABCD'[oi]}</legend>
            <label>ラベル
              <input value={option.label} onChange={event => update({ ...option, label: event.target.value })} />
            </label>
            <div className="score-grid">
              {traitKeys.map(trait => (
                <label key={trait}>{traits[trait]}
                  <input type="number" min={-5} max={5} step="any" value={option.scores[trait] ?? 0}
                    onChange={event => update({
                      ...option, scores: { ...option.scores, [trait]: event.target.valueAsNumber },
                    })} />
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </fieldset>
  );
}
