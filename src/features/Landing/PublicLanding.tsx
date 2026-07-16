import React from 'react';
import {
  ArrowRight,
  Braces,
  Code2,
  Github,
  Layers3,
  Mail,
  Sparkles,
  TerminalSquare,
} from 'lucide-react';
import './PublicLanding.css';

interface PublicLandingProps {
  onEnterWorkspace: () => void;
}

const PublicLanding: React.FC<PublicLandingProps> = ({ onEnterWorkspace }) => {
  return (
    <div className="public-landing">
      <div className="public-landing__ambient" aria-hidden="true">
        <span className="public-landing__orb public-landing__orb--one" />
        <span className="public-landing__orb public-landing__orb--two" />
        <span className="public-landing__grid" />
      </div>

      <header className="public-nav">
        <a className="public-brand" href="#top" aria-label="Porto Code home">
          <span className="public-brand__mark"><Code2 size={21} strokeWidth={1.8} /></span>
          <span>PORTO <strong>CODE</strong></span>
        </a>
        <nav className="public-nav__links" aria-label="Public navigation">
          <a href="#work">Selected work</a>
          <a href="#about">About</a>
          <a href="mailto:hello@nannndev.com">Contact</a>
        </nav>
        <button className="public-nav__enter" onClick={onEnterWorkspace}>
          Open workspace <ArrowRight size={16} />
        </button>
      </header>

      <main id="top">
        <section className="public-hero" aria-labelledby="public-hero-title">
          <div className="public-hero__copy">
            <p className="public-kicker"><span /> Full-stack mobile and web developer</p>
            <h1 id="public-hero-title">I build digital products that feel <em>clear, fast, and alive.</em></h1>
            <p className="public-hero__intro">
              Nandang Eka Prasetya turns product ideas into thoughtful interfaces, reliable systems, and experiences people enjoy using.
            </p>
            <div className="public-hero__actions">
              <button className="public-button public-button--primary" onClick={onEnterWorkspace}>
                Enter Porto Code <ArrowRight size={18} />
              </button>
              <a className="public-button public-button--quiet" href="#work">Explore the work</a>
            </div>
          </div>

          <div className="workspace-window" aria-label="Preview of the Porto Code workspace">
            <div className="workspace-window__bar">
              <span className="workspace-window__lights"><i /><i /><i /></span>
              <span>porto-code / portfolio.tsx</span>
              <span className="workspace-window__status">Live</span>
            </div>
            <div className="workspace-window__body">
              <aside>
                <Braces size={19} />
                <TerminalSquare size={19} />
                <Layers3 size={19} />
              </aside>
              <div className="workspace-window__code" aria-hidden="true">
                <p><b>01</b><span className="code-pink">const</span> developer = {'{'}</p>
                <p><b>02</b>&nbsp;&nbsp;name: <span className="code-green">'Nandang'</span>,</p>
                <p><b>03</b>&nbsp;&nbsp;craft: <span className="code-green">'Full Stack'</span>,</p>
                <p><b>04</b>&nbsp;&nbsp;focus: [<span className="code-green">'Mobile'</span>, <span className="code-green">'Web'</span>],</p>
                <p><b>05</b>&nbsp;&nbsp;available: <span className="code-blue">true</span></p>
                <p><b>06</b>{'};'}</p>
                <div className="workspace-window__result">
                  <Sparkles size={18} />
                  <span><small>Current mode</small> Building useful things</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="public-work" id="work" aria-labelledby="work-title">
          <div className="public-section-heading">
            <p>Selected work</p>
            <h2 id="work-title">Products made to solve real problems.</h2>
          </div>
          <div className="public-work__list">
            <article>
              <span>01</span><div><h3>Nande Studio</h3><p>Digital studio landing experience</p></div><strong>Web design + development</strong>
            </article>
            <article>
              <span>02</span><div><h3>Yubi POS</h3><p>Point of sale for everyday operations</p></div><strong>Product + full stack</strong>
            </article>
            <article>
              <span>03</span><div><h3>Inventory App</h3><p>Simple, accurate stock management</p></div><strong>Mobile + systems</strong>
            </article>
          </div>
        </section>

        <section className="public-about" id="about">
          <div>
            <p className="public-kicker"><span /> Behind the code</p>
            <h2>A portfolio you can explore, not just scroll.</h2>
          </div>
          <div className="public-about__copy">
            <p>Porto Code is an interactive workspace built to show both the finished work and the thinking behind it.</p>
            <button className="public-button public-button--primary" onClick={onEnterWorkspace}>Launch workspace <ArrowRight size={18} /></button>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <span>© 2026 Nandang Eka Prasetya</span>
        <div><a href="https://github.com/nannndev" target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a><a href="mailto:hello@nannndev.com"><Mail size={17} /> Email</a></div>
      </footer>
    </div>
  );
};

export default PublicLanding;
