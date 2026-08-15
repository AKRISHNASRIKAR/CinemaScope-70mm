/**
 * CardBranding — the card's footer chrome: hairline rule, wordmark,
 * and collector serial. Shared by front and back faces.
 */
const CardBranding = ({ theme, cardNo }) => (
  <div style={{ marginTop: "0.75em" }}>
    <div style={{ height: 1, background: theme.ruleColor }} />
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginTop: "0.55em",
      }}
    >
      <span
        style={{
          fontFamily: '"Epilogue", system-ui, sans-serif',
          fontWeight: 800,
          fontSize: "0.42em",
          letterSpacing: "0.32em",
          color: theme.faintColor,
          textTransform: "uppercase",
        }}
      >
        CinemaScope
      </span>
      <span
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.38em",
          letterSpacing: "0.18em",
          color: theme.faintColor,
          textTransform: "uppercase",
        }}
      >
        Collector Card · № {cardNo}
      </span>
    </div>
  </div>
);

export default CardBranding;
