import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuiz } from '../state/QuizContext';
import data from '../data/proteins.json';
import { diagnose } from '../domain/resultMapping';
import { Chain } from '../components/Shared';

export default function DiagnosingPage() {
  const { questions, answers } = useQuiz();
  const navigate = useNavigate();
  const result = diagnose(questions, answers, data.proteins);

  useEffect(() => {
    if (!result) return;

    const timer = setTimeout(() => {
      navigate(`/result/${result.id}`, { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [result?.id, navigate]);

  if (!result) return <Navigate to="/quiz" replace />;

  return (
    <section className="hero diagnosing" role="status">
      <Chain folding />
      <h1>あなたのたんぱく質を解析中…</h1>
      <p>あなたらしさを、ひとつのかたちに。</p>
    </section>
  );
}
