import React, { useMemo, useState } from 'react';
import { Blend, Check, Copy, Droplets, Gauge, Sparkles, TextCursorInput, WandSparkles } from 'lucide-react';

type ToolId = 'gradient' | 'glass' | 'motion' | 'text';

const copyText = async (value: string, onDone: () => void) => {
  await navigator.clipboard.writeText(value);
  onDone();
  window.setTimeout(() => onDone(), 1400);
};

const PlaygroundView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolId>('gradient');
  const [copied, setCopied] = useState(false);
  const [colorA, setColorA] = useState('#5de0ff');
  const [colorB, setColorB] = useState('#7c5cff');
  const [angle, setAngle] = useState(135);
  const [blur, setBlur] = useState(30);
  const [opacity, setOpacity] = useState(28);
  const [radius, setRadius] = useState(28);
  const [speed, setSpeed] = useState(3.2);
  const [bounce, setBounce] = useState(26);
  const [text, setText] = useState('Build interfaces that feel calm, clear, and alive.');

  const gradientCss = `linear-gradient(${angle}deg, ${colorA}, ${colorB})`;
  const glassCss = `background: rgba(255, 255, 255, ${opacity / 100});\nbackdrop-filter: blur(${blur}px) saturate(160%);\nborder-radius: ${radius}px;\nborder: 1px solid rgba(255, 255, 255, 0.25);`;

  const tools = useMemo(() => [
    { id: 'gradient' as ToolId, label: 'Gradient', icon: Blend, hint: 'Mix color' },
    { id: 'glass' as ToolId, label: 'Glass Lab', icon: Droplets, hint: 'Tune material' },
    { id: 'motion' as ToolId, label: 'Motion Orb', icon: Gauge, hint: 'Shape motion' },
    { id: 'text' as ToolId, label: 'Text Utility', icon: TextCursorInput, hint: 'Transform copy' },
  ], []);

  const markCopied = () => setCopied(value => !value);

  return (
    <div className="playground-view h-full overflow-auto bg-[var(--editor-background)] text-[var(--editor-foreground)]">
      <div className="playground-glow" aria-hidden="true" />
      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[.22em] text-[var(--text-accent)]"><Sparkles size={14} /> Interactive instruments</div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-.05em] mt-2">Play with the details.</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xl">Small visual tools for exploring color, glass, motion, and copy—directly inside the workspace.</p>
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">04 TOOLS · LIVE OUTPUT</div>
        </header>

        <nav className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5" aria-label="Playground tools">
          {tools.map(tool => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`playground-tool-tab text-left p-3 rounded-2xl border transition-all ${activeTool === tool.id ? 'active border-[var(--focus-border)]/50' : 'border-[var(--border-color)] hover:border-[var(--text-muted)]/50'}`}>
              <tool.icon size={18} className={activeTool === tool.id ? 'text-[var(--text-accent)]' : 'text-[var(--text-muted)]'} />
              <span className="block text-xs font-bold mt-2">{tool.label}</span>
              <span className="block text-[9px] font-mono text-[var(--text-muted)] mt-0.5">{tool.hint}</span>
            </button>
          ))}
        </nav>

        <section className="playground-panel rounded-[28px] border border-[var(--border-color)] overflow-hidden">
          {activeTool === 'gradient' && (
            <div className="grid lg:grid-cols-[.72fr_1.28fr] min-h-[430px]">
              <div className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] space-y-6">
                <ToolHeading icon={Blend} title="Gradient mixer" description="Blend two colors and rotate the light direction." />
                <ColorControl label="Start color" value={colorA} onChange={setColorA} />
                <ColorControl label="End color" value={colorB} onChange={setColorB} />
                <RangeControl label="Angle" value={angle} min={0} max={360} suffix="°" onChange={setAngle} />
                <CopyButton copied={copied} onClick={() => copyText(`background: ${gradientCss};`, markCopied)} />
              </div>
              <div className="p-5 sm:p-8 min-h-[320px] flex items-center justify-center" style={{ background: gradientCss }}>
                <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-[34%] bg-white/15 border border-white/35 backdrop-blur-xl shadow-[0_30px_80px_rgba(12,20,60,.28)] animate-[playgroundFloat_5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {activeTool === 'glass' && (
            <div className="grid lg:grid-cols-[.72fr_1.28fr] min-h-[430px]">
              <div className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] space-y-6">
                <ToolHeading icon={Droplets} title="Liquid Glass Lab" description="Tune transparency, blur, and corner tension." />
                <RangeControl label="Background blur" value={blur} min={0} max={64} suffix="px" onChange={setBlur} />
                <RangeControl label="Transparency" value={opacity} min={8} max={60} suffix="%" onChange={setOpacity} />
                <RangeControl label="Corner radius" value={radius} min={8} max={48} suffix="px" onChange={setRadius} />
                <CopyButton copied={copied} onClick={() => copyText(glassCss, markCopied)} />
              </div>
              <div className="playground-glass-stage p-8 flex items-center justify-center min-h-[320px]">
                <div className="w-full max-w-sm p-6 border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_28px_70px_rgba(0,0,0,.25)]" style={{ background: `rgba(255,255,255,${opacity / 100})`, backdropFilter: `blur(${blur}px) saturate(160%)`, borderRadius: radius }}>
                  <WandSparkles className="text-white" />
                  <p className="text-white text-xl font-bold mt-10">Material, not decoration.</p>
                  <p className="text-white/70 text-xs mt-2">The backdrop shapes the glass.</p>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'motion' && (
            <div className="grid lg:grid-cols-[.72fr_1.28fr] min-h-[430px]">
              <div className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] space-y-6">
                <ToolHeading icon={Gauge} title="Motion Orb" description="Slow it down, tighten the bounce, find the satisfying point." />
                <RangeControl label="Cycle speed" value={speed} min={1} max={8} step={0.1} suffix="s" onChange={setSpeed} />
                <RangeControl label="Travel" value={bounce} min={8} max={70} suffix="px" onChange={setBounce} />
                <p className="text-[10px] font-mono text-[var(--text-muted)]">Motion respects reduced-motion preferences.</p>
              </div>
              <div className="playground-motion-stage min-h-[320px] flex items-center justify-center overflow-hidden">
                <div className="motion-orb" style={{ '--orb-speed': `${speed}s`, '--orb-distance': `${bounce}px` } as React.CSSProperties} />
              </div>
            </div>
          )}

          {activeTool === 'text' && (
            <div className="grid lg:grid-cols-2 min-h-[430px]">
              <div className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-[var(--border-color)]">
                <ToolHeading icon={TextCursorInput} title="Text utility" description="Inspect and transform interface copy quickly." />
                <textarea value={text} onChange={event => setText(event.target.value)} className="w-full h-44 mt-6 p-4 rounded-2xl bg-black/15 border border-[var(--border-color)] outline-none focus:border-[var(--focus-border)] resize-none text-sm leading-relaxed" />
                <div className="flex gap-2 mt-3"><button onClick={() => setText(text.toUpperCase())} className="utility-button">UPPERCASE</button><button onClick={() => setText(text.toLowerCase())} className="utility-button">lowercase</button><button onClick={() => setText(text.replace(/\s+/g, ' ').trim())} className="utility-button">Clean spaces</button></div>
              </div>
              <div className="p-5 sm:p-7 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2"><Stat label="Characters" value={text.length} /><Stat label="Words" value={text.trim() ? text.trim().split(/\s+/).length : 0} /><Stat label="Lines" value={text.split('\n').length} /></div>
                <p className="text-2xl sm:text-4xl font-bold tracking-[-.04em] leading-tight my-10 break-words">{text || 'Your transformed copy appears here.'}</p>
                <CopyButton copied={copied} onClick={() => copyText(text, markCopied)} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ToolHeading = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => <div><Icon size={22} className="text-[var(--text-accent)]" /><h2 className="text-xl font-bold mt-3">{title}</h2><p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">{description}</p></div>;
const RangeControl = ({ label, value, min, max, suffix, step = 1, onChange }: { label: string; value: number; min: number; max: number; suffix: string; step?: number; onChange: (value: number) => void }) => <label className="block"><span className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mb-2"><span>{label}</span><strong className="text-[var(--editor-foreground)]">{value}{suffix}</strong></span><input type="range" value={value} min={min} max={max} step={step} onChange={event => onChange(Number(event.target.value))} className="playground-range w-full" /></label>;
const ColorControl = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-black/10"><span className="text-xs font-medium">{label}</span><span className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)]"><input type="color" value={value} onChange={event => onChange(event.target.value)} className="w-7 h-7 rounded-lg overflow-hidden border-0 bg-transparent" />{value}</span></label>;
const CopyButton = ({ copied, onClick }: { copied: boolean; onClick: () => void }) => <button onClick={onClick} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] text-xs font-bold hover:bg-[var(--modal-button-hover-background)] transition-colors">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy output'}</button>;
const Stat = ({ label, value }: { label: string; value: number }) => <div className="p-3 rounded-xl border border-[var(--border-color)] bg-black/10"><strong className="block text-xl">{value}</strong><span className="text-[9px] font-mono text-[var(--text-muted)]">{label}</span></div>;

export default PlaygroundView;
