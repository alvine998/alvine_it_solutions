import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Contact() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section
      id="contact"
      ref={sectionRef}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <motion.div
        style={{ y }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            textAlign: "center",
            padding: "80px 48px",
            borderRadius: 32,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 50%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 32px",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>

            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              letterSpacing: "-1px",
              marginBottom: 16,
            }}>
              Let's Build Something{" "}
              <span style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Amazing
              </span>
            </h2>

            <p style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              maxWidth: 500,
              margin: "0 auto 40px",
            }}>
              Ready to transform your idea into reality? Let's discuss your project 
              and create something extraordinary together.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.a
                href="mailto:hello@alvineit.com"
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  textDecoration: "none",
                  padding: "16px 40px",
                  borderRadius: 50,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Get In Touch
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  textDecoration: "none",
                  padding: "16px 40px",
                  borderRadius: 50,
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Schedule a Call
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
