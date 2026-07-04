import { Suspense, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, cancelFrame, frame } from "framer-motion";
import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import Scene3D from "./components/Scene3D";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import About from "./components/About";
import OurTeam from "./components/OurTeam";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function LoadingScreen() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#0a0a14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(99, 102, 241, 0.2)",
          borderTopColor: "#6366f1",
        }}
      />
    </div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
        transformOrigin: "0%",
        scaleX,
        zIndex: 1001,
      }}
    />
  );
}

export default function App() {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1 }} ref={lenisRef}>
      <div style={{ background: "#0a0a14", minHeight: "100vh", position: "relative" }}>
        <ScrollProgress />
        <Suspense fallback={<LoadingScreen />}>
          <Scene3D />
        </Suspense>
        <Navbar />
        <main style={{ position: "relative", zIndex: 10 }}>
          <Hero />
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)", margin: "0 auto", maxWidth: 800 }} />
          <Services />
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)", margin: "0 auto", maxWidth: 800 }} />
          <Portfolio />
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.3), transparent)", margin: "0 auto", maxWidth: 800 }} />
          <About />
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), transparent)", margin: "0 auto", maxWidth: 800 }} />
          <OurTeam />
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.3), transparent)", margin: "0 auto", maxWidth: 800 }} />
          <Contact />
        </main>
        <Footer />
      </div>
    </ReactLenis>
  );
}
