'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

// ──────────────────────────────────────────
//  DATA
// ──────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All', icon: '✦', count: 1240 },
  { id: 'cinematic', label: 'Cinematic', icon: '🎬', count: 98 },
  { id: 'lofi', label: 'Lo-Fi', icon: '☁️', count: 112 },
  { id: 'hiphop', label: 'Hip Hop', icon: '🎤', count: 134 },
  { id: 'electronic', label: 'Electronic', icon: '⚡', count: 156 },
  { id: 'ambient', label: 'Ambient', icon: '🌊', count: 89 },
  { id: 'rock', label: 'Rock', icon: '🎸', count: 76 },
  { id: 'jazz', label: 'Jazz', icon: '🎷', count: 64 },
  { id: 'classical', label: 'Classical', icon: '🎻', count: 55 },
  { id: 'pop', label: 'Pop', icon: '🌟', count: 92 },
  { id: 'rnb', label: 'R&B', icon: '💜', count: 78 },
  { id: 'trap', label: 'Trap', icon: '🔥', count: 90 },
  { id: 'house', label: 'House', icon: '🏠', count: 68 },
  { id: 'synthwave', label: 'Synthwave', icon: '🌆', count: 55 },
  { id: 'folk', label: 'Folk', icon: '🌿', count: 42 },
  { id: 'latin', label: 'Latin', icon: '💃', count: 58 },
  { id: 'corporate', label: 'Corporate', icon: '💼', count: 74 },
  { id: 'epic', label: 'Epic', icon: '⚔️', count: 63 },
  { id: 'chill', label: 'Chill', icon: '😌', count: 87 },
  { id: 'dark', label: 'Dark', icon: '🌑', count: 51 },
  { id: 'upbeat', label: 'Upbeat', icon: '☀️', count: 82 },
  { id: 'emotional', label: 'Emotional', icon: '💧', count: 69 },
];

const MOODS = ['Happy', 'Sad', 'Energetic', 'Relaxed', 'Tense', 'Romantic', 'Mysterious', 'Inspirational'];
const TEMPOS = ['Slow (< 80 BPM)', 'Medium (80-120)', 'Fast (120-150)', 'Very Fast (150+)'];

function generateTracks(count: number) {
  const trackNames = [
    'Midnight Pulse', 'Golden Hour', 'Neon Rain', 'Void Walker', 'Solar Drift',
    'Crystal Caves', 'Urban Legends', 'Deep Space', 'Reverie', 'Cascade',
    'Echo Chamber', 'Phoenix Rise', 'Storm Front', 'Silk Road', 'Fractured Light',
    'Autumn Wind', 'Coastal Drive', 'Night Market', 'Static Wave', 'Burning Skies',
    'Hollow Earth', 'Prism Break', 'Tidal Force', 'Iron Gate', 'Soft Landing',
    'Gravity Well', 'Paper Planes', 'Ghost Signal', 'Blue Horizon', 'Last Train',
    'Monolith', 'Velvet Thunder', 'Lunar Tide', 'Serpentine', 'Warp Drive',
    'Chromatic', 'Ember Glow', 'Frequency', 'Parallax', 'Resonance',
  ];

  const artists = ['Kova', 'Nyx Audio', 'The Sound Lab', 'Aether', 'Drex', 'Solara', 'Pixl', 'Orbit', 'Mira', 'Echo'];
  const catIds = CATEGORIES.slice(1).map(c => c.id);
  const accentColors = ['#7C5CFF', '#00E5FF', '#FF3B82', '#00FF94', '#FF8C00', '#FFD60A', '#FF6B6B', '#4ECDC4'];

  return Array.from({ length: count }, (_, i) => {
    // Pure integer modulo — identical in Node.js and browser, zero float risk
    const s1 = ((i * 31 + 7) % 3) / 3;
    const s2 = ((i * 17 + 13) % 60) / 60;
    const s3 = ((i * 53 + 29) % 50000) / 50000;
    return {
      id: i + 1,
      title: trackNames[i % trackNames.length] + (i >= trackNames.length ? ` ${Math.floor(i / trackNames.length) + 1}` : ''),
      artist: artists[i % artists.length],
      category: catIds[i % catIds.length],
      duration: `${Math.floor(s1 * 3) + 1}:${String(Math.floor(s2 * 60)).padStart(2, '0')}`,
      bpm: [72, 85, 96, 110, 120, 128, 140, 155][i % 8],
      tags: [catIds[i % catIds.length], catIds[(i + 3) % catIds.length]],
      accent: accentColors[i % accentColors.length],
      plays: Math.floor(s3 * 50000) + 1000,
      isNew: i < 12,
      isFeatured: [0, 5, 12, 18, 25].includes(i),
      waveData: Array.from({ length: 40 }, (__, k) => {
        // Integer 0-100 via modulo — no floating point
        return ((i * 7 + k * 13) % 91 + 10) / 100;
      }),
    };
  });
}

