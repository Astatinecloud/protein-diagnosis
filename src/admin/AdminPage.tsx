import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import bundled from '../data/questions.json';
import proteins from '../data/proteins.json';
import { distribution } from '../domain/distribution';
import { validateQuestionSet } from '../domain/validation';
import { getQuestions, QUESTION_STORAGE_KEY } from '../state/questionStore';
import { useQuiz } from '../state/QuizContext';
import { QuestionEditor } from './QuestionEditor';

export default function AdminPage() {
  const [saved, setSaved] = useState(getQuestions);
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [percentages, setPercentages] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);
  const { preview } = useQuiz();
  const navigate = useNavigate();

  function valid() {
    const result = validateQuestionSet(draft);
    setErrors(result.errors);
    setMessage('');
    return result.ok;
  }

  function save() {
    if (!valid()) return;
    try {
      localStorage.setItem(QUESTION_STORAGE_KEY, JSON.stringify(draft));
      setSaved(draft);
      setMessage('保存しました');
    } catch {
      setErrors(['保存できませんでした。ブラウザーのストレージ設定を確認してください。']);
    }
  }

  function restore() {
    if (!window.confirm('初期設定に戻しますか？ 保存した変更も削除されます。')) return;
    try {
      localStorage.removeItem(QUESTION_STORAGE_KEY);
      setSaved(bundled);
      setDraft(bundled);
      setErrors([]);
      setPercentages(null);
      setMessage('初期設定に戻しました');
    } catch {
      setErrors(['保存データを削除できませんでした。']);
    }
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = validateQuestionSet(JSON.parse(await file.text()));
      setErrors(result.errors);
      if (result.ok && result.value) {
        setDraft(result.value);
        setMessage('読み込みました。反映するには保存してください。');
        setPercentages(null);
      }
    } catch {
      setErrors(['JSONファイルを読み込めませんでした。形式を確認してください。']);
    }
    event.target.value = '';
  }

  function exportJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showDistribution() {
    if (!valid()) return;
    setBusy(true);
    setTimeout(() => {
      setPercentages(distribution(draft, proteins.proteins).percentages);
      setBusy(false);
    }, 30);
  }

  return (
    <section className="admin">
      <h1>質問データ管理画面</h1>
      <p>変更を反映するには、エクスポートしたJSONで src/data/questions.json を置き換えて再デプロイしてください。</p>
      <div className="actions">
        <button onClick={save}>保存</button>
        <button onClick={() => { setDraft(saved); setErrors([]); setPercentages(null); }}>変更を取り消す</button>
        <button onClick={restore}>初期設定に戻す</button>
        <button onClick={exportJson}>JSONエクスポート</button>
        <label className="file-input">JSONインポート
          <input type="file" accept=".json,application/json" onChange={importJson} />
        </label>
        <button onClick={() => { if (valid()) { preview(draft); navigate('/quiz?preview=1'); } }}>プレビュー</button>
        <button disabled={busy} onClick={showDistribution}>結果分布を確認</button>
      </div>
      {message && <p role="status">{message}</p>}
      {busy && <p role="status">{(4 ** draft.questions.length).toLocaleString()}通りを計算中…</p>}
      {errors.length > 0 && <ul role="alert">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
      {percentages && (
        <table><caption>全{(4 ** draft.questions.length).toLocaleString()}通りの結果分布（赤: 0%、黄: 6%未満・11%超）</caption>
          <thead><tr><th>たんぱく質</th><th>割合</th></tr></thead>
          <tbody>{proteins.proteins.map(protein => {
            const percent = percentages[protein.id];
            const warning = percent === 0 ? 'unreachable' : percent < 6 || percent > 11 ? 'warning' : '';
            return <tr key={protein.id} className={warning}>
              <th>{protein.nameJa}</th><td>{percent.toFixed(2)}%{percent === 0 && '（到達不能）'}</td>
            </tr>;
          })}</tbody>
        </table>
      )}
      {draft.questions.map((question, index) => (
        <QuestionEditor key={question.id} question={question} index={index} count={draft.questions.length}
          change={next => {
            setDraft({ ...draft, questions: draft.questions.map((value, i) => i === index ? next : value) });
            setPercentages(null);
          }}
          move={direction => {
            const questions = [...draft.questions];
            [questions[index], questions[index + direction]] = [questions[index + direction], questions[index]];
            setDraft({ ...draft, questions });
            setPercentages(null);
          }} />
      ))}
    </section>
  );
}
