import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import {
  ContactIllustration,
  DashboardIllustration,
  MobileApiIllustration,
  ProcessIllustration,
  TeamIllustration,
  WebsiteIllustration,
} from "./illustrations";
import "./App.css";

const services = [
  {
    title: "Delivery systems",
    description:
      "Internal platforms, dashboards, and workflow tools that reduce manual work and expose the right signals to your team.",
    points: ["Operations dashboards", "Admin tools", "Approval flows"],
    Illustration: DashboardIllustration,
  },
  {
    title: "Public products",
    description:
      "Marketing sites and product frontends designed to explain the offer clearly, load fast, and convert real visitors.",
    points: ["Landing pages", "Product websites", "CMS builds"],
    Illustration: WebsiteIllustration,
  },
  {
    title: "Mobile and API",
    description:
      "Practical backend and mobile work for products that need secure data exchange, stable integrations, and room to grow.",
    points: ["REST APIs", "Cross-platform apps", "System integration"],
    Illustration: MobileApiIllustration,
  },
];

const projects = [
  {
    name: "BM Transport Logistik",
    type: "Logistics & transport",
    impact: "Delivered a company platform for PT Berkah Makmur Transport with fleet pricing, service coverage, and 24/7 dispatch contact flows.",
    href: "https://bmtransportlogistik.com",
    cta: "Visit website",
  },
  {
    name: "Goldbricks Realtors",
    type: "Property agency",
    impact: "Built a property platform covering primary and secondary listings, project galleries, and KPR bank partner support.",
    href: "https://goldbricks.co.id",
    cta: "Visit website",
  },
  {
    name: "Stokinventory",
    type: "Retail operations",
    impact: "Turned stock movement, supplier timing, and branch reporting into one daily control room.",
    href: "https://stokinventory.com",
    cta: "Visit website",
  },
  {
    name: "Kerja Aja Dulu",
    type: "Hiring platform",
    impact: "Simplified job discovery, employer posting, and applicant screening for a local recruitment product.",
    href: "https://kerjaajadulu.com",
    cta: "Visit website",
  },
  {
    name: "Kasirin App",
    type: "POS mobile app",
    impact: "Built a modern point-of-sale app for SMEs with fast checkout, stock monitoring, real-time sales reports, and cloud sync.",
    href: "https://play.google.com/store/apps/details?id=com.kasirinku.app&hl=id",
    cta: "View on Play Store",
  },
  {
    name: "Soundcave",
    type: "Music streaming app",
    impact: "Created a licensed music streaming platform with background playback, podcasts, live streaming, and curated playlists for cafes, hotels, and restaurants.",
    href: "https://play.google.com/store/apps/details?id=com.soundcave_app&hl=id",
    cta: "View on Play Store",
  },
  {
    name: "Tokonyang",
    type: "Marketplace app",
    impact: "Developed a classifieds marketplace for buying and selling goods and services across Indonesia, with location-based listings and in-app selling flows.",
    href: "https://play.google.com/store/apps/details?id=com.tokonyang_app&hl=id",
    cta: "View on Play Store",
  },
];

const processSteps = [
  {
    title: "Scope the real bottleneck",
    text: "We start with the operational problem, not a list of fashionable features.",
  },
  {
    title: "Design the working surface",
    text: "We shape interface, information hierarchy, and behavior around the people who use it every day.",
  },
  {
    title: "Build for handoff and growth",
    text: "The result ships cleanly, performs well, and stays understandable after launch.",
  },
];

const team = [
  {
    name: "Product-minded engineering",
    text: "We balance design decisions, frontend polish, and backend practicality in the same conversation.",
  },
  {
    name: "Small-team responsiveness",
    text: "Clients work with a focused delivery team instead of being passed through layers of account management.",
  },
  {
    name: "Calm technical direction",
    text: "We choose stacks for maintainability, fit, and speed of iteration rather than trend value.",
  },
];

