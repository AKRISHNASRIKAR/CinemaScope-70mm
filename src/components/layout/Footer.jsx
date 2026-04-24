const GITHUB_URL = import.meta.env.VITE_GITHUB_URL || "https://github.com";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-section-dark border-t border-white/[0.06]">
      <div
        className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between"
        style={{ padding: "clamp(1.25rem, 3vh, 2rem) clamp(1.5rem, 4vw, 4rem)" }}
      >
        <p className="font-body text-muted" style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>
          © {year} CinemaScope. Developed by{" "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-gold transition-colors duration-fast"
          >
            @Krishna
          </a>
        </p>
        <p className="font-body text-faint mt-2 sm:mt-0" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)" }}>
          Powered by TMDB API
        </p>
      </div>
    </footer>
  );
};

export default Footer;
