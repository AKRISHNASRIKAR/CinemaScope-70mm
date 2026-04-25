import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import Home from "@/pages/Home";
import LoginPage from "@/pages/LoginPage";
import Header from "@/components/layout/Navbar";
import Profile from "@/pages/Profile";
import FilmPage from "@/pages/FilmPage";
import SearchPage from "@/pages/SearchPage";
import Person from "@/pages/Person";
import GenrePage from "@/pages/GenrePage";

const ProtectedRoute = ({ component, ...args }) => {
  const Component = withAuthenticationRequired(component, args);
  return <Component />;
};

function App() {
  return (
    <Router>
      <Header /> {/* Includes Header in every page, persistent */}
      <Routes>
        <Route path="/" element={<ProtectedRoute component={Home} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={<ProtectedRoute component={Profile} />}
        />
        <Route
          path="/film/:id"
          element={<ProtectedRoute component={FilmPage} />}
        />{" "}
        {/* FilmPage route */}
        <Route
          path="/person/:person_id"
          element={<ProtectedRoute component={Person} />}
        />{" "}
        {/* Person route */}
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search/:query" element={<SearchPage />} />
        <Route
          path="/genre/:id"
          element={<ProtectedRoute component={GenrePage} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
