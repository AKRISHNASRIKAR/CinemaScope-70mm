const TABS = ["FEATURED", "IN THEATERS", "TOP RATED"];

const FilterTabs = ({ active, onChange, dark = true }) => (
  <div className="flex items-center overflow-x-auto scrollbar-hide" style={{ gap: "clamp(1rem, 3vw, 2rem)", paddingBottom: "clamp(0.25rem, 0.5vh, 0.5rem)" }}>
    {TABS.map((tab) => {
      const isActive = active === tab;
      return (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            flex-shrink-0 font-body font-medium tracking-[0.18em] uppercase
            pb-[clamp(0.25rem,0.5vh,0.5rem)] border-b-[1.5px] transition-all duration-fast cursor-pointer bg-transparent border-x-0 border-t-0
            ${isActive
              ? "text-gold border-gold"
              : dark
                ? "text-white/35 border-transparent hover:text-white/60"
                : "text-ink-muted border-transparent hover:text-ink"
            }
          `}
          style={{ fontSize: "clamp(0.55rem, 1vw, 0.7rem)" }}
        >
          {tab}
        </button>
      );
    })}
  </div>
);

export default FilterTabs;
