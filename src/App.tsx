import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import About from "./components/About";
import OurTeam from "./components/OurTeam";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Scene3D from "./components/Scene3D";

function ScrollMeter() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.2 });

  return <motion.div aria-hidden className="scroll-meter" style={{ scaleX }} />;
}

function WhatsAppButton() {
  return (
    <a
      className="whatsapp-fab"
      href="https://wa.me/6285703049632"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.58-1.67a12.74 12.74 0 0 0 6.22 1.6h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.73-12.81-12.73Zm0 23.36h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.9.99 1.04-3.8-.25-.4a10.55 10.55 0 0 1-1.63-5.64c0-5.87 4.78-10.64 10.65-10.64a10.6 10.6 0 0 1 10.64 10.65c0 5.87-4.78 10.55-10.75 10.55Zm5.84-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}

export default function App() {
  const lenisRef = useRef<LenisRef>(null);

  return (
    <ReactLenis root options={{ autoRaf: true, lerp: 0.09 }} ref={lenisRef}>
      <div style={{ background: "#0a0a14", minHeight: "100vh" }}>
        <Scene3D />
        <ScrollMeter />
        <Navbar />
        <main style={{ position: "relative", zIndex: 10 }}>
          <Hero />
          <Services />
          <Portfolio />
          <About />
          <OurTeam />
          <Contact />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </ReactLenis>
  );
}
