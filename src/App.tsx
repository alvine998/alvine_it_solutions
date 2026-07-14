import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import "./App.css";

const services = [
  {
    title: "Delivery systems",
    description:
      "Internal platforms, dashboards, and workflow tools that reduce manual work and expose the right signals to your team.",
    points: ["Operations dashboards", "Admin tools", "Approval flows"],
  },
  {
    title: "Public products",
    description:
      "Marketing sites and product frontends designed to explain the offer clearly, load fast, and convert real visitors.",
    points: ["Landing pages", "Product websites", "CMS builds"],
  },
  {
    title: "Mobile and API",
    description:
      "Practical backend and mobile work for products that need secure data exchange, stable integrations, and room to grow.",
    points: ["REST APIs", "Cross-platform apps", "System integration"],
  },
];

const projects = [
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
    name: "Willy Wallet",
    type: "Finance app",
    impact: "Built a sharper mobile experience for balance tracking, transfers, and activity visibility.",
    href: "#contact",
    cta: "Plan finance product",
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
      </div>
    </ReactLenis>
  );
}
