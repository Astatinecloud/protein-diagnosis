import { Route, Routes, Link } from 'react-router-dom';
import data from './data/proteins.json';
import ZukanPage from './pages/ZukanPage';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { QuizProvider, useQuiz } from './state/QuizContext';
import TopPage from './pages/TopPage';
import QuizPage from './pages/QuizPage';
import DiagnosingPage from './pages/DiagnosingPage';
import ResultPage from './pages/ResultPage';
import NotFoundPage from './pages/NotFoundPage';
import { lazy, Suspense } from 'react';

const AdminPage = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true'
  ? lazy(() => import('./admin/AdminPage'))
  : null;

function SiteNote() {
  const { questions } = useQuiz();
  return <span className="site-note">{questions.questions.length} QUESTIONS · {data.proteins.length} PROTEINS</span>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <QuizProvider>
      <ScrollToTop />
      <header className="site-header">
        <Link to="/">
          ○—○ <span>たんぱく質診断</span>
        </Link>
        <SiteNote />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/diagnosing" element={<DiagnosingPage />} />
          <Route path="/result/:proteinId" element={<ResultPage />} />
          <Route path="/result/:proteinId/zukan" element={<ZukanPage />} />
          {AdminPage && <Route path="/admin" element={
            <Suspense fallback={<p role="status">読み込み中…</p>}><AdminPage /></Suspense>
          } />}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </QuizProvider>
  );
}
