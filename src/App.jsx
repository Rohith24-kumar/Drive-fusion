import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Cloud,
  FolderOpen,
  Globe2,
  Link2,
  LockKeyhole,
  Menu,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import referenceImage from "./assets/drivefusion-reference.png";
import AuthPage from "./AuthPage";

const drives = [
  { name: "Google Drive", className: "google", mark: "G" },
  { name: "OneDrive", className: "onedrive", mark: "☁" },
  { name: "Dropbox", className: "dropbox", mark: "◆" },
  { name: "Box", className: "box", mark: "box" },
  { name: "Mega", className: "mega", mark: "M" },
];

const features = [
  {
    icon: Link2,
    title: "Connect Seamlessly",
    text: "Link all your cloud drives and access everything from one place.",
  },
  {
    icon: LayersIcon,
    title: "Manage Effortlessly",
    text: "One interface for your files. No more switching between drives.",
  },
  {
    icon: Share2,
    title: "Share Freely",
    text: "Share files and folders with anyone, securely and simply.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in Control",
    text: "Your data, your drives, completely under your control.",
  },
];

function LayersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 17 8 4 8-4" />
    </svg>
  );
}

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="DriveFusion home">
      <span className="logo-mark">
        <span className="logo-d">D</span>
        <span className="logo-ribbon" />
      </span>
      <span className="logo-text">Drive<span>Fusion</span></span>
    </a>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeSection, setActiveSection] = useState("top");
  const [toast, setToast] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("drivefusion_theme") || "light");
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("drivefusion_user")) || null; } catch { return null; } });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["top", "features", "how-it-works", "security", "about"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("drivefusion_theme", theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#07101f" : "#f7faff");
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openAuth = () => { setMenuOpen(false); setShowAuth(true); };

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (showAuth) return <AuthPage onBack={() => setShowAuth(false)} onAuthenticated={(nextUser) => { setUser(nextUser); setShowAuth(false); setToast(`Welcome back, ${nextUser.fullName}.`); }} />;

  return (
    <div className="app" id="top">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="nav-inner">
          <Logo />

          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            {[
              ["top", "Home"], ["features", "Features"], ["how-it-works", "How It Works"], ["security", "Security"], ["about", "About"]
            ].map(([id, label]) => (
              <button key={id} className={`nav-link ${activeSection === id ? "active" : ""}`} onClick={() => scrollTo(id)}>{label}</button>
            ))}
            <div className="mobile-actions">
              <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button className="btn btn-outline" onClick={openAuth}>Log In</button>
              <button className="btn btn-primary" onClick={() => scrollTo("cta")}>Get Started <ArrowRight size={17} /></button>
            </div>
          </nav>

          <div className="nav-actions">
            <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="login-link" onClick={openAuth}>{user ? user.fullName : "Log In"}</button>
            <button className="btn btn-primary nav-cta" onClick={() => scrollTo("cta")}>
              Get Started <ArrowRight size={17} />
            </button>
          </div>

          <button className="menu-btn" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero section">
          <div className="hero-grid">
            <div className="hero-copy reveal">
              <div className="eyebrow hero-eyebrow">
                <Cloud size={15} />
                All Your Cloud Drives. One Place.
                <span className="live-dot" />
              </div>

              <h1>
                All Your Drives.
                <span>One Smart Home.</span>
              </h1>

              <p className="hero-description">
                Connect multiple cloud drives and manage all your files in one secure place.
                Upload, access and share without limits.
              </p>

              <div className="hero-actions">
                <button className="btn btn-primary btn-large" onClick={() => scrollTo("cta")}>
                  Get Started For Free <ArrowRight size={19} />
                </button>
                <button className="btn btn-outline btn-large" onClick={() => scrollTo("how-it-works")}>
                  <Play size={17} fill="currentColor" /> See How It Works
                </button>
              </div>

              <div className="hero-microstats">
                <span><b>5K+</b> users</span><i />
                <span><b>5</b> cloud providers</span><i />
                <span><b>24/7</b> access</span>
              </div>

              <div className="trust-row">
                <div className="avatar-stack">
                  <span>R</span><span>A</span><span>K</span><span>S</span><b>5K+</b>
                </div>
                <div>
                  <strong>Trusted by 5,000+ users</strong>
                  <small>to simplify their cloud storage</small>
                </div>
              </div>
            </div>

            <div className="hero-visual reveal reveal-delay">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit-dot dot-a" />
              <div className="orbit-dot dot-b" />
              <div className="orbit-dot dot-c" />

              <div className="cloud-stage">
                <div className="stage-glow" />
                <div className="drive-hub">
                  <div className="hub-logo"><span>D</span><i /></div>
                </div>

                {drives.map((drive, i) => (
                  <div
                    key={drive.name}
                    className={`drive-chip ${drive.className} chip-${i + 1}`}
                    title={drive.name}
                  >
                    <span>{drive.mark}</span>
                  </div>
                ))}

                <div className="secure-float">
                  <ShieldCheck size={25} />
                  <div>
                    <strong>Your data is always</strong>
                    <span>safe and private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-strip">
            <div className="strip-item">
              <div className="strip-icon"><LockKeyhole /></div>
              <div><strong>Secure & Private</strong><span>End-to-end protection keeps your data safe.</span></div>
            </div>
            <div className="strip-item">
              <div className="strip-icon"><Globe2 /></div>
              <div><strong>Access Anywhere</strong><span>Your files from any device, anytime.</span></div>
            </div>
            <div className="strip-item">
              <div className="strip-icon"><Share2 /></div>
              <div><strong>Easy Sharing</strong><span>Share files and folders with anyone.</span></div>
            </div>
            <div className="strip-item">
              <div className="strip-icon"><LayersIcon /></div>
              <div><strong>All in One Place</strong><span>Manage every connected drive together.</span></div>
            </div>
          </div>
        </section>

        <section className="section features-section" id="features">
          <div className="section-heading reveal">
            <div className="eyebrow"><Sparkles size={15} /> Built around your files</div>
            <h2>Everything you need.<span>Nothing you don't.</span></h2>
            <p>DriveFusion removes the friction from managing multiple cloud accounts.</p>
          </div>

          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }, index) => (
              <article className="feature-card reveal" style={{ "--delay": `${index * 90}ms` }} key={title}>
                <div className="feature-icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="card-arrow"><ArrowRight size={17} /></div>
              </article>
            ))}
          </div>

          <div className="drive-cloud-row reveal">
            <div className="cloud-row-copy">
              <span className="mini-label">YOUR CLOUD, YOUR WAY</span>
              <h3>Bring all your storage together.</h3>
              <p>Connect the services you already use and stop bouncing between tabs.</p>
            </div>
            <div className="connected-drives">
              {drives.map((drive) => (
                <div className="connected-drive" key={drive.name}>
                  <span className={`mini-drive ${drive.className}`}>{drive.mark}</span>
                  <span>{drive.name}</span>
                  <Check size={15} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section how-section" id="how-it-works">
          <div className="how-visual reveal">
            <div className="window-bar"><span /><span /><span /></div>
            <div className="mock-dashboard">
              <aside>
                <div className="mini-logo"><span>D</span> DriveFusion</div>
                <div className="side-active"><FolderOpen size={15} /> My Files</div>
                <div><Share2 size={15} /> Shared</div>
                <div><Cloud size={15} /> Drives</div>
                <div><LockKeyhole size={15} /> Security</div>
              </aside>
              <div className="dashboard-main">
                <div className="dash-top">
                  <div><span className="tiny">OVERVIEW</span><h4>Your cloud, unified.</h4></div>
                  <button>Upload <UploadCloud size={14} /></button>
                </div>
                <div className="storage-card">
                  <div><span>Storage overview</span><strong>2.46 TB <small>/ 10 TB</small></strong></div>
                  <div className="progress"><i /></div>
                  <div className="storage-meta"><span>24% used</span><span>4 connected drives</span></div>
                </div>
                <div className="file-row">
                  <span className="file-dot blue" /><div><b>Project_Report.pdf</b><small>Google Drive</small></div><span>4.2 MB</span>
                </div>
                <div className="file-row">
                  <span className="file-dot purple" /><div><b>Design_Assets.zip</b><small>Dropbox</small></div><span>120 MB</span>
                </div>
                <div className="file-row">
                  <span className="file-dot green" /><div><b>Holiday_Photos.mp4</b><small>OneDrive</small></div><span>850 MB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="how-copy reveal">
            <div className="eyebrow"><Zap size={15} /> Simple by design</div>
            <h2>One interface.<span>Every drive.</span></h2>
            <p>Connect your accounts once. After that, DriveFusion handles the clutter while you focus on your files.</p>

            <div className="steps">
              <div className="step"><b>01</b><div><h4>Connect</h4><p>Link your existing cloud drives in a few clicks.</p></div></div>
              <div className="step"><b>02</b><div><h4>Organize</h4><p>Browse, search and manage everything from one view.</p></div></div>
              <div className="step"><b>03</b><div><h4>Access</h4><p>Upload, share and access your files without switching services.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section security-section" id="security">
          <div className="security-card reveal">
            <div className="security-copy">
              <div className="eyebrow"><ShieldCheck size={15} /> Security first</div>
              <h2>Your files.<span>Your control.</span></h2>
              <p>DriveFusion is designed around a simple principle: your connected drives remain yours. We provide the unified interface without taking away your control.</p>
              <ul>
                <li><Check /> Secure account connections</li>
                <li><Check /> Privacy-focused architecture</li>
                <li><Check /> Clear storage visibility</li>
                <li><Check /> No hidden storage fees</li>
              </ul>
            </div>
            <div className="security-orb">
              <div className="shield-ring ring-a" />
              <div className="shield-ring ring-b" />
              <div className="shield-center"><ShieldCheck size={65} /></div>
            </div>
          </div>
        </section>

        <section className="section faq-section" id="about">
          <div className="section-heading reveal">
            <div className="eyebrow"><Cloud size={15} /> Questions</div>
            <h2>Good to know.</h2>
            <p>A few quick answers before you bring your drives home.</p>
          </div>

          <div className="faq-list reveal">
            {[
              ["Is DriveFusion free?", "Yes. The core DriveFusion experience is designed to be free to use. There is no pricing section in the product experience."],
              ["Does DriveFusion replace my cloud drives?", "No. Your existing storage providers remain the source of truth. DriveFusion gives you one interface for working with them."],
              ["Can I connect multiple accounts?", "Yes. The product is designed around connecting multiple cloud storage accounts and managing them together."],
              ["Can I access files without opening the original drive?", "Yes. The goal is to make the DriveFusion web interface the primary place to browse and manage your connected files."],
            ].map(([q, a], index) => (
              <div className={`faq-item ${activeFaq === index ? "faq-open" : ""}`} key={q}>
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                  <span>{q}</span><ChevronDown size={20} />
                </button>
                <div className="faq-answer"><p>{a}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="section about-section" aria-label="About DriveFusion">
          <div className="about-card reveal">
            <div>
              <span className="mini-label">WHY DRIVEFUSION</span>
              <h2>Less switching. <span>More doing.</span></h2>
              <p>DriveFusion gives your cloud accounts a single, calm workspace. Find the file, choose the drive, and get on with your day.</p>
            </div>
            <div className="about-metrics">
              <div><strong>01</strong><span>Unified workspace</span></div>
              <div><strong>05</strong><span>Cloud providers</span></div>
              <div><strong>∞</strong><span>Room to scale</span></div>
            </div>
          </div>
        </section>

        <section className="section cta-section" id="cta">
          <div className="cta-card reveal">
            <div className="cta-glow" />
            <div className="eyebrow"><Sparkles size={15} /> Your files, unified</div>
            <h2>Ready to bring your drives <span>home?</span></h2>
            <p>Connect your cloud storage and experience one clean place for everything.</p>
            <button className="btn btn-white btn-large" onClick={openAuth}>
              Get Started For Free <ArrowRight size={18} />
            </button>
          </div>
        </section>

        <section className="login-anchor" id="login">
          <div>
            <span className="mini-label">NEXT STEP</span>
            <h3>Login and connect your first drive.</h3>
          </div>
          <button className="btn btn-primary" onClick={openAuth}>
            Continue to Login <ArrowRight size={17} />
          </button>
        </section>
      </main>

      {toast && <div className="toast" role="status"><Check size={17} /> {toast}<button aria-label="Dismiss" onClick={() => setToast("")}><X size={15} /></button></div>}

      <footer>
        <div className="footer-inner">
          <Logo />
          <p>All your drives. One smart home.</p>
          <div className="footer-links">
            <button onClick={() => scrollTo("features")}>Features</button>
            <button onClick={() => scrollTo("how-it-works")}>How It Works</button>
            <button onClick={() => scrollTo("security")}>Security</button>
            <button onClick={() => scrollTo("about")}>About</button>
          </div>
          <span className="copyright">© 2026 DriveFusion</span>
        </div>
      </footer>
    </div>
  );
}

export default App;