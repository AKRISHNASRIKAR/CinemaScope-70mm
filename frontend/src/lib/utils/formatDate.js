/**
 * Date formatters for TMDB release dates (ISO "YYYY-MM-DD" strings).
 * Both return undefined for missing dates so they can be dropped straight
 * into optional props.
 */

/** "Jul 2010" — the standard film card subtitle. */
export const monthYear = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : undefined;

/** "2010" */
export const year = (dateStr) => (dateStr ? dateStr.slice(0, 4) : undefined);
