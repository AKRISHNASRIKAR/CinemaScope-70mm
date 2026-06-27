import { Link } from "react-router-dom";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LazyImage from "@/components/ui/LazyImage";
import { profileUrl } from "@/lib/utils/tmdbImage";

const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 1.5, -1, 2.5, -3, 0.5];

const PersonCard = ({
  person,
  subtitle,
  index = 0,
  imageSize = "w200",
  deferImage = false,
  className = "",
}) => {
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const image = person?.profile_path ? profileUrl(person.profile_path, imageSize) : null;
  const name = person?.name || "Unknown person";

  return (
    <Link
      to={`/person/${person.id}`}
      aria-label={`View ${name}${subtitle ? `, ${subtitle}` : ""}`}
      className={`group block w-full max-w-[clamp(110px,14vw,160px)] mx-auto focus-ring ${className}`}
      style={{ "--card-rotation": `${rotation}deg` }}
    >
      <div
        className="polaroid-card bg-white/95 flex flex-col"
        style={{
          padding: "clamp(6px,0.8vw,10px) clamp(6px,0.8vw,10px) clamp(18px,2.5vw,28px)",
          boxShadow: "3px 4px 14px rgba(0,0,0,0.35)",
          borderRadius: "2px",
        }}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ borderRadius: "1px" }}>
          {deferImage ? (
            <div className="skeleton w-full h-full" aria-hidden />
          ) : image ? (
            <LazyImage
              src={image}
              alt={`${name} portrait`}
              fallbackType="person"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <PersonOutlineIcon sx={{ fontSize: "clamp(1.5rem,3vw,2rem)", color: "rgba(17,17,17,0.35)" }} />
            </div>
          )}
        </div>
        <div style={{ paddingTop: "clamp(6px,0.8vw,10px)" }}>
          <p className="font-mono font-medium text-ink uppercase leading-tight line-clamp-1" style={{ fontSize: "clamp(0.45rem,0.7vw,0.6rem)", letterSpacing: "0.08em" }}>
            {name}
          </p>
          {subtitle && (
            <p className="font-body text-ink-muted leading-tight line-clamp-1" style={{ fontSize: "clamp(0.4rem,0.6vw,0.5rem)", marginTop: "2px" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PersonCard;
