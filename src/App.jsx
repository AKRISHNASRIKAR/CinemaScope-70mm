import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/ui/ProtectedRoute";

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

function App() {
  return (
    <Router>
      <Header />
      {/* id="main-content" is the skip-nav target */}
      <main id="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/"               element={<Home />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/search"         element={<SearchPage />} />
            <Route path="/search/:query"  element={<SearchPage />} />
            
            {/* Protected routes — require authentication */}
            <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/film/:id"       element={<ProtectedRoute><FilmPage /></ProtectedRoute>} />
            <Route path="/person/:person_id" element={<ProtectedRoute><Person /></ProtectedRoute>} />
            <Route path="/genre/:id"      element={<ProtectedRoute><GenrePage /></ProtectedRoute>} />
            <Route path="/compare"        element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
}

export default App;
