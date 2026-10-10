import { Link } from "react-router-dom";
import SEO from "@/components/seo/SEO";

const NotFound = () => (
  <section
    className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f3] text-black"
    aria-labelledby="not-found-title"
  >
    <SEO title="Page Not Found" canonicalPath="/404" noIndex />

    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.028]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "180px 180px",
      }}
    />

    <div
      className="relative grid w-full max-w-[80rem] items-center px-4"
      style={{
        gridTemplateColumns: "minmax(0, 0.68fr) minmax(clamp(8.75rem, 24vw, 24.5rem), 0.9fr) minmax(0, 0.68fr)",
        gap: "clamp(0.2rem, 2vw, 1.5rem)",
      }}
    >
      <span
        aria-hidden
        className="select-none text-center font-wordmark font-black leading-none"
        style={{ fontSize: "clamp(7.8rem, 30vw, 29rem)", letterSpacing: "-0.09em" }}
      >
        4
      </span>

      <div
        className="relative flex items-center justify-center bg-black text-white"
        style={{
          minHeight: "clamp(9rem, 28vw, 26rem)",
          borderRadius: "clamp(3.2rem, 7vw, 7rem)",
          boxShadow: "0 26px 80px rgba(0,0,0,0.14)",
        }}
      >
        <div
          className="text-left"
          style={{
            width: "min(70%, 18rem)",
            transform: "translateY(4%)",
          }}
        >
          <h1
            id="not-found-title"
            className="font-body font-black uppercase leading-tight text-white"
            style={{ fontSize: "clamp(0.58rem, 0.95vw, 0.86rem)", letterSpacing: "-0.01em" }}
          >
            Oops something went wrong
          </h1>
          <Link
            to="/"
            className="mt-1 inline-block font-body font-semibold text-white/92 transition-colors duration-fast hover:text-gold focus-visible:text-gold"
            style={{ fontSize: "clamp(0.58rem, 0.95vw, 0.86rem)" }}
          >
            Back to Home ↗
          </Link>
        </div>
      </div>

      <span
        aria-hidden
        className="select-none text-center font-wordmark font-black leading-none"
        style={{ fontSize: "clamp(7.8rem, 30vw, 29rem)", letterSpacing: "-0.09em" }}
      >
        4
      </span>
    </div>
  </section>
);

export default NotFound;
