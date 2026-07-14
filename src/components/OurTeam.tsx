import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

const team = [
  {
    name: "Alvine Yoga Pratama",
    role: "Founder & CEO",
    bio: "Visionary leader with 6+ years in software architecture and business strategy.",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    glowColor: "rgba(99, 102, 241, 0.3)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    socials: { linkedin: "#", github: "#", twitter: "#" },
  },
  {
    name: "Sarah Wijaya",
    role: "Lead Designer",
    bio: "Creative designer crafting exceptional user experiences and stunning interfaces.",
    gradient: "linear-gradient(135deg, #ec4899, #be185d)",
    glowColor: "rgba(236, 72, 153, 0.3)",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
    socials: { linkedin: "#", github: "#", twitter: "#" },
  },
  {
    name: "Budi Santoso",
    role: "Senior Developer",
    bio: "Full-stack engineer specializing in scalable backend systems and cloud infrastructure.",
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    glowColor: "rgba(6, 182, 212, 0.3)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
    socials: { linkedin: "#", github: "#", twitter: "#" },
  },
  {
    name: "Diana Putri",
    role: "Mobile Developer",
    bio: "Expert in cross-platform mobile development delivering polished, high-performance apps.",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    glowColor: "rgba(245, 158, 11, 0.3)",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&crop=face",
    socials: { linkedin: "#", github: "#", twitter: "#" },
  },
];

function TeamCard({ member, index }: { member: typeof team[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: 32,
        borderRadius: 24,
        background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        transition: "all 0.4s ease",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: hovered ? `radial-gradient(circle at 50% 0%, ${member.glowColor}, transparent 70%)` : "none",
        transition: "all 0.4s ease",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <motion.div
          animate={{ scale: hovered ? 1.05 : 1 }}
          transition={{ duration: 0.4 }}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            margin: "0 auto 24px",
            padding: 3,
            background: member.gradient,
          }}
        >
          <img
            src={member.avatar}
            alt={member.name}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
              border: "3px solid #0a0a14",
            }}
          />
        </motion.div>

        <h3 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 6,
        }}>
          {member.name}
        </h3>

        <div style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          background: member.gradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: 1.5,
        }}>
          {member.role}
        </div>

        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.7,
          marginBottom: 24,
        }}>
          {member.bio}
        </p>

        <motion.div
          animate={{ opacity: hovered ? 1 : 0.5, y: hovered ? 0 : 5 }}
          transition={{ duration: 0.3 }}
          style={{ display: "flex", justifyContent: "center", gap: 12 }}
        >
          <a href={member.socials.linkedin} style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            transition: "all 0.3s",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href={member.socials.github} style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            transition: "all 0.3s",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a href={member.socials.twitter} style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            transition: "all 0.3s",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function OurTeam() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section
      id="team"
      ref={sectionRef}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <motion.div style={{ y }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "#ec4899",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 16,
            display: "block",
          }}>
            The People
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.2,
            letterSpacing: "-1px",
          }}>
            Our{" "}
            <span style={{
              background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Team
            </span>
          </h2>
        </motion.div>
      </motion.div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 24,
      }}>
        {team.map((member, i) => (
          <TeamCard key={member.name} member={member} index={i} />
        ))}
      </div>
    </section>
  );
}
