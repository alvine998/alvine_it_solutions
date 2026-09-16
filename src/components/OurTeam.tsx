import { useTranslation } from "react-i18next";

const teamKeys = ["alvine", "sarah", "budi", "diana"] as const;

const teamStatic = [
  {
    initials: "AY",
    socials: { linkedin: "https://linkedin.com/in/alvineyoga", github: "https://github.com/alvineyoga", twitter: "https://x.com/alvineyoga" },
  },
  { initials: "SW", socials: null as null | { linkedin: string; github: string; twitter: string } },
  { initials: "BS", socials: null as null | { linkedin: string; github: string; twitter: string } },
  { initials: "DP", socials: null as null | { linkedin: string; github: string; twitter: string } },
];

function TeamCard({ index }: { index: number }) {
  const { t } = useTranslation();
  const key = teamKeys[index];
  const member = teamStatic[index];

  return (
    <div
      style={{
        padding: 32,
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e6e8f0",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 96, height: 96, borderRadius: "50%", margin: "0 auto 22px",
          background: "#eef0ff",
          display: "grid", placeItems: "center",
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 30, color: "#4338ca",
          border: "1px solid #c9cdfc",
        }}
      >
        {member.initials}
      </div>

      <h3 style={{
        fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700,
        color: "#0b1220", margin: "0 0 6px",
      }}>
        {t(`team.members.${key}.name`)}
      </h3>

      <div style={{
        fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500,
        color: "#6b7280", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1.2,
      }}>
        {t(`team.members.${key}.role`)}
      </div>

      <p style={{
        fontFamily: "Inter, sans-serif", fontSize: 14,
        color: "#475569", lineHeight: 1.7, margin: "0 0 20px",
      }}>
        {t(`team.members.${key}.bio`)}
      </p>

      {member.socials ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          {[
            { href: member.socials.linkedin, label: "LinkedIn" },
            { href: member.socials.github, label: "GitHub" },
            { href: member.socials.twitter, label: "X (Twitter)" },
          ].map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${t(`team.members.${key}.name`)} on ${s.label}`}
              style={{
                fontFamily: "DM Mono, monospace", fontSize: 12, color: "#334155",
                padding: "7px 14px", borderRadius: 50,
                background: "#f1f2f7", border: "1px solid #e2e4ee",
                textDecoration: "none",
              }}>
              {s.label}
            </a>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#94a3b8" }}>
          {t("team.profileOnRequest", "Profile & references on discovery call")}
        </div>
      )}
    </div>
  );
}

export default function OurTeam() {
  const { t } = useTranslation();

  return (
    <section id="team" aria-label="Team" style={{ position: "relative", zIndex: 10, padding: "90px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "left", marginBottom: 40, maxWidth: 680 }}>
        <span style={{
          fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, color: "#6b7280",
          textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "block",
        }}>
          {t("team.eyebrow")}
        </span>
        <h2 style={{
          fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(30px, 4.5vw, 46px)",
          fontWeight: 800, color: "#0b1220", lineHeight: 1.2, letterSpacing: "-1px", margin: "0 0 14px",
        }}>
          {t("team.headingPart1")}
          {t("team.headingHighlight")}
          {t("team.headingPart2", "")}
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#475569", margin: 0, lineHeight: 1.7 }}>
          {t("team.intro", "Small senior core team + vetted specialists per project. You always know who writes your code.")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
        {teamKeys.map((_, i) => (
          <TeamCard key={i} index={i} />
        ))}
      </div>
    </section>
  );
}
