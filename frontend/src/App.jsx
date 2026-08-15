import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/ui/ProtectedRoute";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import useScrollRestoration from "@/hooks/useScrollRestoration";

/* ── Route-level code splitting ─────────────────────────────────
   Each page is a separate chunk — only the current page's JS is
   loaded. Reduces initial bundle from ~534kB to ~homepage chunk.
─────────────────────────────────────────────────────────────── */
const Home        = lazy(() => import("@/pages/Home"));
const LoginPage   = lazy(() => import("@/pages/LoginPage"));
const Profile     = lazy(() => import("@/pages/Profile"));
const FilmPage    = lazy(() => import("@/pages/FilmPage"));
const SearchPage  = lazy(() => import("@/pages/SearchPage"));
const Person      = lazy(() => import("@/pages/Person"));
const GenrePage   = lazy(() => import("@/pages/GenrePage"));
const ComparePage = lazy(() => import("@/pages/ComparePage"));
const NotFound    = lazy(() => import("@/pages/NotFound"));

/* ── Minimal page-transition fallback ──────────────────────────── */
const PageLoader = () => (
  <div className="min-h-screen bg-base flex items-center justify-center">
    <div
      className="rounded-full border-2 border-gold border-t-transparent"
      style={{ width: "2rem", height: "2rem", animation: "spin 0.8s linear infinite" }}
      aria-label="Loading page"
      role="status"
    />
  </div>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={`${location.pathname}${location.search}`}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"               element={<Home />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/search"         element={<SearchPage />} />
          <Route path="/search/:query"  element={<SearchPage />} />
          <Route path="/film/:id"       element={<FilmPage />} />
          <Route path="/person/:person_id" element={<Person />} />
          <Route path="/genre/:id"      element={<GenrePage />} />
          <Route path="/compare"        element={<ComparePage />} />

          {/* Protected routes — account-specific data only */}
          <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="*"               element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

/* ── Scroll behaviour for every navigation ──────────────────────
   Must live inside <Router> to read location. Renders nothing.
   <BrowserRouter> keeps the previous page's offset, and React Router's
   own <ScrollRestoration> only ships with data routers.
─────────────────────────────────────────────────────────────── */
const ScrollManager = () => {
  useScrollRestoration();
  return null;
};

function App() {
  return (
    <Router>
      <ScrollManager />
      <Header />
      {/* id="main-content" is the skip-nav target */}
      <main id="main-content">
        <AppRoutes />
      </main>
    </Router>
  );
}

export default App;
