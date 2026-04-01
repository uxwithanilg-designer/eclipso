'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = ['Features', 'Library', 'Pricing', 'Docs'];

const FEATURES = [
  {
    icon: '🎬',
    title: 'Multi-Track Timeline',
    desc: 'Professional NLE timeline with unlimited video, audio & overlay tracks. Frame-perfect precision editing.',
    accent: '#7C5CFF',
  },
  {
    icon: '🎵',
    title: 'Music Library',
    desc: '1000+ royalty-free tracks across 200+ categories. One-click import directly into your timeline.',
    accent: '#00E5FF',
  },
  {
    icon: '⚡',
    title: 'Real-time Effects',
    desc: 'GPU-accelerated effects engine. Apply color grades, transitions, and audio FX in real-time.',
    accent: '#FF3B82',
  },
  {
    icon: '🎚️',
    title: 'Audio Mastering',
    desc: 'Professional audio tools: EQ, compressor, reverb, and stem separation powered by AI.',
    accent: '#00FF94',
  },
  {
    icon: '☁️',
    title: 'Cloud Projects',
    desc: 'Auto-save to cloud. Access your projects from any device, collaborate in real-time.',
    accent: '#FF8C00',
  },
  {
    icon: '📱',
    title: 'Mobile Editing',
    desc: 'Full editing power on mobile. Touch-optimized timeline, gestures, and professional tools.',
    accent: '#FFD60A',
  },
];

const STATS = [
  { value: '2M+', label: 'Creators' },
  { value: '1000+', label: 'Music Tracks' },
  { value: '200+', label: 'Categories' },
  { value: '4K', label: 'Export Quality' },
];

const MUSIC_CATEGORIES = [
  'Cinematic', 'Lo-Fi', 'Hip Hop', 'Electronic', 'Ambient', 'Rock', 'Jazz',
  'Classical', 'Pop', 'R&B', 'Trap', 'House', 'Drum & Bass', 'Synthwave',
  'Folk', 'Latin', 'Corporate', 'Epic', 'Chill', 'Dark', 'Upbeat', 'Emotional',
];

// Use hardcoded integer heights — no floating point, no server/client mismatch
const WAVE_BARS: { height: number; delay: number; duration: number; opacity: number }[] = [
  {height:28,delay:0.00,duration:0.92,opacity:0.82},{height:54,delay:0.04,duration:1.18,opacity:0.95},
  {height:19,delay:0.08,duration:0.76,opacity:0.74},{height:63,delay:0.12,duration:1.35,opacity:0.98},
  {height:41,delay:0.16,duration:1.05,opacity:0.88},{height:72,delay:0.20,duration:0.88,opacity:0.73},
  {height:33,delay:0.24,duration:1.22,opacity:0.92},{height:58,delay:0.28,duration:0.71,opacity:0.85},
  {height:24,delay:0.32,duration:1.40,opacity:0.78},{height:67,delay:0.36,duration:0.95,opacity:0.96},
  {height:45,delay:0.40,duration:1.12,opacity:0.83},{height:16,delay:0.44,duration:0.68,opacity:0.70},
  {height:71,delay:0.48,duration:1.30,opacity:0.97},{height:38,delay:0.52,duration:0.84,opacity:0.80},
  {height:53,delay:0.56,duration:1.08,opacity:0.91},{height:22,delay:0.60,duration:0.72,opacity:0.75},
  {height:64,delay:0.64,duration:1.25,opacity:0.94},{height:47,delay:0.68,duration:0.90,opacity:0.86},
  {height:31,delay:0.72,duration:1.38,opacity:0.79},{height:69,delay:0.76,duration:0.78,opacity:0.99},
  {height:25,delay:0.80,duration:1.15,opacity:0.76},{height:56,delay:0.84,duration:0.86,opacity:0.93},
  {height:43,delay:0.88,duration:1.28,opacity:0.87},{height:18,delay:0.92,duration:0.74,opacity:0.72},
  {height:66,delay:0.96,duration:1.02,opacity:0.96},{height:35,delay:1.00,duration:0.94,opacity:0.81},
  {height:59,delay:1.04,duration:1.20,opacity:0.90},{height:27,delay:1.08,duration:0.80,opacity:0.77},
  {height:48,delay:1.12,duration:1.32,opacity:0.88},{height:73,delay:1.16,duration:0.70,opacity:0.98},
  {height:21,delay:1.20,duration:1.10,opacity:0.74},{height:62,delay:1.24,duration:0.98,opacity:0.95},
  {height:37,delay:1.28,duration:1.26,opacity:0.82},{height:55,delay:1.32,duration:0.82,opacity:0.92},
  {height:29,delay:1.36,duration:1.42,opacity:0.78},{height:70,delay:1.40,duration:0.76,opacity:0.97},
  {height:44,delay:1.44,duration:1.16,opacity:0.85},{height:17,delay:1.48,duration:0.88,opacity:0.71},
  {height:61,delay:1.52,duration:1.34,opacity:0.94},{height:32,delay:1.56,duration:0.92,opacity:0.80},
  {height:52,delay:1.60,duration:1.06,opacity:0.89},{height:26,delay:1.64,duration:0.78,opacity:0.76},
  {height:68,delay:1.68,duration:1.22,opacity:0.96},{height:40,delay:1.72,duration:0.96,opacity:0.84},
  {height:57,delay:1.76,duration:1.36,opacity:0.91},{height:23,delay:1.80,duration:0.72,opacity:0.75},
  {height:65,delay:1.84,duration:1.14,opacity:0.95},{height:36,delay:1.88,duration:0.86,opacity:0.81},
  {height:50,delay:1.92,duration:1.28,opacity:0.88},{height:20,delay:1.96,duration:0.82,opacity:0.73},
  {height:74,delay:2.00,duration:1.00,opacity:0.98},{height:42,delay:2.04,duration:0.92,opacity:0.86},
  {height:30,delay:2.08,duration:1.18,opacity:0.79},{height:60,delay:2.12,duration:0.76,opacity:0.93},
  {height:46,delay:2.16,duration:1.30,opacity:0.87},{height:15,delay:2.20,duration:0.88,opacity:0.70},
  {height:63,delay:2.24,duration:1.04,opacity:0.94},{height:39,delay:2.28,duration:0.96,opacity:0.83},
];

