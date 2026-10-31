import { createContext, useContext, useState, type ReactNode } from 'react';
import { getQuestions } from './questionStore';
import type { QuestionSet } from '../domain/types';

interface QuizState {
  questions: QuestionSet;
  answers: number[];
  answer: (index: number, value: number) => void;
  reset: () => void;
  preview: (set: QuestionSet) => void;
}

const Context = createContext<QuizState | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState(getQuestions);
  const [answers, setAnswers] = useState<number[]>([]);

  function answer(index: number, value: number) {
    setAnswers(previous => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  }

  function reset() {
    setAnswers([]);
    setQuestions(getQuestions());
  }

  return (
    <Context.Provider value={{ questions, answers, answer, reset, preview: set => {
      setAnswers([]);
      setQuestions(set);
    } }}>
      {children}
    </Context.Provider>
  );
}

export function useQuiz() {
  const value = useContext(Context);
  if (!value) throw new Error('QuizProvider is required');
  return value;
}
