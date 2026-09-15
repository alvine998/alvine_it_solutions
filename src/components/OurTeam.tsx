import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

const teamKeys = ["alvine", "sarah", "budi", "diana"] as const;

const teamStatic = [
  {
    initials: "AY",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    socials: { linkedin: "https://linkedin.com/in/alvineyoga", github: "https://github.com/alvineyoga", twitter: "https://x.com/alvineyoga" },
  },
  {
    initials: "SW",
    gradient: "linear-gradient(135deg, #ec4899, #be185d)",
    socials: null as null | { linkedin: string; github: string; twitter: string },
  },
  {
    initials: "BS",
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    socials: null as null | { linkedin: string; github: string; twitter: string },
  },
  {
    initials: "DP",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    socials: null as null | { linkedin: string; github: string; twitter: string },
  },
];

function TeamCard({ index }: { index: number }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const key = teamKeys[index];
  const member = teamStatic[index];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      style={{
        position: "relative",
        padding: 32,
        borderRadius: 20,
        background: "#ffffff",
        border: "1px solid #e6e8f0",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 104, height: 104, borderRadius: "50%", margin: "0 auto 22px",
          padding: 3, background: member.gradient,
        }}
      >
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "#eef0ff", display: "grid", placeItems: "center",
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 32, color: "#4338ca",
          border: "3px solid #ffffff",
        }}>
          {member.initials}
        </div>
      </div>

      <h3 style={{
        fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700,
        color: "#0b1220", margin: "0 0 6px",
      }}>
        {t(`team.members.${key}.name`)}
      </h3>

      <div style={{
        fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 700,
        color: "#4f46e5", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1.2,
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
    </motion.div>
  );
}

export default function OurTeam() {
  const { t } = useTranslation();

  return (
    <section id="team" aria-label="Team" style={{ position: "relative", zIndex: 10, padding: "90px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <span style={{
          fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#be185d",
          textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 14, display: "block",
        }}>
          {t("team.eyebrow")}
        </span>
        <h2 style={{
          fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(30px, 4.5vw, 46px)",
          fontWeight: 800, color: "#0b1220", lineHeight: 1.2, letterSpacing: "-1px", margin: "0 0 14px",
        }}>
          {t("team.headingPart1")}
          <span style={{ color: "#4f46e5" }}>
            {t("team.headingHighlight")}
          </span>
          {t("team.headingPart2", "")}
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#475569", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
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
