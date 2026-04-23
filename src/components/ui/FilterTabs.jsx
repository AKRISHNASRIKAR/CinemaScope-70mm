const TABS = ["FEATURED", "COMING SOON", "IN THEATERS", "OWN IT", "AWARD WINNERS"];

const FilterTabs = ({ active, onChange, dark = true }) => (
  <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-1">
    {TABS.map((tab) => {
      const isActive = active === tab;
      return (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            flex-shrink-0 font-body font-medium text-tag tracking-[0.18em] uppercase
            pb-2 border-b-[1.5px] transition-all duration-fast cursor-pointer
            ${isActive
              ? "text-gold border-gold"
              : dark
                ? "text-white/35 border-transparent hover:text-white/60"
                : "text-ink-muted border-transparent hover:text-ink"
            }
          `}
        >
          {tab}
        </button>
      );
    })}
  </div>
);

export default FilterTabs;
