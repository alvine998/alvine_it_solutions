type IllustrationProps = {
  className?: string;
};

const ink = "#132626";
const green = "#1c6b5d";
const greenDark = "#104d45";
const orange = "#edb15a";
const paper = "#fffdf7";
const mint = "#dfeee5";

/** Dashboard / internal tools illustration */
export function DashboardIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 120 90" fill="none" role="img" aria-label="Dashboard illustration">
      <rect x="8" y="10" width="96" height="66" rx="6" fill={paper} stroke={ink} strokeWidth="2" />
      <rect x="12" y="14" width="88" height="10" rx="3" fill={mint} />
      <circle cx="18" cy="19" r="2.4" fill={orange} />
      <circle cx="26" cy="19" r="2.4" fill={green} />
      <rect x="14" y="30" width="26" height="18" rx="3" fill={green} />
      <rect x="44" y="30" width="26" height="18" rx="3" fill={mint} stroke={green} strokeWidth="1.5" />
      <rect x="74" y="30" width="22" height="18" rx="3" fill={orange} />
      <path d="M16 66 L28 56 L40 62 L54 50 L68 58 L82 46 L96 52" stroke={greenDark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="100" y="70" width="14" height="14" rx="3" fill={orange} stroke={ink} strokeWidth="2" />
      <path d="M104 77 L106.5 79.5 L110.5 74.5" stroke={ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Public websites / product illustration */
export function WebsiteIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 120 90" fill="none" role="img" aria-label="Website illustration">
      <rect x="14" y="12" width="84" height="60" rx="6" fill={paper} stroke={ink} strokeWidth="2" />
      <rect x="18" y="16" width="76" height="9" rx="3" fill={mint} />
      <rect x="22" y="19" width="30" height="3" rx="1.5" fill={green} />
      <rect x="18" y="30" width="44" height="7" rx="2" fill={greenDark} />
      <rect x="18" y="41" width="34" height="4" rx="2" fill={mint} stroke={green} strokeWidth="1" />
      <rect x="18" y="49" width="28" height="4" rx="2" fill={mint} stroke={green} strokeWidth="1" />
      <rect x="18" y="58" width="22" height="8" rx="3" fill={orange} />
      <circle cx="80" cy="48" r="14" fill={green} />
      <path d="M74 48 L79 53 L87 43" stroke={paper} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="92" y="62" width="16" height="16" rx="4" fill={orange} stroke={ink} strokeWidth="2" transform="rotate(8 100 70)" />
    </svg>
  );
}

/** Mobile + API illustration */
export function MobileApiIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 120 90" fill="none" role="img" aria-label="Mobile and API illustration">
      <rect x="20" y="10" width="34" height="64" rx="7" fill={paper} stroke={ink} strokeWidth="2" />
      <rect x="25" y="18" width="24" height="7" rx="2" fill={green} />
      <rect x="25" y="29" width="24" height="16" rx="2" fill={mint} stroke={green} strokeWidth="1.2" />
      <rect x="25" y="49" width="16" height="4" rx="2" fill={orange} />
      <circle cx="37" cy="66" r="3" fill={mint} stroke={green} strokeWidth="1.2" />
      <path d="M58 34 H72 M72 34 L68 30 M72 34 L68 38" stroke={greenDark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M72 54 H58 M58 54 L62 50 M58 54 L62 58" stroke={orange} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="76" y="24" width="30" height="40" rx="5" fill={greenDark} />
      <rect x="81" y="31" width="20" height="4" rx="2" fill="#8fbcb2" />
      <rect x="81" y="39" width="14" height="4" rx="2" fill={orange} />
      <rect x="81" y="47" width="18" height="4" rx="2" fill="#8fbcb2" />
      <circle cx="102" cy="20" r="6" fill={orange} stroke={ink} strokeWidth="2" />
    </svg>
  );
}

