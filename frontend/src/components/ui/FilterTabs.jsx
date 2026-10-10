const TABS = ["FEATURED", "IN THEATERS", "TOP RATED"];

const FilterTabs = ({ active, onChange, dark = true }) => (
  <div
    className="flex items-center overflow-x-auto scrollbar-hide"
    role="group"
    aria-label="Film filter"
    style={{ gap: "clamp(0.4rem, 1vw, 0.65rem)" }}
  >
    {TABS.map((tab) => {
      const isActive = active === tab;
      return (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          aria-pressed={isActive}
          className={`
            flex-shrink-0 rounded-full border font-body font-semibold tracking-[0.16em] uppercase
            transition-all duration-normal cursor-pointer
            ${isActive
              ? "border-gold bg-gold text-black shadow-[0_0_28px_rgba(201,168,67,0.18)]"
              : dark
                ? "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/25 hover:text-white"
                : "border-black/10 bg-black/[0.035] text-ink-muted hover:border-black/25 hover:text-ink"
            }
          `}
          style={{ fontSize: "clamp(0.52rem, 0.85vw, 0.65rem)", padding: "0.55rem 0.85rem" }}
        >
          {tab}
        </button>
      );
    })}
  </div>
);

export default FilterTabs;