const links = [
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "Process", href: "#process" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function useLenisOptions() {
  const reduceMotion = useReducedMotion();

  return reduceMotion
    ? { autoRaf: true, smoothWheel: false, lerp: 1 }
    : { autoRaf: true, lerp: 0.09 };
}

function ScrollMeter() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.2 });

  return <motion.div aria-hidden className="scroll-meter" style={{ scaleX }} />;
}

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <a className="brand" href="#home">
          <span className="brand-mark">A</span>
          <span className="brand-text">Alvine IT Solution</span>
        </a>

        <nav className="nav-desktop" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <a className="nav-cta nav-desktop" href="#contact">
          Start a project
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>

      {open ? (
        <div className="shell mobile-panel">
          <nav className="mobile-nav" aria-label="Mobile">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <a className="nav-cta" href="#contact" onClick={() => setOpen(false)}>
              Start a project
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function Hero() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const boardY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 90]);

  return (
    <section id="home" ref={heroRef} className="hero section">
      <div className="shell hero-grid">
        <div className="hero-copy">
          <motion.p
            className="eyebrow"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Built for companies that need software to actually run the work
          </motion.p>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            We design and ship digital systems with the pace of a delivery team, not a template factory.
          </motion.h1>

          <motion.p
            className="hero-lead"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Alvine IT Solution helps growing businesses launch websites, internal tools, APIs, and mobile products with clear structure, careful interface decisions, and maintainable code.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <a className="button button-primary" href="#work">
              See selected work
            </a>
            <a className="button button-secondary" href="#contact">
              Talk about your project
            </a>
          </motion.div>

          <motion.dl
            className="hero-notes"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div>
              <dt>Focus</dt>
              <dd>Operational software, branded web experiences, and dependable product builds.</dd>
            </div>
            <div>
              <dt>Approach</dt>
              <dd>Compact teams, practical scope, visible progress, and fewer layers between idea and release.</dd>
            </div>
          </motion.dl>
        </div>

        <motion.aside className="hero-board" style={{ y: boardY }}>
          <div className="board-card board-header-card">
            <p>Delivery board</p>
            <strong>Current production rhythm</strong>
          </div>

          <div className="board-columns" aria-label="Project stages overview">
            <div className="board-column">
              <span>Discover</span>
              <article>
                <strong>Field interviews</strong>
                <p>Map what slows the team down before we draw the first screen.</p>
              </article>
            </div>

            <div className="board-column board-column-accent">
              <span>Build</span>
              <article>
                <strong>Design + code in parallel</strong>
                <p>Interface decisions are tested against implementation reality early.</p>
              </article>
            </div>

            <div className="board-column">
              <span>Release</span>
              <article>
                <strong>Handoff with structure</strong>
                <p>Launch notes, next-step backlog, and code that your team can live with.</p>
              </article>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="section">
      <div className="shell">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Services</p>
            <h2>Digital work shaped around operations, not vanity metrics.</h2>
          </div>
          <p>
            We handle the parts of software delivery that most directly affect clarity: what users see, how teams move through work, and how the system stays stable after launch.
          </p>
        </div>

        <div className="service-grid">
          {services.map((service) => (
            <article key={service.title} className="service-card">
              <service.Illustration className="service-illustration" />
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul>
                {service.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work() {
  return (
    <section id="work" className="section work-section">
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">Selected work</p>
          <h2>Projects that solve concrete business problems and still feel considered on screen.</h2>
        </div>

        <div className="work-list">
          {projects.map((project) => (
            <article key={project.name} className="work-card">
              <div>
                <span className="work-type">{project.type}</span>
                <h3>{project.name}</h3>
              </div>
              <div className="work-card-body">
                <p>{project.impact}</p>
                <a
                  className="button button-secondary work-button"
                  href={project.href}
                  target={project.href.startsWith("http") ? "_blank" : undefined}
                  rel={project.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {project.cta}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section id="process" className="section process-section">
      <div className="shell process-grid">
        <div className="section-heading process-copy">
          <p className="eyebrow">Process</p>
          <h2>A delivery pace that stays calm because the structure is clear.</h2>
          <p>
            The signature of this page is the project-board hero: a nod to how this studio works. The rest of the site stays disciplined, with the process section carrying that same operational language into the body of the page.
          </p>
          <ProcessIllustration className="process-illustration" />
        </div>

        <div className="process-steps">
          {processSteps.map((step) => (
            <article key={step.title} className="process-step">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="section">
      <div className="shell about-grid">
        <div className="section-heading about-copy">
          <p className="eyebrow">About</p>
          <h2>Alvine IT Solution works best with teams that care about both the product and the handoff.</h2>
          <p>
            This is a software partner for businesses that need cleaner systems, stronger interfaces, and a build process grounded in real constraints. We focus on what makes the work usable next quarter, not only what looks impressive this week.
          </p>
          <TeamIllustration className="about-illustration" />
        </div>

        <div className="principles-grid">
          {team.map((item) => (
            <article key={item.name} className="principle-card">
              <h3>{item.name}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section contact-section">
      <div className="shell">
        <div className="contact-panel">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Need a landing page, product interface, or internal tool that feels deliberate from day one?</h2>
          </div>

          <div className="contact-actions">
            <ContactIllustration className="contact-illustration" />
            <a className="button button-primary" href="mailto:alvinecom2018@gmail.com">
              Email Alvine IT Solution
            </a>
            <a className="button button-secondary" href="https://wa.me/688293477465">
              Open WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
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

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-shell">
        <p>Alvine IT Solution builds software with a delivery-first mindset.</p>
        <p>{new Date().getFullYear()} - Websites, apps, APIs, and internal systems.</p>
      </div>
    </footer>
  );
}

export default function App() {
  const lenisRef = useRef<LenisRef>(null);
  const options = useLenisOptions();

  useEffect(() => {
    return () => {
      lenisRef.current?.lenis?.destroy();
    };
  }, []);

  return (
    <ReactLenis root options={options} ref={lenisRef}>
      <div className="page-shell">
        <ScrollMeter />
        <Navbar />
        <main>
          <Hero />
          <Services />
          <Work />
          <Process />
          <About />
          <Contact />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </ReactLenis>
  );
}
