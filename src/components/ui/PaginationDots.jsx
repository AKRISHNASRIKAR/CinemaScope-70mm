const PaginationDots = ({ total, current, onChange, dark = true }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-3">
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onChange(i)}
        aria-label={`Page ${i + 1}`}
        className={`
          rounded-circle transition-all duration-normal cursor-pointer border-none
          ${i === current
            ? "w-1 h-4 bg-gold"
            : dark
              ? "w-1 h-1 bg-white/20 hover:bg-white/50"
              : "w-1 h-1 bg-ink/20 hover:bg-ink/50"
          }
        `}
      />
    ))}
  </div>
);

export default PaginationDots;
