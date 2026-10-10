import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, matchPath, useLocation } from "react-router-dom";
import Header from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/ui/ProtectedRoute";
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

const HEADER_ROUTE_PATTERNS = [
  "/",
  "/login",
  "/search",
  "/search/:query",
  "/film/:id",
  "/person/:person_id",
  "/genre/:id",
  "/profile",
  "/compare",
];

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

/* ── Scroll behaviour for every navigation ──────────────────────
   Must live inside <Router> to read location. Renders nothing.
─────────────────────────────────────────────────────────────── */
const ScrollManager = () => {
  useScrollRestoration();
  return null;
};

const shouldShowHeader = (pathname) =>
  HEADER_ROUTE_PATTERNS.some((path) => matchPath({ path, end: true }, pathname));

const AppShell = () => {
  const location = useLocation();
  const showHeader = shouldShowHeader(location.pathname);

  return (
    <>
      <ScrollManager />
      {showHeader && <Header />}
      {/* id="main-content" is the skip-nav target */}
      <main id="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes — browsing never requires an account */}
            <Route path="/"               element={<Home />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/search"         element={<SearchPage />} />
            <Route path="/search/:query"  element={<SearchPage />} />
            <Route path="/film/:id"       element={<FilmPage />} />
            <Route path="/person/:person_id" element={<Person />} />
            <Route path="/genre/:id"      element={<GenrePage />} />

            {/* Protected routes — user-specific, require authentication */}
            <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/compare"        element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />

            <Route path="*"               element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
