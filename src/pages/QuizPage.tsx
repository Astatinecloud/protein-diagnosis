import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../state/QuizContext';

export default function QuizPage() {
  const { questions, answers, answer } = useQuiz();
  const [index, setIndex] = useState(() => Math.min(answers.length, 7));
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const heading = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const question = questions.questions[index];

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    heading.current?.focus();
  }, [index]);

  function choose(value: number) {
    if (pending) return;

    answer(index, value);
    setPending(true);
    timer.current = setTimeout(() => {
      setPending(false);
      if (index === 7) {
        navigate('/diagnosing');
      } else {
        setIndex(index + 1);
      }
    }, 250);
  }

  return (
    <section className="quiz">
      <div className="progress-label">
        <span>Q{index + 1} / 8</span>
        <span>あなたについて教えてください</span>
      </div>
      <progress value={index + 1} max={8} aria-label="質問の進捗" />
      <div className="question-slide" key={question.id}>
        <h1 ref={heading} tabIndex={-1}>
          {question.text}
        </h1>
        <div className="options">
          {question.options.map((option, optionIndex) => (
            <button
              key={option.id}
              disabled={pending}
              aria-pressed={answers[index] === optionIndex}
              className={`option ${answers[index] === optionIndex ? 'selected' : ''}`}
              onClick={() => choose(optionIndex)}
            >
              <span className="letter">{'ABCD'[optionIndex]}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        className="back"
        disabled={index === 0 || pending}
        onClick={() => setIndex(index - 1)}
      >
        ← 戻る
      </button>
    </section>
  );
}
