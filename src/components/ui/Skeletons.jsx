import React from "react";

/* ── Base Shimmer ──────────────────────────────────────────────── */
const Shimmer = ({ className = "", style = {} }) => (
  <div 
    className={`skeleton rounded-[inherit] ${className}`} 
    style={{ width: "100%", height: "100%", ...style }} 
  />
);

/* ── Film Detail Hero Skeleton ─────────────────────────────────── */
export const FilmDetailHeroSkeleton = () => (
  <div className="relative w-full overflow-hidden bg-base" style={{ height: "clamp(40vh, 55vh, 65vh)" }}>
    <Shimmer className="absolute inset-0" />
    <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
  </div>
);

/* ── Cast Section Skeleton ─────────────────────────────────────── */
export const CastSectionSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mt-12 pb-12">
    <div className="bg-[#0c0c0c] rounded-card p-10">
      <div className="h-8 w-24 bg-white/5 rounded mx-auto mb-12" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-full max-w-[140px] aspect-[3/4.5] bg-white/95 p-2 pb-6 rounded-sm shadow-lg">
            <Shimmer className="rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Film Row Skeleton (reused portrait strip) ─────────────────── */
export const FilmRowSkeleton = ({ count = 5 }) => (
  <div className="flex gap-5 overflow-hidden py-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex-shrink-0 w-[clamp(130px, 18vw, 200px)] flex flex-col">
        <div className="aspect-[2/3] rounded-card bg-white/5 mb-3">
          <Shimmer />
        </div>
        <div className="h-3 w-3/4 bg-white/5 rounded mb-2" />
        <div className="h-2 w-1/2 bg-white/5 rounded" />
      </div>
    ))}
  </div>
);

/* ── Person Header Skeleton ────────────────────────────────────── */
export const PersonHeaderSkeleton = () => (
  <div className="max-w-screen-xl mx-auto px-6 lg:px-16 pt-24">
    <div className="flex flex-col sm:flex-row gap-12">
      <div className="sm:w-[35%] aspect-[2/3] rounded-lg bg-white/5">
        <Shimmer />
      </div>
      <div className="flex-1 space-y-6">
        <div className="h-12 w-3/4 bg-white/5 rounded" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-2/3 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  </div>
);

/* ── Film Grid Skeleton ────────────────────────────────────────── */
export const FilmGridSkeleton = ({ count = 12 }) => (
  <div 
    className="grid" 
    style={{ 
      gridTemplateColumns: "repeat(auto-fill, minmax(clamp(130px, 18vw, 200px), 1fr))",
      gap: "clamp(0.75rem, 2vw, 1.5rem)" 
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col">
        <div className="aspect-[2/3] rounded-card bg-white/5 mb-3">
          <Shimmer />
        </div>
        <div className="h-3 w-3/4 bg-white/5 rounded mb-2" />
        <div className="h-2 w-1/2 bg-white/5 rounded" />
      </div>
    ))}
  </div>
);
