import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/layout/Footer";

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth0();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="font-body text-muted" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)" }}>You are not logged in.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <div className="flex-1 flex items-center justify-center" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>
        <div className="text-center" style={{ padding: "clamp(2rem, 5vw, 4rem)" }}>
          <img
            src={user.picture}
            alt="Profile"
            className="mx-auto rounded-full ring-2 ring-white/10 shadow-card"
            style={{ width: "clamp(5rem, 10vw, 7rem)", height: "clamp(5rem, 10vw, 7rem)" }}
          />
          <h1 className="font-display font-bold text-white mt-6" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}>{user.name}</h1>
          <p className="font-body text-muted mt-2" style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.95rem)" }}>{user.email}</p>

          <div className="flex justify-center mt-10" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
            <button
              onClick={() => navigate("/")}
              className="font-body font-medium text-white bg-white/10 hover:bg-white/20 rounded-card transition-colors duration-normal cursor-pointer"
              style={{ padding: "clamp(0.5rem, 1vh, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)", fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}
            >
              Home
            </button>
            <button
              onClick={() => logout({ returnTo: `${window.location.origin}/` })}
              className="font-body font-medium text-gold border border-gold/40 hover:bg-gold/10 rounded-card transition-colors duration-normal cursor-pointer"
              style={{ padding: "clamp(0.5rem, 1vh, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)", fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