function WaveformViz() {
  // Render nothing on the server; mount only on client to avoid any SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    // Static placeholder — same height, no bars, prevents layout shift
    return <div style={{ height: '80px', width: '100%' }} />;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '80px' }}>
      {WAVE_BARS.map((bar, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${bar.height}%`,
            background: i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--cyan)' : 'var(--pink)',
            borderRadius: '2px',
            animationName: 'waveAnim',
            animationDuration: `${bar.duration}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${bar.delay}s`,
            opacity: bar.opacity,
          }}
        />
      ))}
    </div>
  );
}

function FloatingOrb({ color, size, x, y, delay }: { color: string; size: number; x: number; y: number; delay: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(80px)',
        opacity: 0.15,
        animationName: 'float',
        animationDuration: `${4 + delay}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}s`,
        pointerEvents: 'none',
      }}
    />
  );
}

function TimelinePreview() {
  const tracks = [
    { color: '#7C5CFF', label: 'V1', width: '70%', clips: [{ w: '30%', offset: '0%' }, { w: '25%', offset: '35%' }, { w: '20%', offset: '65%' }] },
    { color: '#00E5FF', label: 'V2', width: '50%', clips: [{ w: '20%', offset: '10%' }, { w: '30%', offset: '40%' }] },
    { color: '#FF3B82', label: 'A1', width: '80%', clips: [{ w: '75%', offset: '5%' }] },
    { color: '#00FF94', label: 'A2', width: '60%', clips: [{ w: '55%', offset: '20%' }] },
  ];

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFBC2E' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28CA41' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif' }}>ECLIPSO — Timeline</span>
      </div>

      {/* Timecode ruler */}
      <div style={{ height: '24px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '40px', overflowX: 'hidden' }}>
        {['00:00', '00:10', '00:20', '00:30', '00:40', '01:00'].map(t => (
          <span key={t} style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{t}</span>
        ))}
      </div>

      {/* Tracks */}
      <div style={{ padding: '8px' }}>
        {tracks.map((track, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '28px', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace', textAlign: 'center', flexShrink: 0 }}>{track.label}</div>
            <div style={{ flex: 1, height: '28px', background: 'var(--bg-card)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
              {track.clips.map((clip, j) => (
                <div
                  key={j}
                  style={{
                    position: 'absolute',
                    left: clip.offset,
                    width: clip.w,
                    top: '3px',
                    bottom: '3px',
                    background: `${track.color}22`,
                    border: `1px solid ${track.color}55`,
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* Waveform lines inside clip */}
                  <div style={{ display: 'flex', gap: '1px', alignItems: 'center', height: '100%', padding: '2px' }}>
                    {Array.from({ length: 20 }, (_, k) => (
                      <div key={k} style={{ width: '1px', background: track.color, opacity: 0.6, height: `${20 + Math.sin(k * 0.8) * 40}%`, borderRadius: '1px' }} />
                    ))}
                  </div>
                </div>
              ))}
              {/* Playhead */}
              {i === 0 && (
                <div style={{ position: 'absolute', left: '38%', top: 0, bottom: 0, width: '1px', background: '#FFD60A', zIndex: 10 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom transport */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
        <span style={{ fontSize: 10, color: 'var(--yellow)', fontFamily: 'monospace' }}>00:00:38;14</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['⏮', '⏪', '▶', '⏩', '⏭'].map(icon => (
            <button key={icon} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', padding: '2px 4px' }}>{icon}</button>
          ))}
        </div>
        <div style={{ flex: 1, height: '2px', background: 'var(--border)', borderRadius: '1px', position: 'relative' }}>
          <div style={{ width: '38%', height: '100%', background: 'var(--accent)', borderRadius: '1px' }} />
          <div style={{ position: 'absolute', left: '38%', top: '50%', transform: 'translate(-50%, -50%)', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCategory(prev => (prev + 1) % MUSIC_CATEGORIES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <FloatingOrb color="#7C5CFF" size={500} x={10} y={10} delay={0} />
        <FloatingOrb color="#00E5FF" size={400} x={80} y={20} delay={2} />
        <FloatingOrb color="#FF3B82" size={350} x={50} y={60} delay={1} />
        <FloatingOrb color="#00FF94" size={300} x={85} y={75} delay={3} />
      </div>

      {/* Scanline effect */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      }} />

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: '60px',
        background: scrollY > 20 ? 'rgba(8,8,9,0.85)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 20 ? '1px solid var(--border)' : 'none',
        transition: 'all 0.3s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 800, fontFamily: 'Syne, sans-serif',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}>E</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '2px' }}>ECLIPSO</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '32px' }} className="hide-mobile">
          {NAV_LINKS.map(link => (
            <a key={link} href="#" style={{
              color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'Syne, sans-serif',
              fontWeight: 500, letterSpacing: '0.5px', textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >{link}</a>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/editor" style={{
            color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'Syne, sans-serif',
            fontWeight: 500, textDecoration: 'none', padding: '8px 16px',
            transition: 'color 0.2s',
          }}>Sign in</Link>
          <Link href="/editor" style={{
            background: 'var(--accent)',
            color: 'white', fontSize: '13px', fontFamily: 'Syne, sans-serif',
            fontWeight: 600, textDecoration: 'none', padding: '8px 20px',
            borderRadius: '8px',
            boxShadow: '0 0 20px var(--accent-glow)',
            transition: 'all 0.2s',
            letterSpacing: '0.3px',
          }}>Start Free</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section ref={heroRef} style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 80px',
        textAlign: 'center',
      }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '100px',
          background: 'var(--accent-dim)', border: '1px solid rgba(124,92,255,0.3)',
          fontSize: '12px', fontFamily: 'Syne, sans-serif', fontWeight: 600,
          color: 'var(--accent)', letterSpacing: '1px', marginBottom: '32px',
          animation: 'fadeInUp 0.6s ease forwards',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-glow 1.5s ease infinite' }} />
          NOW IN BETA — JOIN 2M+ CREATORS
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(42px, 8vw, 96px)',
          lineHeight: 1.0,
          letterSpacing: '-2px',
          marginBottom: '24px',
          animation: 'fadeInUp 0.6s ease 0.1s both',
        }}>
          <span style={{ display: 'block' }}>Create Without</span>
          <span className="gradient-text" style={{ display: 'block' }}>Limits</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--text-secondary)',
          maxWidth: '540px',
          lineHeight: 1.7,
          marginBottom: '48px',
          animation: 'fadeInUp 0.6s ease 0.2s both',
        }}>
          Professional video editing meets a world-class music library. 
          Edit, mix, and publish — all in your browser.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: '80px',
          animation: 'fadeInUp 0.6s ease 0.3s both',
        }}>
          <Link href="/editor" style={{
            background: 'var(--accent)', color: 'white', textDecoration: 'none',
            padding: '16px 36px', borderRadius: '12px',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px',
            letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 0 40px var(--accent-glow), 0 8px 30px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}>
            🎬 Open Editor
          </Link>
          <Link href="/library" style={{
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', textDecoration: 'none',
            padding: '16px 36px', borderRadius: '12px',
            fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '15px',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'all 0.2s',
          }}>
            🎵 Browse Library
          </Link>
        </div>

        {/* Waveform */}
        <div style={{ marginBottom: '48px', animation: 'fadeInUp 0.6s ease 0.4s both', width: '100%', maxWidth: '600px' }}>
          <WaveformViz />
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '48px', flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeInUp 0.6s ease 0.5s both',
        }}>
          {STATS.map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '32px', background: 'linear-gradient(135deg, #F0F0FF, #9090AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px', fontFamily: 'Syne, sans-serif', fontWeight: 500, marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TIMELINE PREVIEW */}
      <section style={{ position: 'relative', zIndex: 2, padding: '0 40px 100px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{
          position: 'relative',
          padding: '2px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(124,92,255,0.4), rgba(0,229,255,0.2), rgba(255,59,130,0.2))',
        }}>
          <div style={{ borderRadius: '14px', overflow: 'hidden' }}>
            <TimelinePreview />
          </div>
        </div>
        {/* Glow below */}
        <div style={{
          position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
          width: '60%', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          filter: 'blur(4px)',
        }} />
      </section>

      {/* FEATURES */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '16px' }}>
            CAPABILITIES
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-1px' }}>
            Everything you need<br />
            <span className="gradient-text">in one place</span>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {FEATURES.map((feature, i) => (
            <div key={i} className="card" style={{
              padding: '28px',
              position: 'relative',
              overflow: 'hidden',
              animationDelay: `${i * 0.1}s`,
            }}>
              {/* Accent corner */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '80px', height: '80px',
                background: `radial-gradient(circle at top right, ${feature.accent}15, transparent)`,
              }} />
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${feature.accent}15`, border: `1px solid ${feature.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', marginBottom: '16px',
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '17px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* MUSIC LIBRARY SECTION */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 40px', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--cyan)', fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '16px' }}>
              MUSIC LIBRARY
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1px', marginBottom: '20px' }}>
              1000+ tracks,<br />
              <span style={{ color: 'var(--cyan)' }}>royalty-free.</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '32px' }}>
              From cinematic orchestras to lo-fi beats — discover the perfect sound for every project. 
              One-click import into your timeline.
            </p>
            <Link href="/library" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--cyan-dim)', border: '1px solid rgba(0,229,255,0.3)',
              color: 'var(--cyan)', textDecoration: 'none',
              padding: '12px 24px', borderRadius: '10px',
              fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px',
            }}>
              Explore Library →
            </Link>
          </div>

          {/* Categories cloud */}
          <div style={{ position: 'relative', height: '300px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'center', height: '100%' }}>
              {MUSIC_CATEGORIES.map((cat, i) => (
                <div key={cat} style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  border: `1px solid ${i === activeCategory ? 'var(--cyan)' : 'var(--border)'}`,
                  background: i === activeCategory ? 'var(--cyan-dim)' : 'var(--bg-card)',
                  color: i === activeCategory ? 'var(--cyan)' : 'var(--text-secondary)',
                  transition: 'all 0.4s',
                  transform: i === activeCategory ? 'scale(1.1)' : 'scale(1)',
                  cursor: 'pointer',
                }}>
                  {cat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE CTA SECTION */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 40px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '700px', margin: '0 auto',
          padding: '60px 40px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Gradient top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, var(--accent), var(--cyan), var(--pink))',
          }} />

          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-1px', marginBottom: '16px' }}>
            Start creating <span className="gradient-text">today</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '36px' }}>
            No credit card required. Free tier includes 10GB storage, 
            full music library access, and HD export.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/editor" style={{
              background: 'var(--accent)', color: 'white', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '10px',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px',
              boxShadow: '0 0 30px var(--accent-glow)',
            }}>
              Open Editor Free →
            </Link>
            <Link href="/library" style={{
              background: 'transparent', color: 'var(--text-primary)', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '10px',
              fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '15px',
              border: '1px solid var(--border)',
            }}>
              Browse Music
            </Link>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{
        position: 'relative', zIndex: 2,
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: '14px 0', overflow: 'hidden', marginBottom: '0',
        background: 'var(--bg-secondary)',
      }}>
        <div className="animate-ticker" style={{ display: 'flex', gap: '0', whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, rep) => (
            <span key={rep} style={{ display: 'flex', gap: '40px' }}>
              {['VIDEO EDITING', 'MUSIC LIBRARY', 'COLOR GRADING', 'AUDIO MASTERING', 'MULTI-TRACK', '4K EXPORT', 'CLOUD SYNC', 'ROYALTY FREE', 'REAL-TIME FX', 'COLLABORATION'].map(item => (
                <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', letterSpacing: '2px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {item}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        position: 'relative', zIndex: 2,
        borderTop: '1px solid var(--border)',
        padding: '40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>E</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px' }}>ECLIPSO</span>
        </div>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['Privacy', 'Terms', 'Support', 'API'].map(link => (
            <a key={link} href="#" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>{link}</a>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>© 2025 Eclipso. All rights reserved.</span>
      </footer>
    </div>
  );
}
