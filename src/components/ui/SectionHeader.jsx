/**
 * SectionHeader — the one heading treatment used by every content section.
 *
 * Props:
 *   eyebrow   — small gold mono label above the title (optional)
 *   title     — section title (display font)
 *   count     — muted mono string rendered next to the title (optional)
 *   action    — node rendered on the trailing edge (button / link, optional)
 *   dark      — false on light genre sections, flips text colours
 *   onTitleClick — makes the title interactive (adds hover + keyboard support)
 *   divider   — draws the hairline rule under the header (default true)
 */
const SectionHeader = ({
  eyebrow,
  title,
  count,
  action,
  dark = true,
  onTitleClick,
  divider = true,
}) => {
  const titleColor = dark ? "text-white" : "text-ink";
  const mutedColor = dark ? "text-muted" : "text-ink-muted";

  const titleNode = (
    <h2
      className={`font-display font-bold leading-tight tracking-tight ${titleColor} ${
        onTitleClick ? "cursor-pointer transition-colors duration-fast hover:text-gold" : ""
      }`}
      style={{ fontSize: "clamp(1.1rem, 2vw, 1.6rem)" }}
      {...(onTitleClick
        ? {
            role: "button",
            tabIndex: 0,
            onClick: onTitleClick,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTitleClick();
              }
            },
          }
        : {})}
    >
      {title}
    </h2>
  );

  return (
    <div
      className={`flex items-baseline justify-between flex-wrap ${
        divider ? (dark ? "border-b border-white/[0.08]" : "border-b border-black/10") : ""
      }`}
      style={{
        gap: "clamp(0.5rem, 1.5vw, 1rem)",
        paddingBottom: divider ? "clamp(0.5rem, 1vh, 0.75rem)" : 0,
        marginBottom: "clamp(0.85rem, 1.8vh, 1.25rem)",
      }}
    >
      <div className="flex items-baseline flex-wrap" style={{ gap: "clamp(0.4rem, 1vw, 0.75rem)", minWidth: 0 }}>
        {eyebrow && (
          <p
            className="font-mono text-gold uppercase w-full"
            style={{ fontSize: "clamp(0.45rem, 0.75vw, 0.6rem)", letterSpacing: "0.32em" }}
          >
            {eyebrow}
          </p>
        )}
        {titleNode}
        {count && (
          <span className={`font-mono ${mutedColor}`} style={{ fontSize: "clamp(0.55rem, 0.85vw, 0.7rem)" }}>
            {count}
          </span>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeader;
