import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

const projects = [
  {
    title: "Stokinventory",
    category: "Web Application",
    description: "A comprehensive inventory management app with real-time analytics, budget planning, and supply chain optimization.",
    tech: ["Laravel", "MySQL"],
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    glowColor: "rgba(99, 102, 241, 0.3)",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  },
  {
    title: "Kerja Aja Dulu",
    category: "Web Application",
    description: "A job portal connecting employers and job seekers with AI-driven matching and interview scheduling.",
    tech: ["Next.js", "Express.js", "MySQL"],
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    glowColor: "rgba(6, 182, 212, 0.3)",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  },
  {
    title: "Willy Wallet",
    category: "Mobile Application",
    description: "A secure mobile wallet app for managing digital assets, with biometric authentication and instant transaction notifications.",
    tech: ["Electron", "TypeScript", "MongoDB"],
    gradient: "linear-gradient(135deg, #ec4899, #be185d)",
    glowColor: "rgba(236, 72, 153, 0.3)",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
  },
  {
    title: "ShopEase API",
    category: "RESTful API",
    description: "High-performance e-commerce backend API handling millions of requests with real-time inventory management.",
    tech: ["Node.js", "PostgreSQL", "Redis"],
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    glowColor: "rgba(245, 158, 11, 0.3)",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
  },
  {
    title: "EduLearn Platform",
    category: "Web Application",
    description: "Interactive e-learning platform with live classes, progress tracking, and AI-powered personalized learning paths.",
    tech: ["React", "Python", "Docker"],
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    glowColor: "rgba(16, 185, 129, 0.3)",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop",
  },
  {
    title: "LogiFlow",
    category: "Mobile App",
    description: "Logistics and delivery tracking app with real-time GPS, route optimization, and automated notifications.",
    tech: ["Flutter", "Go", "Firebase"],
    gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    glowColor: "rgba(244, 63, 94, 0.3)",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=400&fit=crop",
  },
];

const CARD_WIDTH = 400;
const GAP = 24;

function ProjectCard({ project }: { project: typeof projects[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 24,
        background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        transition: "all 0.4s ease",
        overflow: "hidden",
        flexShrink: 0,
        width: CARD_WIDTH,
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: hovered ? `radial-gradient(circle at 50% 0%, ${project.glowColor}, transparent 70%)` : "none",
        transition: "all 0.4s ease",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      <div style={{ position: "relative", overflow: "hidden", height: 200 }}>
        <motion.img
          src={project.image}
          alt={project.title}
          animate={{ scale: hovered ? 1.1 : 1 }}
          transition={{ duration: 0.6 }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(10,10,20,0.9) 0%, transparent 60%)",
        }} />
        <motion.span
          animate={{ y: hovered ? 0 : -10, opacity: hovered ? 1 : 0.8 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            padding: "6px 14px",
            borderRadius: 50,
            background: project.gradient,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {project.category}
        </motion.span>
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "24px 32px 32px" }}>
        <h3 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 12,
        }}>
          {project.title}
        </h3>

        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.7,
          marginBottom: 20,
        }}>
          {project.description}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {project.tech.map((t) => (
            <span
              key={t}
              style={{
                padding: "5px 12px",
                borderRadius: 50,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Portfolio() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const totalScrollWidth = projects.length * (CARD_WIDTH + GAP) - GAP;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const maxTranslate = -(totalScrollWidth - viewportWidth + 120);

  const x = useTransform(scrollYProgress, [0, 1], [0, maxTranslate]);

  return (
    <>
      <section
        id="portfolio"
        style={{
          position: "relative",
          zIndex: 10,
          padding: "100px 14px 0",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
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
            color: "#06b6d4",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 16,
            display: "block",
          }}>
            Our Work
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.2,
            letterSpacing: "-1px",
          }}>
            Featured{" "}
            <span style={{
              background: "linear-gradient(135deg, #06b6d4, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Portfolio
            </span>
          </h2>
        </motion.div>
      </section>

      <section
        ref={sectionRef}
        style={{
          position: "relative",
          zIndex: 10,
          height: `${totalScrollWidth + viewportWidth}px`,
        }}
      >
        <div style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          paddingLeft: 100,
        }}>
          <motion.div
            ref={trackRef}
            style={{
              x,
              display: "flex",
              gap: GAP,
              paddingLeft: 60,
              paddingRight: 150,
              willChange: "transform",
            }}
          >
            {projects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
