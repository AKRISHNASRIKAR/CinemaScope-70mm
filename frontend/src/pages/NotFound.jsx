import { Link } from "react-router-dom";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";

const NotFound = () => (
  <div className="min-h-screen bg-base text-white flex flex-col">
    <SEO title="Page Not Found" canonicalPath="/404" noIndex />
    <div
      className="flex-1 center-container flex items-center justify-center"
      style={{ paddingTop: "clamp(5rem,10vh,7rem)", paddingBottom: "clamp(3rem,6vh,5rem)" }}
    >
      <div className="max-w-lg text-center">
        <p className="font-mono text-gold uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.55rem,0.9vw,0.7rem)" }}>
          404
        </p>
        <h1 className="mt-3 font-display font-bold text-white tracking-tight" style={{ fontSize: "clamp(2rem,5vw,4rem)" }}>
          Scene Missing
        </h1>
        <p className="mt-4 font-body text-muted" style={{ fontSize: "clamp(0.8rem,1.2vw,0.95rem)" }}>
          The page you opened is not in the current cut.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-card border border-gold/35 bg-gold/10 px-5 py-2.5 font-body font-medium text-gold transition-all duration-normal hover:border-gold/70 hover:bg-gold/15 hover:text-gold-lt"
          style={{ fontSize: "clamp(0.72rem,1vw,0.85rem)" }}
        >
          Back to Home
        </Link>
      </div>
    </div>
    <Footer />
  </div>
);

export default NotFound;
