import { useId } from "react";

/**
 * The User Story Schneider mark.
 *
 * A "Schneider" is a cutter, and the product cuts one idea into stories — so the
 * mark is one story card cut corner to corner into two pieces that have just
 * slid apart. Teal for the first piece (this product's own colour in the app
 * launcher), AgentiX blue for the second: the product it was cut out of. The
 * dark tile, the lit rim and the glow are the AgentiX mark's, so the two read
 * as one family.
 *
 * Two fat triangles also survive a favicon: at 16px each is still a clear
 * shape, where thin lines and a text row on the card would turn to mud. The
 * geometry is drawn once (PIECE_A, PIECE_B) and also exists as app/icon.svg —
 * change it in both.
 */
export const PIECE_A = "M10.5,10.5 L26,10.5 L10.5,26 Z";
export const PIECE_B = "M29.9,29.9 L14.4,29.9 L29.9,14.4 Z";
const STROKE = 3; // round-joined stroke of the same colour: soft corners, one path each

export function BrandMark({ size = 30 }: { size?: number }) {
  // Several logos on one page (header + a dialog) must not share gradient ids.
  const id = useId().replace(/:/g, "");
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-tile`} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1F2D33" /><stop offset="1" stopColor="#0A0F13" />
        </linearGradient>
        <linearGradient id={`${id}-a`} x1="10" y1="10" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9BF5DC" /><stop offset="1" stopColor="#1FA98A" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="30" y1="14" x2="15" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8FC2FF" /><stop offset="1" stopColor="#2E7BC4" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="20" cy="20" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5EEAC6" stopOpacity="0.40" />
          <stop offset="1" stopColor="#5EEAC6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill={`url(#${id}-tile)`} />
      <rect x="1.6" y="1.6" width="36.8" height="36.8" rx="11.4" fill="none" stroke="rgba(150,230,210,0.26)" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="14" fill={`url(#${id}-glow)`} />
      <path d={PIECE_A} fill={`url(#${id}-a)`} stroke={`url(#${id}-a)`} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d={PIECE_B} fill={`url(#${id}-b)`} stroke={`url(#${id}-b)`} strokeWidth={STROKE} strokeLinejoin="round" />
      {/* The cut itself: a hairline of light between the two pieces. */}
      <path className="brand-mark-cut" d="M28.2,12.3 L12.3,28.2" stroke="#FFFFFF" strokeWidth=".7" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}

/**
 * Mark plus word mark: "AgentiX" large with the product's teal-to-blue
 * gradient, and USER STORY underneath, spread to exactly the width of the name
 * above it.
 *
 * The fit is done by the layout, not by a letter-spacing someone eyeballed: the
 * letters are flex items with `space-between`, so they spread to whatever width
 * the name happens to be (the same trick as AgentiX's logo). The letters are
 * hidden from assistive tech and the words are carried by a visually-hidden
 * span — read letter by letter, "U S E R  S T O R Y" is not the product's name.
 */
export function BrandLogo({ size = 30, as: Tag = "span" }: { size?: number; as?: "span" | "div" }) {
  return (
    <Tag className="brand-logo">
      <BrandMark size={size} />
      <span className="brand-logo-text">
        <span className="name">AgentiX</span>
        <span className="sub">
          <span className="visually-hidden">User Story</span>
          <span className="sub-fit" aria-hidden="true">
            {[..."USER STORY"].map((c, i) => <i key={i}>{c === " " ? " " : c}</i>)}
          </span>
        </span>
      </span>
    </Tag>
  );
}