const ALL_TRACKS = generateTracks(120);

// ──────────────────────────────────────────
//  SUB-COMPONENTS
// ──────────────────────────────────────────

function MiniWave({ data, color, playing }: { data: number[]; color: string; playing: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px', height: '28px' }}>
      {data.map((v, i) => (
        <div key={i} style={{
          width: '2px',
          height: `${v * 80 + 10}%`,
          background: color,
          borderRadius: '1px',
          opacity: playing ? 0.9 : 0.4,
          // Split shorthand to avoid React animationDelay conflict warning
          animationName: playing ? 'waveAnim' : 'none',
          animationDuration: `${0.5 + v * 0.5}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: `${i * 0.03}s`,
        }} />
      ))}
    </div>
  );
}

function TrackCard({ track, isPlaying, onPlay }: { track: ReturnType<typeof generateTracks>[0]; isPlaying: boolean; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [importedToEditor, setImportedToEditor] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleImport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImportedToEditor(true);
    setTimeout(() => setImportedToEditor(false), 2000);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isPlaying ? `${track.accent}08` : hovered ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${isPlaying ? track.accent + '40' : hovered ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onPlay}
    >
      {/* Left accent bar */}
      {isPlaying && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
          background: track.accent,
          borderRadius: '3px 0 0 3px',
        }} />
      )}

      {/* Play button */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: isPlaying ? track.accent : `${track.accent}20`,
        border: `1px solid ${track.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '14px', transition: 'all 0.2s',
        color: isPlaying ? 'white' : track.accent,
      }}>
        {isPlaying ? '⏸' : '▶'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px',
            color: isPlaying ? track.accent : 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{track.title}</span>
          {track.isNew && (
            <span style={{ padding: '2px 7px', borderRadius: '100px', fontSize: '9px', fontWeight: 700, background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px' }}>NEW</span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {track.artist} · {track.bpm} BPM · {track.duration}
        </div>
      </div>

      {/* Waveform */}
      <div className="hide-mobile" style={{ width: '80px', flexShrink: 0 }}>
        <MiniWave data={track.waveData.slice(0, 20)} color={track.accent} playing={isPlaying} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleImport}
          style={{
            background: importedToEditor ? 'var(--green-dim)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${importedToEditor ? 'var(--green)' : 'var(--border)'}`,
            color: importedToEditor ? 'var(--green)' : 'var(--text-secondary)',
            padding: '7px 12px', borderRadius: '8px',
            fontSize: '11px', fontFamily: 'Syne, sans-serif', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
          }}
        >
          {importedToEditor ? '✓ Imported' : '+ Editor'}
        </button>
        <button
          onClick={handleDownload}
          style={{
            background: downloaded ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${downloaded ? 'var(--accent)' : 'var(--border)'}`,
            color: downloaded ? 'var(--accent)' : 'var(--text-secondary)',
            width: '34px', height: '34px', borderRadius: '8px',
            fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {downloaded ? '✓' : '↓'}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
//  PAGE
// ──────────────────────────────────────────
export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [activeMoods, setActiveMoods] = useState<string[]>([]);
  const [activeTempo, setActiveTempo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'bpm'>('popular');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const filteredTracks = ALL_TRACKS
    .filter(t => {
      if (activeCategory !== 'all' && t.category !== activeCategory) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.artist.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'bpm') return b.bpm - a.bpm;
      return b.plays - a.plays;
    });

  const currentTrack = playingId ? ALL_TRACKS.find(t => t.id === playingId) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '100px' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '56px',
        background: 'rgba(8,8,9,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, fontFamily: 'Syne, sans-serif', boxShadow: '0 0 15px var(--accent-glow)' }}>E</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '1px' }}>ECLIPSO</span>
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--cyan)', letterSpacing: '2px' }}>MUSIC LIBRARY</span>
        </div>
        <Link href="/editor" style={{
          background: 'var(--accent)', color: 'white', textDecoration: 'none',
          padding: '7px 18px', borderRadius: '8px',
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '12px',
          letterSpacing: '0.5px',
        }}>Open Editor</Link>
      </nav>

      <div style={{ display: 'flex', height: 'calc(100vh - 56px - 80px)', position: 'relative' }}>

        {/* SIDEBAR */}
        <aside style={{
          width: '240px', flexShrink: 0,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto', padding: '20px 0',
        }} className="hide-mobile">

          <div style={{ padding: '0 16px 12px', fontSize: '10px', letterSpacing: '2px', color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            CATEGORIES
          </div>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 16px', background: activeCategory === cat.id ? 'var(--accent-dim)' : 'transparent',
                border: 'none', borderLeft: `3px solid ${activeCategory === cat.id ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: activeCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'Syne, sans-serif', fontWeight: activeCategory === cat.id ? 600 : 400 }}>
                <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                {cat.label}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cat.count}</span>
            </button>
          ))}

          <div style={{ padding: '20px 16px 12px', fontSize: '10px', letterSpacing: '2px', color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            MOOD
          </div>
          <div style={{ padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {MOODS.map(mood => (
              <button key={mood} onClick={() => setActiveMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood])} style={{
                padding: '4px 10px', borderRadius: '100px', fontSize: '11px',
                fontFamily: 'Syne, sans-serif', fontWeight: 500, cursor: 'pointer',
                background: activeMoods.includes(mood) ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: `1px solid ${activeMoods.includes(mood) ? 'var(--accent)' : 'var(--border)'}`,
                color: activeMoods.includes(mood) ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>{mood}</button>
            ))}
          </div>

          <div style={{ padding: '20px 16px 12px', fontSize: '10px', letterSpacing: '2px', color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            TEMPO
          </div>
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {TEMPOS.map(tempo => (
              <button key={tempo} onClick={() => setActiveTempo(prev => prev === tempo ? null : tempo)} style={{
                padding: '6px 10px', borderRadius: '7px', fontSize: '11px', textAlign: 'left',
                fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                background: activeTempo === tempo ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${activeTempo === tempo ? 'var(--accent)' : 'transparent'}`,
                color: activeTempo === tempo ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>{tempo}</button>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Top toolbar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            padding: '16px 24px',
            background: 'rgba(8,8,9,0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--text-muted)' }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists..."
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '9px', color: 'var(--text-primary)', fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif', outline: 'none',
                }}
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              style={{
                padding: '9px 12px', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: '9px',
                color: 'var(--text-secondary)', fontSize: '12px',
                fontFamily: 'Syne, sans-serif', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="bpm">By BPM</option>
            </select>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '9px', padding: '4px', border: '1px solid var(--border)' }}>
              {(['list', 'grid'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: view === v ? 'var(--accent)' : 'transparent',
                  color: view === v ? 'white' : 'var(--text-muted)',
                  fontSize: '12px', fontFamily: 'Syne, sans-serif', fontWeight: 600, transition: 'all 0.15s',
                }}>{v === 'list' ? '☰' : '⊞'}</button>
              ))}
            </div>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap' }}>
              {filteredTracks.length} tracks
            </span>
          </div>

          {/* Featured banner */}
          {activeCategory === 'all' && !searchQuery && (
            <div style={{
              margin: '20px 24px 0',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(124,92,255,0.1), rgba(0,229,255,0.08))',
              border: '1px solid rgba(124,92,255,0.25)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '6px' }}>
                  ✦ FEATURED THIS WEEK
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px' }}>Midnight Pulse</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Kova · Cinematic · 128 BPM · 2:34</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setPlayingId(prev => prev === 1 ? null : 1)} style={{
                  padding: '8px 20px', borderRadius: '9px', border: 'none',
                  background: 'var(--accent)', color: 'white', cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px',
                }}>
                  {playingId === 1 ? '⏸ Pause' : '▶ Play'}
                </button>
                <button style={{
                  padding: '8px 16px', borderRadius: '9px',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '13px',
                }}>+ Editor</button>
              </div>
            </div>
          )}

          {/* Track list */}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTracks.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                isPlaying={playingId === track.id}
                onPlay={() => setPlayingId(prev => prev === track.id ? null : track.id)}
              />
            ))}
            {filteredTracks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>No tracks found</div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MINI PLAYER */}
      {currentTrack && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: 'rgba(14,14,17,0.97)',
          backdropFilter: 'blur(24px)',
          borderTop: `1px solid ${currentTrack.accent}40`,
          padding: '12px 32px',
          display: 'flex', alignItems: 'center', gap: '20px',
        }}>
          {/* Left: track accent + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: `${currentTrack.accent}20`, border: `1px solid ${currentTrack.accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: '16px', animation: 'float 3s ease-in-out infinite',
            }}>🎵</div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: currentTrack.accent }}>{currentTrack.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentTrack.artist} · {currentTrack.bpm} BPM</div>
            </div>
          </div>

          {/* Center: waveform + controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '16px', cursor: 'pointer' }}>⏮</button>
              <button onClick={() => setPlayingId(null)} style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: currentTrack.accent, border: 'none',
                color: 'white', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>⏸</button>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '16px', cursor: 'pointer' }}>⏭</button>
            </div>
            {/* Progress */}
            <div style={{ width: '100%', maxWidth: '300px', height: '3px', background: 'var(--border)', borderRadius: '2px', position: 'relative' }}>
              <div style={{ width: '45%', height: '100%', background: currentTrack.accent, borderRadius: '2px' }} />
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button style={{
              padding: '8px 16px', borderRadius: '8px',
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent)', cursor: 'pointer',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '12px',
            }}>+ Import to Editor</button>
            <button style={{
              padding: '8px 14px', borderRadius: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
            }}>↓</button>
          </div>
        </div>
      )}
    </div>
  );
}