/** Process / blueprint illustration for the process section */
export function ProcessIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 260 200" fill="none" role="img" aria-label="Process blueprint illustration">
      <rect x="18" y="22" width="176" height="128" rx="10" fill={paper} stroke={ink} strokeWidth="2.5" />
      <rect x="18" y="22" width="176" height="24" rx="10" fill={ink} />
      <rect x="18" y="36" width="176" height="10" fill={ink} />
      <circle cx="32" cy="34" r="3.4" fill={orange} />
      <circle cx="44" cy="34" r="3.4" fill={green} />
      <circle cx="56" cy="34" r="3.4" fill={mint} />
      <rect x="32" y="58" width="42" height="30" rx="4" fill={mint} stroke={green} strokeWidth="1.6" />
      <rect x="86" y="58" width="42" height="30" rx="4" fill={green} />
      <rect x="140" y="58" width="42" height="30" rx="4" fill={mint} stroke={green} strokeWidth="1.6" />
      <path d="M74 73 H86 M128 73 H140" stroke={greenDark} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="32" y="100" width="66" height="6" rx="3" fill={mint} stroke={green} strokeWidth="1" />
      <rect x="32" y="112" width="88" height="6" rx="3" fill={mint} stroke={green} strokeWidth="1" />
      <rect x="32" y="124" width="50" height="6" rx="3" fill={orange} />
      <rect x="150" y="106" width="72" height="60" rx="8" fill={greenDark} stroke={ink} strokeWidth="2.5" />
      <path d="M162 136 L174 148 L210 120" stroke={orange} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="216" cy="52" r="18" fill={orange} stroke={ink} strokeWidth="2.5" />
      <path d="M216 42 V52 L223 57" stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 172 H140" stroke={ink} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 8" />
    </svg>
  );
}

/** Team / collaboration illustration for the about section */
export function TeamIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 260 160" fill="none" role="img" aria-label="Team collaboration illustration">
      <rect x="30" y="96" width="200" height="14" rx="7" fill={ink} />
      <rect x="46" y="110" width="8" height="34" fill={ink} />
      <rect x="206" y="110" width="8" height="34" fill={ink} />
      {/* left person */}
      <circle cx="74" cy="52" r="14" fill={green} />
      <path d="M54 96 C54 78 94 78 94 96 Z" fill={green} />
      {/* middle person */}
      <circle cx="130" cy="44" r="16" fill={orange} stroke={ink} strokeWidth="2" />
      <path d="M106 96 C106 74 154 74 154 96 Z" fill={orange} stroke={ink} strokeWidth="2" />
      {/* right person */}
      <circle cx="186" cy="52" r="14" fill={greenDark} />
      <path d="M166 96 C166 78 206 78 206 96 Z" fill={greenDark} />
      {/* laptop on table */}
      <rect x="118" y="84" width="26" height="14" rx="2" fill={paper} stroke={ink} strokeWidth="2" />
      {/* chat bubbles */}
      <rect x="52" y="10" width="42" height="20" rx="10" fill={paper} stroke={ink} strokeWidth="2" />
      <circle cx="66" cy="20" r="2.4" fill={green} />
      <circle cx="74" cy="20" r="2.4" fill={green} />
      <circle cx="82" cy="20" r="2.4" fill={green} />
      <rect x="168" y="12" width="40" height="18" rx="9" fill={green} />
      <path d="M178 21 L182 25 L190 16" stroke={paper} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Paper plane illustration for the contact panel */
export function ContactIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 140" fill="none" role="img" aria-label="Contact illustration">
      <path d="M22 96 C50 84 80 60 108 52" stroke={orange} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 9" />
      <path d="M108 52 L172 26 L140 88 L124 66 Z" fill={orange} stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M172 26 L124 66 L126 92 L140 88" fill="#d99b3f" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="42" cy="40" r="5" fill="none" stroke="#6e8782" strokeWidth="2" />
      <circle cx="70" cy="118" r="4" fill="none" stroke="#6e8782" strokeWidth="2" />
      <path d="M160 108 L166 114 M166 108 L160 114" stroke="#6e8782" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
