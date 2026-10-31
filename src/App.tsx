import { Route, Routes, Link } from 'react-router-dom';
import { QuizProvider } from './state/QuizContext';
import TopPage from './pages/TopPage';
import QuizPage from './pages/QuizPage';
import DiagnosingPage from './pages/DiagnosingPage';
import ResultPage from './pages/ResultPage';
import NotFoundPage from './pages/NotFoundPage';
import { lazy, Suspense } from 'react';

const AdminPage = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true'
  ? lazy(() => import('./admin/AdminPage'))
  : null;

export default function App() {
  return (
    <QuizProvider>
      <header className="site-header">
        <Link to="/">
          ○—○ <span>たんぱく質診断</span>
        </Link>
        <span className="site-note">8 QUESTIONS · 12 PROTEINS</span>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/diagnosing" element={<DiagnosingPage />} />
          <Route path="/result/:proteinId" element={<ResultPage />} />
          {AdminPage && <Route path="/admin" element={
            <Suspense fallback={<p role="status">読み込み中…</p>}><AdminPage /></Suspense>
          } />}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </QuizProvider>
  );
}
