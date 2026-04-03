'use client';
import { useState, useReducer, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════
type ToolId = 'select'|'track_fwd'|'ripple'|'rolling'|'rate'|'razor'|'slip'|'slide'|'hand'|'zoom'|'pen'|'text';
type LeftTab = 'media'|'library'|'effects'|'transitions'|'color'|'sound'|'mixer'|'captions'|'ai'|'markers'|'history';
type RightTab = 'effectcontrols'|'info';
type Workspace = 'editing'|'color'|'audio'|'effects'|'all';
type MobileTab = 'videos'|'music'|'titles'|null;
type Track = { id:number; type:'video'|'audio'|'caption'; label:string; color:string; muted:boolean; solo:boolean; locked:boolean; height:number };
type Interpolation = 'linear'|'ease-in'|'ease-out';
type Keyframe = { id:number; time:number; value:number; interpolation:Interpolation };
type Clip  = { id:number; trackId:number; start:number; width:number; sourceWidth?:number; label:string; color:string; type:'video'|'audio'; speed?:number; proxy?:boolean; nested?:boolean; groupId?:number; url?:string; sourceOffset?:number; x?:number; y?:number; scale?:number; rotation?:number; anchorX?:number; anchorY?:number; opacity?:number; keyframes?:Record<string, Keyframe[]> };
type Marker = { id:number; time:number; label:string; color:string };
type Transition = { id:number; trackId:number; startTime:number; duration:number; type:string };
type HistoryEntry = { id:number; label:string; clips:Clip[]; transitions:Transition[]; timestamp:number };
type HistoryState = { past:HistoryEntry[]; present:HistoryEntry; future:HistoryEntry[] };
const MAX_HISTORY = 50;

export interface ProjectFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  duration?: number;
  color: string;
  url: string;
  thumbnailUrl?: string;
  hasAudio?: boolean;
}

// ═══════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════
const TOOLS: {id:ToolId; icon:string; label:string; key:string; group:number}[] = [
  {id:'select',    icon:'↖', label:'Selection Tool',        key:'V', group:0},
  {id:'track_fwd', icon:'⇥', label:'Track Select Fwd',      key:'A', group:0},
  {id:'ripple',    icon:'⟪', label:'Ripple Edit Tool',       key:'B', group:0},
  {id:'rolling',   icon:'⟺', label:'Rolling Edit Tool',      key:'N', group:0},
  {id:'rate',      icon:'⧖', label:'Rate Stretch Tool',      key:'R', group:0},
  {id:'razor',     icon:'✂', label:'Razor Tool',             key:'C', group:1},
  {id:'slip',      icon:'⇄', label:'Slip Tool',              key:'Y', group:1},
  {id:'slide',     icon:'⇌', label:'Slide Tool',             key:'U', group:1},
  {id:'hand',      icon:'✋', label:'Hand Tool',              key:'H', group:2},
  {id:'zoom',      icon:'⊕', label:'Zoom Tool',              key:'Z', group:2},
  {id:'pen',       icon:'✏', label:'Pen Tool',               key:'P', group:3},
  {id:'text',      icon:'T', label:'Type Tool',              key:'T', group:3},
];

const LEFT_TABS: {id:LeftTab; icon:string; label:string; badge?:string}[] = [
  {id:'media',       icon:'📁', label:'Media',           badge:'5'},
  {id:'library',     icon:'🎵', label:'Library',         badge:'1K+'},
  {id:'effects',     icon:'✨', label:'Effects'},
  {id:'transitions', icon:'🔀', label:'Transitions'},
  {id:'color',       icon:'🎨', label:'Lumetri Color'},
  {id:'sound',       icon:'🔊', label:'Essential Sound'},
  {id:'mixer',       icon:'🎚', label:'Audio Mixer'},
  {id:'captions',    icon:'💬', label:'Captions'},
  {id:'ai',          icon:'🤖', label:'AI Tools'},
  {id:'markers',     icon:'📍', label:'Markers'},
  {id:'history',     icon:'🕘', label:'History'},
];

const VIDEO_EFFECTS = [
  {name:'Gaussian Blur',     cat:'Blur',       icon:'◐'},
  {name:'Sharpen',           cat:'Blur',       icon:'◑'},
  {name:'Crop',              cat:'Transform',  icon:'⊡'},
  {name:'Transform',         cat:'Transform',  icon:'⊞'},
  {name:'Corner Pin',        cat:'Distort',    icon:'⬡'},
  {name:'Warp Stabilizer',   cat:'Distort',    icon:'〰'},
  {name:'Brightness&Contrast',cat:'Color',     icon:'☀'},
  {name:'Lumetri Color',     cat:'Color',      icon:'🎨'},
  {name:'Black & White',     cat:'Color',      icon:'◫'},
  {name:'Drop Shadow',       cat:'Stylize',    icon:'▣'},
  {name:'Glow',              cat:'Stylize',    icon:'✦'},
  {name:'Film Grain',        cat:'Stylize',    icon:'⁘'},
  {name:'Chromatic Aberration',cat:'Stylize',  icon:'⊛'},
  {name:'Vignette',          cat:'Stylize',    icon:'◉'},
  {name:'Ultra Key',         cat:'Keying',     icon:'🟩'},
  {name:'Motion Blur',       cat:'Time',       icon:'≋'},
  {name:'Basic 3D',          cat:'3D',         icon:'◆'},
  {name:'Noise Reduction',   cat:'Repair',     icon:'⊘'},
];

const AUDIO_EFFECTS = [
  {name:'EQ / Parametric',  icon:'🎛'},{name:'Compressor',     icon:'📊'},
  {name:'Reverb',           icon:'〰'},{name:'Delay / Echo',   icon:'⧫'},
  {name:'Limiter',          icon:'⊓'},{name:'Noise Gate',     icon:'⊔'},
  {name:'De-Noise',         icon:'⊘'},{name:'Chorus',         icon:'≋'},
  {name:'Pitch Shift',      icon:'♪'},{name:'Stereo Expand',  icon:'⟺'},
];

const TRANSITION_LIST = [
  {name:'Cross Dissolve',    cat:'Dissolve',   key:'Ctrl+D'},
  {name:'Dip to Black',      cat:'Dissolve',   key:''},
  {name:'Dip to White',      cat:'Dissolve',   key:''},
  {name:'Film Dissolve',     cat:'Dissolve',   key:''},
  {name:'Wipe Left→Right',   cat:'Wipe',       key:''},
  {name:'Wipe Right→Left',   cat:'Wipe',       key:''},
  {name:'Clock Wipe',        cat:'Wipe',       key:''},
  {name:'Slide Left',        cat:'Slide',      key:''},
  {name:'Slide Right',       cat:'Slide',      key:''},
  {name:'Push Left',         cat:'Slide',      key:''},
  {name:'Zoom In',           cat:'Zoom',       key:''},
  {name:'Zoom Out',          cat:'Zoom',       key:''},
  {name:'Spin',              cat:'Special',    key:''},
  {name:'Flash',             cat:'Special',    key:''},
  {name:'Morph Cut',         cat:'Special',    key:''},
  {name:'Audio CrossFade',   cat:'Audio',      key:'Ctrl+Shift+D'},
  {name:'Constant Power',    cat:'Audio',      key:''},
];

const LUT_PRESETS = ['Cinematic','Vintage','Cyberpunk','Teal & Orange','Bleach Bypass','Noir','Warm Sunset','Cold Arctic','Golden Hour','Neon Lights','Matte Fade'];

const WORKSPACES: {id:Workspace; label:string}[] = [
  {id:'editing',  label:'Editing'},
  {id:'color',    label:'Color'},
  {id:'audio',    label:'Audio'},
  {id:'effects',  label:'Effects'},
  {id:'all',      label:'All Panels'},
];

const MUSIC_TRACKS_DATA = [
  {id:100, title:'Midnight Pulse', artist:'Kova',          dur:'2:34', bpm:128, accent:'#7C5CFF'},
  {id:101, title:'Golden Hour',    artist:'Nyx Audio',     dur:'3:12', bpm:96,  accent:'#00E5FF'},
  {id:102, title:'Neon Rain',      artist:'The Sound Lab', dur:'2:48', bpm:140, accent:'#FF3B82'},
  {id:103, title:'Crystal Caves',  artist:'Aether',        dur:'4:02', bpm:85,  accent:'#00FF94'},
  {id:104, title:'Urban Legends',  artist:'Drex',          dur:'3:33', bpm:110, accent:'#FF8C00'},
  {id:105, title:'Deep Space',     artist:'Solara',        dur:'5:15', bpm:72,  accent:'#FFD60A'},
];

const CLIP_WAVE = [45,72,31,88,54,19,67,42,78,25,61,38,90,55,22,74,48,85,33,68,27,80,50,16,73,44,92,36,64,29,57,82,23,70,46,15,76,52,88,34,62,41,79,26,59,83,20,66,49,91,37,71,28,86,53,18,75,43,87,30];

const COLOR_CONTROLS = [
  {label:'Exposure',    min:-5,  max:5,  step:0.1, color:'#FFD60A', def:0},
  {label:'Contrast',   min:-100,max:100,step:1,   color:'#FF8C00', def:0},
  {label:'Highlights', min:-100,max:100,step:1,   color:'#FFFFFF', def:0},
  {label:'Shadows',    min:-100,max:100,step:1,   color:'#7C5CFF', def:0},
  {label:'Whites',     min:-100,max:100,step:1,   color:'#F0F0FF', def:0},
  {label:'Blacks',     min:-100,max:100,step:1,   color:'#444466', def:0},
  {label:'Saturation', min:0,   max:200,step:1,   color:'#00FF94', def:100},
  {label:'Temperature',min:-100,max:100,step:1,   color:'#00E5FF', def:0},
  {label:'Tint',       min:-100,max:100,step:1,   color:'#FF3B82', def:0},
];

// ═══════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════
function initTracks(): Track[] {
  return [
    {id:1, type:'video',   label:'V3', color:'#5566EE', muted:false, solo:false, locked:false, height:48},
    {id:2, type:'video',   label:'V2', color:'#7C5CFF', muted:false, solo:false, locked:false, height:48},
    {id:3, type:'video',   label:'V1', color:'#9966FF', muted:false, solo:false, locked:false, height:52},
    {id:7, type:'caption', label:'CT', color:'#FFD60A', muted:false, solo:false, locked:false, height:28},
    {id:4, type:'audio',   label:'A1', color:'#00E5FF', muted:false, solo:false, locked:false, height:44},
    {id:5, type:'audio',   label:'A2', color:'#00FF94', muted:false, solo:false, locked:false, height:44},
    {id:6, type:'audio',   label:'A3', color:'#FF3B82', muted:false, solo:false, locked:false, height:36},
  ];
}

function getClipValue(clip: Clip, prop: string, sequenceTime: number): number {
  const kfs = clip.keyframes?.[prop];
  const staticVal = (clip as any)[prop] ?? (prop === 'scale' || prop === 'opacity' ? 100 : 0);
  if (!kfs || kfs.length === 0) return staticVal;

  const time = sequenceTime - clip.start;
  const sorted = [...kfs].sort((a, b) => a.time - b.time);

  const nextIdx = sorted.findIndex(k => k.time > time);
  if (nextIdx === -1) return sorted[sorted.length - 1].value;
  if (nextIdx === 0) return sorted[0].value;

  const prev = sorted[nextIdx - 1];
  const next = sorted[nextIdx];

  const t = (time - prev.time) / (next.time - prev.time);
  let easeT = t;
  if (next.interpolation === 'ease-in') easeT = t * t;
  else if (next.interpolation === 'ease-out') easeT = 1 - (1 - t) * (1 - t);

  return prev.value + (next.value - prev.value) * easeT;
}

function initClips(): Clip[] {
  return [];
}

function initMarkers(): Marker[] {
  return [
    {id:1, time:15,  label:'Intro End',    color:'#FFD60A'},
    {id:2, time:38,  label:'Key Moment',   color:'#FF3B82'},
    {id:3, time:60,  label:'Music Drop',   color:'#00E5FF'},
  ];
}

// ═══════════════════════════════════════════════════
//  MINI WAVEFORM
// ═══════════════════════════════════════════════════
function ClipWave({color, n=30}:{color:string; n?:number}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'1px',height:'100%',overflow:'hidden',padding:'3px 0'}}>
      {Array.from({length:n},(_,i)=>(
        <div key={i} style={{width:'2px',flexShrink:0,height:`${CLIP_WAVE[i%CLIP_WAVE.length]}%`,background:color,opacity:0.6,borderRadius:'1px'}}/>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  LEFT PANELS CONTENT
// ═══════════════════════════════════════════════════

// — MEDIA PANEL —
function PanelMedia({files, onUploadClick, onImport, onDragStartItem, onDoubleClickItem}:{files:ProjectFile[], onUploadClick:()=>void, onImport:(f:ProjectFile|string)=>void, onDragStartItem?:(e:React.DragEvent, item:any)=>void, onDoubleClickItem?:(item:any)=>void}) {
  const bins = ['All Media','Video','Audio','Images','B-Roll'];
  const [bin,setBin] = useState('All Media');
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <span style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>PROJECT BINS</span>
        <button style={{background:'var(--accent-dim)',border:'1px solid rgba(124,92,255,0.3)',color:'var(--accent)',fontSize:'10px',borderRadius:'5px',padding:'2px 8px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600}}>+ Bin</button>
      </div>
      {/* Bins */}
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'10px'}}>
        {bins.map(b=>(
          <button key={b} onClick={()=>setBin(b)} style={{padding:'3px 8px',borderRadius:'6px',fontSize:'10px',fontFamily:'Syne,sans-serif',fontWeight:600,cursor:'pointer',background:bin===b?'var(--accent-dim)':'var(--bg-card)',border:`1px solid ${bin===b?'var(--accent)':'var(--border)'}`,color:bin===b?'var(--accent)':'var(--text-secondary)',transition:'all 0.15s'}}>{b}</button>
        ))}
      </div>
      {/* Import drop zone */}
      <div onClick={onUploadClick} style={{border:'2px dashed var(--border)',borderRadius:'10px',padding:'12px',textAlign:'center',marginBottom:'10px',cursor:'pointer',transition:'all 0.2s'}}
        onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--accent)')}
        onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}
      >
        <div style={{fontSize:'18px',marginBottom:'4px'}}>+</div>
        <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>Click or Ctrl+I to import</div>
      </div>
      {/* File list */}
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
        {files.length === 0 && <div style={{fontSize:'10px',color:'var(--text-muted)',textAlign:'center',padding:'10px'}}>No files imported</div>}
        {files.map((f,i)=>(
          <div key={f.id} draggable onDragStart={e=>onDragStartItem&&onDragStartItem(e, {type:f.type, label:f.name, color:f.color, duration: f.duration, url: f.url})} onDoubleClick={()=>onDoubleClickItem ? onDoubleClickItem({type:f.type, label:f.name, color:f.color, duration: f.duration, url: f.url}) : onImport(f)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 8px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',cursor:'grab',transition:'all 0.15s',position:'relative'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-bright)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{width:'36px',height:'24px',borderRadius:'4px',background:`${f.color}20`,border:`1px solid ${f.color}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden',position:'relative'}}>
              {f.thumbnailUrl ? (
                <img src={f.thumbnailUrl} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              ) : f.type === 'audio' ? (
                <div style={{display:'flex',gap:'1px',alignItems:'center'}}>{[3,5,4,6,4,3].map((h,k)=><div key={k} style={{width:'2px',height:`${h*3}px`,background:f.color,borderRadius:'1px',opacity:0.7}}/>)}</div>
              ) : null}
              {f.hasAudio && f.type === 'video' && (
                <div style={{position:'absolute',bottom:'2px',right:'2px',display:'flex',gap:'1px',opacity:0.9}}>
                   {[2,3,2,4].map((h,k)=><div key={k} style={{width:'1.5px',height:`${h*1.5}px`,background:'white',borderRadius:'1px'}}/>)}
                </div>
              )}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'11px',fontWeight:600,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
              <div style={{fontSize:'9px',color:'var(--text-secondary)'}}>{f.type}{f.duration ? ` · ${Math.round(f.duration/15)}s` : ''}</div>
            </div>
            <button onClick={()=>onImport(f)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'11px',flexShrink:0}}>▶</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// — LIBRARY PANEL —
function PanelLibrary({onImport, onDragStartItem}:{onImport:(t:typeof MUSIC_TRACKS_DATA[0])=>void, onDragStartItem?:(e:React.DragEvent, item:any)=>void}) {
  const [q,setQ]=useState('');
  const filtered = MUSIC_TRACKS_DATA.filter(t=>t.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'10px'}}>MUSIC LIBRARY</div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search 1000+ tracks..." style={{width:'100%',padding:'7px 10px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:'11px',outline:'none',marginBottom:'8px'}}/>
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {filtered.map(t=>(
          <div key={t.id} draggable onDragStart={e=>onDragStartItem&&onDragStartItem(e, {type:'audio', label:t.title, color:t.accent, duration: 150})} style={{padding:'9px 10px',borderRadius:'9px',background:'var(--bg-secondary)',border:'1px solid var(--border)',cursor:'grab',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.background=`${t.accent}0e`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-secondary)';}}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
              <div>
                <div style={{fontSize:'12px',fontWeight:700,fontFamily:'Syne,sans-serif',color:t.accent}}>{t.title}</div>
                <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>{t.artist} · {t.bpm} BPM · {t.dur}</div>
              </div>
              <button onClick={()=>onImport(t)} style={{background:t.accent,border:'none',color:'white',padding:'4px 8px',borderRadius:'5px',cursor:'pointer',fontSize:'10px',fontFamily:'Syne,sans-serif',fontWeight:700,flexShrink:0}}>+ Add</button>
            </div>
            <div style={{display:'flex',gap:'1px',height:'14px',alignItems:'center'}}>
              {CLIP_WAVE.slice(0,30).map((h,k)=><div key={k} style={{width:'2px',background:t.accent,opacity:0.45,height:`${h*0.25+5}px`,borderRadius:'1px',maxHeight:'14px'}}/>)}
            </div>
          </div>
        ))}
      </div>
      <Link href="/library" style={{display:'block',textAlign:'center',marginTop:'10px',padding:'7px',borderRadius:'7px',background:'var(--cyan-dim)',border:'1px solid rgba(0,229,255,0.25)',color:'var(--cyan)',fontSize:'11px',textDecoration:'none',fontFamily:'Syne,sans-serif',fontWeight:600}}>
        Browse Full Library →
      </Link>
    </div>
  );
}

// — EFFECTS PANEL —
function PanelEffects() {
  const [q,setQ]=useState('');
  const cats = [...new Set(VIDEO_EFFECTS.map(e=>e.cat))];
  const filtered = VIDEO_EFFECTS.filter(e=>e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search effects..." style={{width:'100%',padding:'7px 10px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:'11px',outline:'none',marginBottom:'10px'}}/>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'8px'}}>VIDEO EFFECTS</div>
      {cats.map(cat=>{
        const items = filtered.filter(e=>e.cat===cat);
        if(!items.length) return null;
        return (
          <div key={cat} style={{marginBottom:'10px'}}>
            <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,padding:'4px 0',borderBottom:'1px solid var(--border)',marginBottom:'5px'}}>{cat.toUpperCase()}</div>
            <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
              {items.map(fx=>(
                <div key={fx.name} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
                >
                  <span style={{fontSize:'13px',width:'18px',textAlign:'center',flexShrink:0}}>{fx.icon}</span>
                  <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>{fx.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,margin:'10px 0 8px'}}>AUDIO EFFECTS</div>
      <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
        {AUDIO_EFFECTS.map(fx=>(
          <div key={fx.name} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
          >
            <span style={{fontSize:'13px',width:'18px',textAlign:'center',flexShrink:0}}>{fx.icon}</span>
            <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>{fx.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// — TRANSITIONS PANEL —
function PanelTransitions() {
  const cats = [...new Set(TRANSITION_LIST.map(t=>t.cat))];
  const handleDragStart = (e: React.DragEvent, tr: typeof TRANSITION_LIST[0]) => {
    e.dataTransfer.setData('application/transition', JSON.stringify(tr));
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'10px'}}>VIDEO TRANSITIONS</div>
      {cats.map(cat=>(
        <div key={cat} style={{marginBottom:'10px'}}>
          <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,padding:'4px 0',borderBottom:'1px solid var(--border)',marginBottom:'5px'}}>{cat.toUpperCase()}</div>
          {TRANSITION_LIST.filter(t=>t.cat===cat).map(tr=>(
            <div key={tr.name} 
              draggable
              onDragStart={e => handleDragStart(e, tr)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'grab',transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
            >
              <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>{tr.name}</span>
              {tr.key && <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'monospace',background:'var(--bg-card)',padding:'1px 5px',borderRadius:'3px',border:'1px solid var(--border)'}}>{tr.key}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// — COLOR PANEL —
function PanelColor() {
  const [section,setSection] = useState<string[]>(['basic']);
  const [lut,setLut] = useState('');
  const [vals,setVals] = useState(COLOR_CONTROLS.map(c=>c.def));
  const toggle = (s:string) => setSection(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);

  const SectionHeader = ({id,label}:{id:string;label:string}) => (
    <div onClick={()=>toggle(id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',cursor:'pointer',marginBottom:'6px'}}>
      <span style={{fontSize:'10px',letterSpacing:'2px',color:section.includes(id)?'var(--accent)':'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>{label}</span>
      <span style={{color:'var(--text-muted)',fontSize:'10px'}}>{section.includes(id)?'▲':'▼'}</span>
    </div>
  );

  return (
    <div>
      {/* BASIC CORRECTION */}
      <SectionHeader id="basic" label="BASIC CORRECTION"/>
      {section.includes('basic') && (
        <div style={{marginBottom:'12px'}}>
          {COLOR_CONTROLS.map((c,i)=>(
            <div key={c.label} style={{marginBottom:'9px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                <span style={{fontSize:'11px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>{c.label}</span>
                <span style={{fontSize:'11px',color:c.color,fontFamily:'monospace'}}>{vals[i]>0?'+':''}{vals[i]}</span>
              </div>
              <input type="range" min={c.min} max={c.max} step={c.step} value={vals[i]} onChange={e=>{const n=[...vals];n[i]=Number(e.target.value);setVals(n);}} style={{width:'100%',accentColor:c.color,height:'3px',cursor:'pointer'}}/>
            </div>
          ))}
        </div>
      )}
      {/* CREATIVE / LUTS */}
      <SectionHeader id="creative" label="CREATIVE (LUTs)"/>
      {section.includes('creative') && (
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'8px'}}>
            {LUT_PRESETS.map(g=>(
              <button key={g} onClick={()=>setLut(p=>p===g?'':g)} style={{padding:'3px 8px',borderRadius:'5px',fontSize:'10px',fontFamily:'Syne,sans-serif',cursor:'pointer',background:lut===g?'var(--accent-dim)':'var(--bg-secondary)',border:`1px solid ${lut===g?'var(--accent)':'var(--border)'}`,color:lut===g?'var(--accent)':'var(--text-secondary)',transition:'all 0.15s'}}>{g}</button>
            ))}
          </div>
          <div style={{marginBottom:'6px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Intensity</span><span style={{fontSize:'11px',color:'var(--accent)',fontFamily:'monospace'}}>100%</span></div>
            <input type="range" min={0} max={100} defaultValue={100} style={{width:'100%',accentColor:'var(--accent)',height:'3px'}}/>
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Faded Film</span><span style={{fontSize:'11px',color:'#888899',fontFamily:'monospace'}}>0</span></div>
            <input type="range" min={0} max={100} defaultValue={0} style={{width:'100%',accentColor:'#888899',height:'3px'}}/>
          </div>
        </div>
      )}
      {/* CURVES */}
      <SectionHeader id="curves" label="CURVES"/>
      {section.includes('curves') && (
        <div style={{marginBottom:'12px'}}>
          <div style={{width:'100%',height:'120px',background:'#0A0A0E',border:'1px solid var(--border)',borderRadius:'8px',position:'relative',overflow:'hidden',cursor:'crosshair',marginBottom:'6px'}}>
            {/* Grid lines */}
            {[25,50,75].map(p=>(
              <div key={p}>
                <div style={{position:'absolute',left:`${p}%`,top:0,bottom:0,width:'1px',background:'rgba(255,255,255,0.04)'}}/>
                <div style={{position:'absolute',top:`${p}%`,left:0,right:0,height:'1px',background:'rgba(255,255,255,0.04)'}}/>
              </div>
            ))}
            {/* Default diagonal line */}
            <svg width="100%" height="100%" style={{position:'absolute',inset:0}}>
              <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            </svg>
            <div style={{position:'absolute',bottom:'6px',left:'50%',transform:'translateX(-50%)',fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>Click to add points</div>
          </div>
          <div style={{display:'flex',gap:'4px'}}>
            {['M','R','G','B'].map((ch,i)=>(<button key={ch} style={{flex:1,padding:'3px',borderRadius:'4px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:['var(--text-secondary)','#FF5555','#55FF55','#5599FF'][i],fontSize:'10px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700}}>{ch}</button>))}
          </div>
        </div>
      )}
      {/* COLOR WHEELS */}
      <SectionHeader id="wheels" label="COLOR WHEELS"/>
      {section.includes('wheels') && (
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex',gap:'8px',justifyContent:'space-between'}}>
            {['Shadows','Midtones','Highlights'].map((w,i)=>(
              <div key={w} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'50%',border:'2px solid var(--border)',background:'conic-gradient(#FF3B82,#FFD60A,#00FF94,#00E5FF,#7C5CFF,#FF3B82)',position:'relative',cursor:'crosshair',overflow:'hidden'}}>
                  <div style={{position:'absolute',inset:0,background:'radial-gradient(circle,rgba(0,0,0,0.7),transparent)'}}/>
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'white',boxShadow:'0 0 4px rgba(0,0,0,0.8)'}}/>
                  </div>
                </div>
                <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>{w}</span>
                <input type="range" min={-1} max={1} step={0.01} defaultValue={0} style={{width:'100%',accentColor:['#7C5CFF','#888899','#FFFFFF'][i],height:'3px'}}/>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* VIGNETTE */}
      <SectionHeader id="vignette" label="VIGNETTE"/>
      {section.includes('vignette') && (
        <div style={{marginBottom:'12px'}}>
          {[{l:'Amount',def:0},{l:'Midpoint',def:50},{l:'Feather',def:50}].map(c=>(
            <div key={c.l} style={{marginBottom:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'var(--text-secondary)'}}>{c.l}</span><span style={{fontSize:'11px',color:'var(--text-secondary)',fontFamily:'monospace'}}>{c.def}</span></div>
              <input type="range" min={-100} max={100} defaultValue={c.def} style={{width:'100%',accentColor:'var(--text-muted)',height:'3px'}}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// — ESSENTIAL SOUND PANEL —
function PanelSound() {
  const [type,setType] = useState<'dialogue'|'music'|'sfx'|'ambience'>('dialogue');
  const [ducking,setDucking] = useState(false);
  return (
    <div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'10px'}}>ESSENTIAL SOUND</div>
      <div style={{display:'flex',gap:'3px',marginBottom:'14px'}}>
        {(['dialogue','music','sfx','ambience'] as const).map(t=>(
          <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:'5px 2px',borderRadius:'6px',border:'none',cursor:'pointer',background:type===t?'var(--accent)':'var(--bg-secondary)',color:type===t?'white':'var(--text-secondary)',fontSize:'9px',fontFamily:'Syne,sans-serif',fontWeight:700,letterSpacing:'0.3px',textTransform:'capitalize',transition:'all 0.15s'}}>
            {t.charAt(0).toUpperCase()+t.slice(1,type===t?99:4)+(type!==t&&t.length>4?'.':'')}
          </button>
        ))}
      </div>

      {type==='dialogue' && (
        <div>
          <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'6px',borderBottom:'1px solid var(--border)',paddingBottom:'4px'}}>REPAIR</div>
          {['Reduce Noise','Reduce Reverb','De-Hum','De-Click'].map(f=>(
            <div key={f} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>{f}</span>
              <input type="range" min={0} max={100} defaultValue={0} style={{width:'60px',accentColor:'var(--cyan)',height:'3px'}}/>
            </div>
          ))}
          <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,margin:'10px 0 6px',borderBottom:'1px solid var(--border)',paddingBottom:'4px'}}>ENHANCE SPEECH (AI)</div>
          <button style={{width:'100%',padding:'8px',borderRadius:'8px',background:'linear-gradient(135deg,var(--accent-dim),var(--cyan-dim))',border:'1px solid rgba(124,92,255,0.3)',color:'var(--accent)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'8px'}}>🤖 Enhance Speech</button>
          <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,margin:'10px 0 6px',borderBottom:'1px solid var(--border)',paddingBottom:'4px'}}>LOUDNESS</div>
          <button style={{width:'100%',padding:'7px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:600}}>⊙ Auto-Match Loudness</button>
        </div>
      )}

      {type==='music' && (
        <div>
          <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'6px',borderBottom:'1px solid var(--border)',paddingBottom:'4px'}}>AUTO-DUCKING</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
            <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Enable Ducking</span>
            <button onClick={()=>setDucking(p=>!p)} style={{width:'36px',height:'20px',borderRadius:'10px',border:'none',background:ducking?'var(--accent)':'var(--border)',cursor:'pointer',position:'relative',transition:'all 0.2s'}}>
              <div style={{position:'absolute',top:'2px',left:ducking?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'white',transition:'all 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
            </button>
          </div>
          {ducking && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Duck Amount</span><span style={{fontSize:'11px',color:'var(--accent)',fontFamily:'monospace'}}>-12 dB</span></div>
              <input type="range" min={-30} max={-3} defaultValue={-12} style={{width:'100%',accentColor:'var(--accent)',height:'3px',marginBottom:'8px'}}/>
              <button style={{width:'100%',padding:'7px',borderRadius:'7px',background:'var(--accent-dim)',border:'1px solid rgba(124,92,255,0.3)',color:'var(--accent)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:700}}>🤖 Generate Keyframes</button>
            </div>
          )}
          <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,margin:'10px 0 6px',borderBottom:'1px solid var(--border)',paddingBottom:'4px'}}>AI REMIX TOOL</div>
          <button style={{width:'100%',padding:'8px',borderRadius:'8px',background:'linear-gradient(135deg,var(--cyan-dim),rgba(0,255,148,0.1))',border:'1px solid rgba(0,229,255,0.25)',color:'var(--cyan)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:700}}>🎵 Remix to Duration</button>
        </div>
      )}

      {(type==='sfx'||type==='ambience') && (
        <div>
          {['Reverb','Stereo Width'].map(f=>(
            <div key={f} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>{f}</span>
              <input type="range" min={0} max={100} defaultValue={0} style={{width:'60px',accentColor:'var(--pink)',height:'3px'}}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// — AUDIO MIXER —
function PanelMixer() {
  const tracks = [
    {label:'A1',color:'#00E5FF'},{label:'A2',color:'#00FF94'},{label:'A3',color:'#FF3B82'},{label:'MST',color:'#FFD60A'},
  ];
  return (
    <div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'12px'}}>AUDIO MIXER</div>
      <div style={{display:'flex',gap:'6px'}}>
        {tracks.map(t=>(
          <div key={t.label} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 4px'}}>
            <span style={{fontSize:'10px',fontFamily:'Syne,sans-serif',fontWeight:700,color:t.color}}>{t.label}</span>
            {/* VU meter */}
            <div style={{width:'12px',height:'80px',background:'var(--bg-card)',borderRadius:'3px',overflow:'hidden',position:'relative',border:'1px solid var(--border)'}}>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:'65%',background:`linear-gradient(to top,${t.color},${t.color}88,#FFD60A33)`,transition:'height 0.1s'}}/>
              {[0,25,50,75].map(p=>(
                <div key={p} style={{position:'absolute',left:0,right:0,bottom:`${p}%`,height:'1px',background:'var(--bg-primary)',opacity:0.5}}/>
              ))}
            </div>
            {/* Volume fader */}
            <input type="range" min={0} max={100} defaultValue={t.label==='MST'?85:75} style={{width:'70px',accentColor:t.color,height:'3px',cursor:'pointer',transform:'rotate(-90deg)',transformOrigin:'center',margin:'24px -24px'}}/>
            <div style={{marginTop:'24px',fontSize:'9px',color:'var(--text-secondary)',fontFamily:'monospace'}}>0dB</div>
            <div style={{display:'flex',gap:'3px'}}>
              <button style={{width:'18px',height:'14px',borderRadius:'2px',border:'none',cursor:'pointer',fontSize:'7px',background:'var(--bg-card)',color:'var(--text-muted)',fontWeight:700}}>M</button>
              <button style={{width:'18px',height:'14px',borderRadius:'2px',border:'none',cursor:'pointer',fontSize:'7px',background:'var(--bg-card)',color:'var(--text-muted)',fontWeight:700}}>S</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// — CAPTIONS —
function PanelCaptions() {
  const lines = [
    {t:'00:00:02',text:'The hunt begins with a bang'},
    {t:'00:00:05',text:'As the storm approaches...'},
    {t:'00:00:09',text:'Nothing can stop what\'s coming'},
    {t:'00:00:14',text:'Strike the heavens'},
  ];
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <span style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>TRANSCRIPTION</span>
        <div style={{display:'flex',gap:'4px'}}>
          <button style={{background:'linear-gradient(135deg,var(--accent-dim),var(--cyan-dim))',border:'1px solid rgba(124,92,255,0.3)',color:'var(--accent)',fontSize:'9px',borderRadius:'5px',padding:'3px 7px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700}}>🤖 Transcribe</button>
        </div>
      </div>
      <input placeholder="🔍 Search transcript..." style={{width:'100%',padding:'6px 10px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:'11px',outline:'none',marginBottom:'8px'}}/>
      <div style={{display:'flex',flexDirection:'column',gap:'4px',marginBottom:'12px'}}>
        {lines.map((l,i)=>(
          <div key={i} style={{padding:'7px 8px',borderRadius:'6px',background:'var(--bg-secondary)',border:'1px solid var(--border)',cursor:'pointer',transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{fontSize:'9px',color:'var(--accent)',fontFamily:'monospace',marginBottom:'2px'}}>{l.t}</div>
            <div style={{fontSize:'11px',color:'var(--text-primary)',lineHeight:1.4}}>{l.text}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'8px'}}>FILLER WORDS</div>
      <button style={{width:'100%',padding:'7px',borderRadius:'7px',background:'var(--pink-dim)',border:'1px solid rgba(255,59,130,0.25)',color:'var(--pink)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'6px'}}>🤖 Delete All Fillers (umm, uh, like…)</button>
      <button style={{width:'100%',padding:'7px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:600}}>Export SRT File</button>
    </div>
  );
}

// — AI TOOLS —
function PanelAI() {
  const tools = [
    {name:'Auto Reframe',    desc:'9:16, 1:1, 4:5 aspect ratios',   icon:'📐', color:'#7C5CFF'},
    {name:'Scene Detection', desc:'Auto-split at scene changes',     icon:'🎬', color:'#00E5FF'},
    {name:'Enhance Speech',  desc:'Studio quality from any mic',     icon:'🎙', color:'#00FF94'},
    {name:'Remix Tool',      desc:'Smart music duration trimming',   icon:'🎵', color:'#FF8C00'},
    {name:'AI Color Match',  desc:'Match look between clips',        icon:'🎨', color:'#FF3B82'},
    {name:'Auto-Duck Music', desc:'Lower music during dialogue',     icon:'🔊', color:'#FFD60A'},
    {name:'Frame Freeze',    desc:'Insert still frame segment',      icon:'⏸', color:'#7C5CFF'},
    {name:'Proxy Generate',  desc:'Low-res proxies for speed',       icon:'⚡', color:'#00E5FF'},
  ];
  return (
    <div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'10px'}}>AI TOOLS</div>
      <div style={{background:'linear-gradient(135deg,var(--accent-dim),var(--cyan-dim))',border:'1px solid rgba(124,92,255,0.2)',borderRadius:'10px',padding:'10px',marginBottom:'12px',textAlign:'center'}}>
        <div style={{fontSize:'18px',marginBottom:'4px'}}>🤖</div>
        <div style={{fontSize:'11px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:700}}>AI Features Ready</div>
        <div style={{fontSize:'10px',color:'var(--text-secondary)',marginTop:'2px'}}>Powered by Eclipso AI Engine</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {tools.map(t=>(
          <div key={t.name} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',cursor:'pointer',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color;e.currentTarget.style.background=`${t.color}0d`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-secondary)';}}
          >
            <span style={{fontSize:'18px',flexShrink:0}}>{t.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:'11px',fontWeight:700,fontFamily:'Syne,sans-serif',color:t.color}}>{t.name}</div>
              <div style={{fontSize:'9px',color:'var(--text-secondary)'}}>{t.desc}</div>
            </div>
            <span style={{fontSize:'10px',color:'var(--text-muted)',flexShrink:0}}>▶</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// — MARKERS PANEL —
function PanelMarkers({markers,onJump}:{markers:Marker[];onJump:(t:number)=>void}) {
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <span style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>MARKERS</span>
        <button style={{background:'var(--accent-dim)',border:'1px solid rgba(124,92,255,0.3)',color:'var(--accent)',fontSize:'10px',borderRadius:'5px',padding:'2px 8px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600}}>+ Add (M)</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'14px'}}>
        {markers.map(m=>(
          <div key={m.id} onClick={()=>onJump(m.time)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 8px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',cursor:'pointer',transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=m.color}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{width:'10px',height:'10px',borderRadius:'50%',background:m.color,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:'11px',fontWeight:600,color:'var(--text-primary)',fontFamily:'Syne,sans-serif'}}>{m.label}</div>
              <div style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'monospace'}}>0:00:{String(m.time).padStart(2,'0')}</div>
            </div>
            <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>✕</button>
          </div>
        ))}
      </div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'8px'}}>HISTORY</div>
      <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
        {['Add clip Thunder_Ben.mp4','Trim clip at 0:02:15','Apply Cross Dissolve','Color grade V1','Import BG_Music.wav','Split clip at 0:01:30','Delete gap'].map((h,i)=>(
          <div key={i} style={{padding:'5px 8px',borderRadius:'5px',fontSize:'10px',color:i===0?'var(--accent)':'var(--text-muted)',cursor:'pointer',background:i===0?'var(--accent-dim)':'transparent',transition:'all 0.15s',fontFamily:'DM Sans,sans-serif'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={e=>e.currentTarget.style.background=i===0?'var(--accent-dim)':'transparent'}
          >
            {i===0?'● ':''}{h}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  RIGHT PANEL — EFFECT CONTROLS
// ═══════════════════════════════════════════════════
function NumberScrubber({ value, onChange, min = -Infinity, max = Infinity, step = 1, unit = '' }: { value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number, unit?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(String(value));

  useEffect(() => { setTempVal(String(value)); }, [value]);

  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startVal = value;

    const move = (ev: MouseEvent) => {
      let delta = (ev.clientX - startX) * step;
      if (ev.shiftKey) delta *= 10;
      let newVal = startVal + delta;
      if (newVal < min) newVal = min;
      if (newVal > max) newVal = max;
      onChange(Math.round(newVal * 10) / 10);
    };

    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleBlur = () => {
    setIsEditing(false);
    let newVal = Number(tempVal);
    if (isNaN(newVal)) newVal = value;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    onChange(newVal);
  };

  if (isEditing) {
    return (
      <input 
        autoFocus 
        value={tempVal} 
        onChange={e => setTempVal(e.target.value)} 
        onBlur={handleBlur} 
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        style={{
          width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', 
          fontFamily: 'monospace', fontSize: '10px', outline: 'none'
        }}
      />
    );
  }

  return (
    <span 
      onMouseDown={handleDrag} 
      onClick={() => setIsEditing(true)} 
      style={{ cursor: 'ew-resize', color: 'var(--text-primary)', userSelect: 'none', flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}
    >
      {Number(value).toFixed(1)}{unit}
    </span>
  );
}

function RotationDial({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startVal = value;

    const move = (ev: MouseEvent) => {
      let delta = (startY - ev.clientY);
      if (ev.shiftKey) delta *= 5;
      let newVal = startVal + delta;
      if (newVal < -360) newVal = -360;
      if (newVal > 360) newVal = 360;
      onChange(Math.round(newVal));
    };

    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div 
      onMouseDown={handleDrag}
      style={{
        width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border)', 
        background: 'var(--bg-card)', position: 'relative', cursor: 'ns-resize', flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: '50%', height: '1.5px', 
        background: 'var(--accent)', transformOrigin: '0% 50%',
        transform: `translate(0%, -50%) rotate(${value - 90}deg)`
      }} />
    </div>
  );
}

function EffectControls({ clip, onChange, playheadUnits, onToggleKeyframing, onJumpToKeyframe }: { 
  clip: Clip | undefined, 
  onChange: (id: number, changes: Partial<Clip>) => void,
  playheadUnits: number,
  onToggleKeyframing: (id: number, prop: string) => void,
  onJumpToKeyframe: (id: number, prop: string, dir: 'prev'|'next') => void
}) {
  if (!clip) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '28px', marginBottom: '10px', opacity: 0.15 }}>🎛</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Select a clip in the timeline<br/>to view its effect controls</div>
      </div>
    </div>
  );

  const cv = (prop: string) => getClipValue(clip, prop, playheadUnits);
  const isKfing = (prop: string) => !!(clip.keyframes?.[prop]);
  const hasKfAtPlayhead = (prop: string) => {
    const kfs = clip.keyframes?.[prop];
    if (!kfs) return false;
    const relTime = playheadUnits - clip.start;
    return kfs.some(k => Math.abs(k.time - relTime) < 0.1);
  };

  const updateProp = (key: keyof Clip, val: number) => {
    onChange(clip.id, { [key]: val });
  };

  const PropRow = ({ label, prop, min, max, step, unit, dial }: { label: string, prop: string, min?: number, max?: number, step?: number, unit?: string, dial?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
      <div style={{ width: '75px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
        <button 
          onClick={() => onToggleKeyframing(clip.id, prop)}
          title="Enable keyframing" 
          style={{ 
            width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border)', 
            background: isKfing(prop) ? 'var(--accent)' : 'var(--bg-secondary)', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            flexShrink: 0, fontSize: '8px', color: isKfing(prop) ? 'white' : 'var(--text-muted)', padding: 0 
          }}
        >⏱</button>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'Syne,sans-serif' }}>{label}</span>
      </div>
      {dial && <RotationDial value={cv(prop)} onChange={v => updateProp(prop as any, v)} />}
      <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
        <NumberScrubber value={cv(prop)} onChange={v => updateProp(prop as any, v)} min={min} max={max} step={step} unit={unit} />
      </div>
      {isKfing(prop) && (
        <div style={{ display: 'flex', gap: '1px', flexShrink: 0 }}>
          <button onClick={() => onJumpToKeyframe(clip.id, prop, 'prev')} style={{ width: '12px', height: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '8px', padding: 0 }}>◀</button>
          <button style={{ width: '12px', height: '20px', background: hasKfAtPlayhead(prop) ? 'var(--accent-glow)' : 'transparent', border: `1px solid ${hasKfAtPlayhead(prop) ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '2px', color: hasKfAtPlayhead(prop) ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '7px', padding: 0 }}>◆</button>
          <button onClick={() => onJumpToKeyframe(clip.id, prop, 'next')} style={{ width: '12px', height: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '8px', padding: 0 }}>▶</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
      {/* Clip identity */}
      <div style={{ padding: '8px 10px', borderRadius: '7px', background: `${clip.color}12`, border: `1px solid ${clip.color}30`, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: clip.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Syne,sans-serif', color: clip.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.label}</div>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{clip.type} · Track {clip.trackId}</div>
        </div>
      </div>

      {/* MOTION section */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>▶ Motion</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => onChange(clip.id, { x: 0, y: 0, scale: 100, rotation: 0, anchorX: 960, anchorY: 540, keyframes: undefined })} title="Reset" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}>↺</button>
            <button title="Toggle" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px' }}>👁</button>
          </div>
        </div>

        <PropRow label="Position X" prop="x" />
        <PropRow label="Position Y" prop="y" />
        <PropRow label="Scale" prop="scale" min={0} max={500} unit="%" />
        <PropRow label="Rotation" prop="rotation" min={-360} max={360} unit="°" dial />
        <PropRow label="Anchor X" prop="anchorX" />
        <PropRow label="Anchor Y" prop="anchorY" />
      </div>

      {/* OPACITY */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>▶ Opacity</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px' }}>👁</button>
        </div>
        <PropRow label="Opacity" prop="opacity" min={0} max={100} unit="%" />
      </div>

      {/* TIME REMAPPING */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>▶ Time Remapping</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px' }}>👁</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '8px', color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏱</button>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Speed</span>
          <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 6px', display: 'flex', justifyContent: 'space-between', cursor: 'ew-resize' }}>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: clip.speed ? '#FFD60A' : 'var(--text-primary)' }}>{clip.speed || 100}%</span>
          </div>
        </div>
      </div>

      {/* ADD EFFECT */}
      <button style={{width:'100%',padding:'7px',borderRadius:'7px',background:'transparent',border:'1px dashed var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:600,marginBottom:'10px',transition:'all 0.2s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)';}}
      >+ Add Effect</button>

      {/* MASKING */}
      <div style={{padding:'8px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',marginBottom:'8px'}}>
        <div style={{fontSize:'10px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'6px'}}>MASKING</div>
        <div style={{display:'flex',gap:'4px'}}>
          {['⭕ Ellipse','▭ Rectangle','✒ Pen'].map(m=>(
            <button key={m} style={{flex:1,padding:'4px 2px',borderRadius:'5px',border:'1px solid var(--border)',background:'var(--bg-card)',color:'var(--text-secondary)',fontSize:'9px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)';}}
            >{m}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  EXPORT MODAL
// ═══════════════════════════════════════════════════
function ExportModal({onClose}:{onClose:()=>void}) {
  const [format,setFormat] = useState('H.264 MP4');
  const [res,setRes]       = useState('1080p (1920×1080)');
  const [fps,setFps]       = useState('30 fps');
  const [preset,setPreset] = useState('');
  const platforms = [{n:'YouTube',icon:'🎬',tag:'1080p H.264'},{n:'Reels/TikTok',icon:'📱',tag:'9:16 1080p'},{n:'Vimeo',icon:'🎥',tag:'4K ProRes'},{n:'Broadcast',icon:'📺',tag:'1080i 29.97'}];
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={onClose}>
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'20px',width:'100%',maxWidth:'480px',position:'relative',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,var(--accent),var(--cyan),var(--pink))'}}/>
        <div style={{padding:'24px 24px 0'}}>
          <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'18px',marginBottom:'16px',color:'var(--text-primary)'}}>Export Project</h2>
          {/* Platform presets */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'16px'}}>
            {platforms.map(p=>(
              <button key={p.n} onClick={()=>setPreset(p.n)} style={{padding:'7px 4px',borderRadius:'8px',border:`1px solid ${preset===p.n?'var(--accent)':'var(--border)'}`,background:preset===p.n?'var(--accent-dim)':'var(--bg-secondary)',cursor:'pointer',transition:'all 0.15s',textAlign:'center'}}>
                <div style={{fontSize:'16px',marginBottom:'3px'}}>{p.icon}</div>
                <div style={{fontSize:'9px',fontFamily:'Syne,sans-serif',fontWeight:700,color:preset===p.n?'var(--accent)':'var(--text-secondary)'}}>{p.n}</div>
                <div style={{fontSize:'8px',color:'var(--text-muted)'}}>{p.tag}</div>
              </button>
            ))}
          </div>
          {/* Settings */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
            {[
              {l:'Format',v:format,opts:['H.264 MP4','H.265 HEVC','ProRes 4444','WebM VP9','GIF'],set:setFormat},
              {l:'Resolution',v:res,opts:['4K UHD (3840×2160)','1080p (1920×1080)','720p','480p','Custom'],set:setRes},
              {l:'Frame Rate',v:fps,opts:['23.976 fps','24 fps','29.97 fps','30 fps','60 fps'],set:setFps},
              {l:'Bitrate',v:'VBR 2-pass',opts:['CBR','VBR 1-pass','VBR 2-pass','Auto'],set:()=>{}},
            ].map(f=>(
              <div key={f.l}>
                <div style={{fontSize:'9px',color:'var(--text-muted)',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'4px'}}>{f.l.toUpperCase()}</div>
                <select value={f.v} onChange={e=>f.set(e.target.value)} style={{width:'100%',padding:'7px 8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'7px',color:'var(--text-primary)',fontSize:'11px',outline:'none'}}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          {/* Est size */}
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',marginBottom:'14px'}}>
            <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>Estimated File Size</div>
            <div style={{fontSize:'10px',color:'var(--text-primary)',fontFamily:'monospace',fontWeight:700}}>~342 MB</div>
          </div>
        </div>
        <div style={{padding:'0 24px 24px',display:'flex',gap:'10px'}}>
          <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:'10px',background:'transparent',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,fontSize:'13px'}}>Cancel</button>
          <button style={{flex:1,padding:'11px',borderRadius:'10px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,fontSize:'13px'}}>+ Queue</button>
          <button style={{flex:2,padding:'11px',borderRadius:'10px',background:'var(--accent)',border:'none',color:'white',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'13px',boxShadow:'0 0 20px var(--accent-glow)'}}>🚀 Export</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  HISTORY PANEL
// ═══════════════════════════════════════════════════
function HistoryPanel({history,onJumpTo}:{history:{past:HistoryEntry[];present:HistoryEntry;future:HistoryEntry[]};onJumpTo:(idx:number)=>void}) {
  const all = [...history.past, history.present, ...history.future];
  const currentIdx = history.past.length;
  const fmt = (ts:number) => {
    const s = Math.floor((Date.now()-ts)/1000);
    if(s<60) return `${s}s ago`;
    if(s<3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };
  const actionIcon: Record<string,string> = {
    'Add':'➕','Cut':'✂','Delete':'🗑','Move':'↔','Trim':'◀▶','Source':'📥','Ripple':'⟪','Drag':'🖱',
    'Split':'✂','Import':'📂','Insert':'⤵','Overwrite':'⤴','Change':'⚙','Apply':'✨','Set':'⚡',
    'Clear':'🗑','Undo':'↩','Redo':'↪','Update':'📝','Create':'➕','Remove':'✕','Ripple Delete':'🗑',
  };
  const getIcon = (label:string) => {
    const key = Object.keys(actionIcon).find(k => label.startsWith(k));
    return key ? actionIcon[key] : '⚙';
  };
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <span style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>HISTORY</span>
        <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'monospace'}}>{all.length}/{MAX_HISTORY}</span>
      </div>
      {all.length<=1&&<div style={{fontSize:'10px',color:'var(--text-muted)',textAlign:'center',padding:'12px 0',opacity:0.5}}>No actions yet.<br/>Edit the timeline to record history.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
        {[...all].reverse().map((entry,revIdx)=>{
          const idx = all.length-1-revIdx;
          const isCurrent = idx===currentIdx;
          const isPast = idx<currentIdx;
          const isFuture = idx>currentIdx;
          return (
            <div key={entry.id} onClick={()=>onJumpTo(idx)}
              style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 8px',borderRadius:'6px',
                background:isCurrent?'var(--accent-dim)':isFuture?'transparent':'transparent',
                border:`1px solid ${isCurrent?'rgba(124,92,255,0.45)':'transparent'}`,
                cursor:'pointer',opacity:isFuture?0.35:1,transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background=isCurrent?'var(--accent-dim)':'var(--bg-hover)'}
              onMouseLeave={e=>e.currentTarget.style.background=isCurrent?'var(--accent-dim)':'transparent'}
            >
              <span style={{fontSize:'12px',flexShrink:0,opacity:isFuture?0.5:1}}>{getIcon(entry.label)}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'10px',fontWeight:isCurrent?700:400,fontFamily:'Syne,sans-serif',
                  color:isCurrent?'var(--accent)':isPast?'var(--text-primary)':'var(--text-muted)',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.label}</div>
                <div style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'monospace'}}>{idx===0?'Initial State':fmt(entry.timestamp)}</div>
              </div>
              {isCurrent&&<div style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--accent)',flexShrink:0,boxShadow:'0 0 6px var(--accent-glow)'}}/>}
            </div>
          );
        })}
      </div>
      {history.future.length>0&&(
        <div style={{marginTop:'8px',padding:'6px 8px',borderRadius:'6px',background:'rgba(255,214,10,0.06)',border:'1px solid rgba(255,214,10,0.2)',fontSize:'9px',color:'var(--yellow)',fontFamily:'Syne,sans-serif',textAlign:'center'}}>
          ↪ {history.future.length} redo action{history.future.length>1?'s':''} available (Ctrl+Shift+Z)
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MOBILE LAYOUT (kept from previous)
// ═══════════════════════════════════════════════════
function MobileEditor({clips,isPlaying,setIsPlaying,playheadPct,setPlayheadPct,timecode,selectedClip,setSelectedClip,onImportMedia,onImportTrack,showExport,setShowExport,notification}:{clips:Clip[];isPlaying:boolean;setIsPlaying:(v:boolean)=>void;playheadPct:number;setPlayheadPct:(v:number)=>void;timecode:string;selectedClip:number|null;setSelectedClip:(v:number|null)=>void;onImportMedia:(l:string)=>void;onImportTrack:(t:typeof MUSIC_TRACKS_DATA[0])=>void;showExport:boolean;setShowExport:(v:boolean)=>void;notification:string|null}) {
  const [activeTab,setActiveTab]=useState<MobileTab>(null);
  const videoClips=clips.filter(c=>c.type==='video'&&c.trackId===3);
  const audioClips=clips.filter(c=>c.type==='audio'&&c.trackId===5);
  const TABS=[{id:'videos' as MobileTab,icon:'📹',label:'Videos and images'},{id:'music' as MobileTab,icon:'🎵',label:'Music and audio'},{id:'titles' as MobileTab,icon:'T',label:'Titles and captions'}];
  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#0A0A0C',overflow:'hidden',WebkitUserSelect:'none',userSelect:'none'}}>
      {/* Top bar */}
      <div style={{height:'52px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',background:'#0A0A0C'}}>
        <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
          <Link href="/" style={{color:'var(--text-secondary)',display:'flex',textDecoration:'none'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></Link>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',display:'flex',padding:0}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',display:'flex',padding:0}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></button>
        </div>
        <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'14px',color:'var(--text-primary)',letterSpacing:'0.5px'}}>Strike_the_Heavens</span>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#FFD60A,#FF8C00)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 3h14v2H5v-2z"/></svg></div>
          <button onClick={()=>setShowExport(true)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',display:'flex',padding:0}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
        </div>
      </div>
      {/* Monitor */}
      <div style={{flex:1,minHeight:0,background:'#000',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0a0020,#000510,#050005)'}}/>
        <div style={{position:'relative',zIndex:1,fontSize:'10px',color:'rgba(255,255,255,0.08)',fontFamily:'Syne,sans-serif',letterSpacing:'3px',fontWeight:700}}>STRIKE THE HEAVENS</div>
        <div style={{position:'absolute',bottom:'10px',left:'12px',fontFamily:'monospace',fontSize:'11px',color:'rgba(255,214,10,0.8)',fontWeight:700}}>{timecode}</div>
      </div>
      {/* Transport */}
      <div style={{height:'56px',flexShrink:0,background:'#0D0D10',display:'flex',alignItems:'center',padding:'0 20px',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',gap:'16px',flex:1}}><button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0,fontSize:'18px'}}>≡</button><button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0,fontSize:'16px'}}>◆</button></div>
        <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-primary)',padding:0}}><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8v16zM5 4h2v16H5z"/></svg></button>
          <button onClick={()=>setIsPlaying(!isPlaying)} style={{width:'48px',height:'48px',borderRadius:'50%',background:isPlaying?'var(--accent)':'white',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isPlaying?'0 0 20px var(--accent-glow)':'0 4px 16px rgba(0,0,0,0.4)',transition:'all 0.2s',flexShrink:0}}>
            {isPlaying?<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>:<svg width="18" height="18" viewBox="0 0 24 24" fill="#0A0A0C" style={{marginLeft:'2px'}}><polygon points="5 3 19 12 5 21 5 3"/></svg>}
          </button>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-primary)',padding:0}}><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4zM19 4h2v16h-2z"/></svg></button>
        </div>
        <div style={{display:'flex',gap:'16px',flex:1,justifyContent:'flex-end'}}>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1021 12"/></svg></button>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 7v6h-6"/><path d="M21 13A9 9 0 113 12"/></svg></button>
        </div>
      </div>
      {/* Timeline */}
      <div style={{background:'#0A0A0C',flexShrink:0,borderBottom:'1px solid var(--border)',height:activeTab?'130px':'150px',transition:'height 0.3s cubic-bezier(0.16,1,0.3,1)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{height:'26px',flexShrink:0,overflowX:'auto',background:'#0D0D10',borderBottom:'1px solid var(--border)',position:'relative'}} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setPlayheadPct(Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100)));}}>
          <div style={{minWidth:'800px',width:'100%',height:'100%',position:'relative'}}>
            {[8,10,12,14,16,18,20,22,24].map(s=>(
              <div key={s} style={{position:'absolute',left:`${(s/32)*100}%`,bottom:'4px',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'monospace',whiteSpace:'nowrap'}}>0:{String(s).padStart(2,'0')}</span>
              </div>
            ))}
            <div style={{position:'absolute',left:`${playheadPct}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',zIndex:10,boxShadow:'0 0 8px rgba(255,214,10,0.6)'}}>
              <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'7px solid var(--yellow)'}}/>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowX:'auto',position:'relative'}}>
          <div style={{minWidth:'800px',height:'100%',position:'relative'}}>
            <div style={{height:'60%',borderBottom:'1px solid var(--border)',position:'relative',background:'rgba(124,92,255,0.03)'}}>
              {videoClips.map(c=>(
                <div key={c.id} onClick={()=>setSelectedClip(c.id===selectedClip?null:c.id)} style={{position:'absolute',left:`${c.start*0.15}%`,width:`${c.width*0.15}%`,top:'5px',bottom:'5px',background:`${c.color}22`,border:`1.5px solid ${c.color}${selectedClip===c.id?'ff':'55'}`,borderRadius:'5px',overflow:'hidden',cursor:'pointer'}}>
                  <div style={{position:'absolute',bottom:'2px',left:'4px',fontSize:'8px',color:c.color,fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'90%'}}>{c.label.replace('.mp4','')}</div>
                </div>
              ))}
              <div style={{position:'absolute',left:`${playheadPct}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',opacity:0.9,zIndex:5,pointerEvents:'none'}}/>
            </div>
            <div style={{height:'40%',position:'relative',background:'rgba(0,229,255,0.03)'}}>
              {audioClips.map(c=>(
                <div key={c.id} style={{position:'absolute',left:`${c.start*0.15}%`,width:`${c.width*0.15}%`,top:'3px',bottom:'3px',background:`${c.color}18`,border:`1px solid ${c.color}40`,borderRadius:'4px',overflow:'hidden'}}>
                  <ClipWave color={c.color} n={Math.floor(c.width*0.18)}/>
                </div>
              ))}
              <div style={{position:'absolute',left:`${playheadPct}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',opacity:0.9,zIndex:5,pointerEvents:'none'}}/>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom panel */}
      <div style={{height:activeTab?'240px':0,overflow:'hidden',transition:'height 0.3s cubic-bezier(0.16,1,0.3,1)',background:'#0D0D10',borderTop:activeTab?'1px solid var(--border)':'none',overflowY:activeTab?'auto':'hidden'}}>
        {activeTab==='videos' && (
          <div style={{padding:'14px'}}>
            <div style={{fontSize:'10px',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px'}}>MEDIA FILES</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              <button style={{aspectRatio:'1',borderRadius:'10px',border:'2px dashed var(--border)',background:'var(--bg-card)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',cursor:'pointer'}}><span style={{fontSize:'22px',color:'var(--accent)'}}>+</span><span style={{fontSize:'10px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>Add</span></button>
              {['Strike_the_H','Thunder_Ben','Thunder_at','Overlay'].map((n,i)=>(
                <button key={i} onClick={()=>onImportMedia(`${n}.mp4`)} style={{aspectRatio:'1',borderRadius:'10px',border:'1px solid var(--border)',background:'rgba(124,92,255,0.1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',cursor:'pointer'}}>
                  <span style={{fontSize:'20px'}}>🎬</span>
                  <span style={{fontSize:'8px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:600,textAlign:'center',padding:'0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab==='music' && (
          <div style={{padding:'14px'}}>
            <div style={{fontSize:'10px',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px'}}>MUSIC LIBRARY</div>
            <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
              {MUSIC_TRACKS_DATA.map(t=>(
                <div key={t.id} onClick={()=>onImportTrack(t)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px',borderRadius:'10px',background:`${t.accent}0d`,border:`1px solid ${t.accent}25`,cursor:'pointer'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'8px',background:`${t.accent}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:'16px'}}>🎵</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'12px',fontWeight:700,fontFamily:'Syne,sans-serif',color:'var(--text-primary)'}}>{t.title}</div>
                    <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>{t.artist} · {t.bpm} BPM</div>
                  </div>
                  <button style={{width:'28px',height:'28px',borderRadius:'50%',background:t.accent,border:'none',color:'white',fontSize:'12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab==='titles' && (
          <div style={{padding:'14px'}}>
            <div style={{fontSize:'10px',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px'}}>TEXT & TITLES</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {[{n:'Lower Third',i:'▬',c:'#7C5CFF'},{n:'Title Card',i:'≡',c:'#00E5FF'},{n:'Subtitle',i:'—',c:'#FF3B82'},{n:'End Screen',i:'⏹',c:'#00FF94'},{n:'Name Tag',i:'👤',c:'#FF8C00'},{n:'Animated',i:'✨',c:'#FFD60A'}].map((p,i)=>(
                <button key={i} style={{padding:'12px 6px',borderRadius:'10px',border:`1px solid ${p.c}28`,background:`${p.c}0d`,display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',cursor:'pointer'}}>
                  <span style={{fontSize:'18px'}}>{p.i}</span>
                  <span style={{fontSize:'9px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:600,textAlign:'center'}}>{p.n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Bottom tabs */}
      <div style={{flexShrink:0,background:'#0A0A0C',borderTop:'1px solid var(--border)',display:'flex',paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
        {TABS.map(tab=>{
          const active=activeTab===tab.id;
          return (
            <button key={tab.id} onClick={()=>setActiveTab(p=>p===tab.id?null:tab.id)} style={{flex:1,border:'none',cursor:'pointer',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',padding:'10px 4px 12px',color:active?'var(--accent)':'var(--text-secondary)',transition:'color 0.2s',position:'relative'}}>
              {active&&<div style={{position:'absolute',top:0,left:'15%',right:'15%',height:'2px',background:'var(--accent)',borderRadius:'0 0 2px 2px'}}/>}
              <span style={{fontSize:'20px'}}>{tab.icon}</span>
              <span style={{fontSize:'9px',fontFamily:'Syne,sans-serif',fontWeight:600,textAlign:'center',lineHeight:1.2}}>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {showExport&&<ExportModal onClose={()=>setShowExport(false)}/>}
      {notification&&<div style={{position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',zIndex:2000,padding:'9px 18px',borderRadius:'9px',background:'var(--bg-card)',border:'1px solid var(--accent)',fontSize:'12px',fontFamily:'Syne,sans-serif',fontWeight:600,color:'var(--accent)',boxShadow:'0 8px 30px rgba(0,0,0,0.5)',whiteSpace:'nowrap',animation:'fadeInUp 0.3s ease'}}>✓ {notification}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MAIN EDITOR
// ═══════════════════════════════════════════════════
export default function EditorPage() {
  const [activeTool,setActiveTool]     = useState<ToolId>('select');
  const [leftTab,setLeftTab]           = useState<LeftTab>('media');
  const [rightTab,setRightTab]         = useState<RightTab>('effectcontrols');
  const [workspace,setWorkspace]       = useState<Workspace>('editing');
  const [tracks,setTracks]             = useState<Track[]>(initTracks);

  const [history, dispatch] = useReducer(
    (state: HistoryState, action: {type:'PUSH'; label:string; clips:Clip[]; transitions:Transition[]} | {type:'UNDO'} | {type:'REDO'} | {type:'SET'; clips?:Clip[]; transitions?:Transition[]} | {type:'JUMP_TO'; index:number}) => {
      switch (action.type) {
        case 'PUSH':
          const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
          return {
            past: newPast,
            present: { id: Date.now(), label: action.label, clips: action.clips, transitions: action.transitions, timestamp: Date.now() },
            future: []
          };
        case 'UNDO':
          if (state.past.length === 0) return state;
          const prev = state.past[state.past.length - 1];
          return {
            past: state.past.slice(0, -1),
            present: prev,
            future: [state.present, ...state.future]
          };
        case 'REDO':
          if (state.future.length === 0) return state;
          const next = state.future[0];
          return {
            past: [...state.past, state.present],
            present: next,
            future: state.future.slice(1)
          };
        case 'SET': // silent set without history
          return { 
            ...state, 
            present: { 
              ...state.present, 
              clips: action.clips ?? state.present.clips, 
              transitions: action.transitions ?? state.present.transitions 
            } 
          };
        case 'JUMP_TO':
          const all = [...state.past, state.present, ...state.future];
          if (action.index < 0 || action.index >= all.length) return state;
          return {
            past: all.slice(0, action.index),
            present: all[action.index],
            future: all.slice(action.index + 1)
          };
        default: return state;
      }
    },
    { past: [], present: { id: Date.now(), label: 'Initial State', clips: initClips(), transitions: [], timestamp: Date.now() }, future: [] }
  );

  const clips = history.present?.clips ?? [];
  const transitions = history.present?.transitions ?? [];

  const setClips = useCallback((newClipsOrUpdater: Clip[] | ((prev: Clip[]) => Clip[])) => {
    dispatch({ type: 'SET', clips: typeof newClipsOrUpdater === 'function' ? (newClipsOrUpdater as (prev: Clip[]) => Clip[])(clips) : newClipsOrUpdater });
  }, [clips]);

  const setTransitions = useCallback((newTransitionsOrUpdater: Transition[] | ((prev: Transition[]) => Transition[])) => {
    dispatch({ type: 'SET', transitions: typeof newTransitionsOrUpdater === 'function' ? (newTransitionsOrUpdater as (prev: Transition[]) => Transition[])(transitions) : newTransitionsOrUpdater });
  }, [transitions]);

  const applyAction = useCallback((label: string, newClips: Clip[], newTransitions?: Transition[]) => {
    dispatch({ type: 'PUSH', label, clips: newClips, transitions: newTransitions ?? transitions });
  }, [transitions]);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  
  const jumpToHistory = useCallback((idx: number) => {
    dispatch({ type: 'JUMP_TO', index: idx });
  }, []);

  const [markers,setMarkers]           = useState<Marker[]>(initMarkers);
  const [isPlaying,setIsPlaying]       = useState(false);
  const [playheadPos,setPlayheadPos]   = useState(38);
  const [zoom,setZoom]                 = useState(1);
  const [selectedClipIds, setSelectedClipIds] = useState<number[]>([]);
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ clipId: number, prop: string, kfId: number } | null>(null);
  const [marqueeSelection, setMarqueeSelection] = useState<{ startX: number; startY: number; currentX: number; currentY: number; isActive: boolean } | null>(null);
  const [timecode,setTimecode]         = useState('00:00:38;14');
  const [showExport,setShowExport]     = useState(false);
  const [notification,setNotification] = useState<string|null>(null);
  const [isMobile,setIsMobile]         = useState(false);
  const [leftWidth]                    = useState(260);
  const [razorLinePos, setRazorLinePos] = useState<number|null>(null);
  
  // Snapping State
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const [snapLineUnits, setSnapLineUnits]     = useState<number|null>(null);
  
  // File Management State
  const [projectFiles, setProjectFiles]       = useState<ProjectFile[]>([]);
  const fileInputRef                          = useRef<HTMLInputElement>(null);
  
  // Source Monitor State
  const [sourceClip, setSourceClip] = useState<{label:string, color:string, type:'video'|'audio', duration:number, url?:string}|null>(null);
  const [sourceIsPlaying, setSourceIsPlaying] = useState(false);
  const [sourcePlayheadPct, setSourcePlayheadPct] = useState(0);
  const [sourceInPct, setSourceInPct]     = useState(0);
  const [sourceOutPct, setSourceOutPct]   = useState(100);

  const [dragState, setDragState]       = useState<{clipId:number;startX:number;clipOffsets:Record<number, {start:number, trackId:number}>}|null>(null);
  const [dragNewState, setDragNewState] = useState<{type:'video'|'audio', label:string, color:string, duration?:number, url?:string, sourceOffset?:number}|null>(null);
  const [dragNewPos, setDragNewPos]     = useState<{trackId:number, start:number}|null>(null);
  const [dragOverTrackId, setDragOverTrackId] = useState<number|null>(null);
  const [edgeDragState, setEdgeDragState] = useState<{clipId:number, edge:'left'|'right', startX:number, initialStart:number, initialWidth:number, sourceWidth:number}|null>(null);
  const [trimTooltip, setTrimTooltip]     = useState<{x:number, y:number, text:string}|null>(null);
  const [gapContextMenu, setGapContextMenu] = useState<{x:number, y:number, gap:{trackId:number, start:number, width:number}}|null>(null);
  const tlRef           = useRef<HTMLDivElement>(null);
  const tracksAreaRef   = useRef<HTMLDivElement>(null);
  const dragMovedRef    = useRef(false);
  // Ref to store drag item data — bypasses React stale closure in drag event handlers
  const dragNewItemRef  = useRef<{type:'video'|'audio', label:string, color:string, duration?:number, url?:string, sourceOffset?:number}|null>(null);

  const stateRef = useRef<{clips:Clip[], selectedClipIds:number[], selectedKeyframe: { clipId: number, prop: string, kfId: number } | null}>({ clips, selectedClipIds, selectedKeyframe });
  useEffect(() => { stateRef.current = { clips, selectedClipIds, selectedKeyframe }; }, [clips, selectedClipIds, selectedKeyframe]);

  // Ref for clip history (for undo during drag operations)
  const historyRef = useRef<Clip[][]>([]);
  
  const sourceStateRef = useRef({ playhead: 0 });
  useEffect(() => { sourceStateRef.current.playhead = sourcePlayheadPct; }, [sourcePlayheadPct]);

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768);
    check();
    window.addEventListener('resize',check);
    return ()=>window.removeEventListener('resize',check);
  },[]);

  const notify=(msg:string)=>{setNotification(msg);setTimeout(()=>setNotification(null),2500);};

  // ── KEYBOARD SHORTCUTS: V=Select, C=Razor, Ctrl+Z=Undo ──
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement) return;
      if(!e.ctrlKey&&!e.metaKey){
        if(e.key==='v'||e.key==='V'){ setActiveTool('select'); setRazorLinePos(null); }
        if(e.key==='a'||e.key==='A'){ setActiveTool('track_fwd'); setRazorLinePos(null); }
        if(e.key==='c'||e.key==='C'){ setActiveTool('razor'); }
        if(e.key==='b'||e.key==='B'){ setActiveTool('ripple'); setRazorLinePos(null); }
        if(e.key==='s'||e.key==='S'){ setSnappingEnabled(p=>!p); notify(snappingEnabled?'🧲 Snapping Off':'🧲 Snapping On'); }
        if(e.key==='i'||e.key==='I'){ setSourceInPct(sourceStateRef.current.playhead); }
        if(e.key==='o'||e.key==='O'){ setSourceOutPct(sourceStateRef.current.playhead); }
        if(e.code==='Space') {
           e.preventDefault();
           setIsPlaying(p=>!p);
        }
        if(e.key==='Delete'||e.key==='Backspace') {
           const { clips: curClips, selectedClipIds: curSels, selectedKeyframe: curKf } = stateRef.current;
           if (curKf) {
              e.preventDefault();
              const nextClips = curClips.map(c => {
                if (c.id !== curKf.clipId || !c.keyframes?.[curKf.prop]) return c;
                const nextKfs = { ...c.keyframes };
                nextKfs[curKf.prop] = nextKfs[curKf.prop].filter(k => k.id !== curKf.kfId);
                if (nextKfs[curKf.prop].length === 0) delete nextKfs[curKf.prop];
                return { ...c, keyframes: Object.keys(nextKfs).length > 0 ? nextKfs : undefined };
              });
              applyAction(`Delete keyframe`, nextClips);
              setSelectedKeyframe(null);
              notify('Keyframe deleted');
           } else if (curSels.length > 0) {
              e.preventDefault();
              const newClips = curClips.filter(c => !curSels.includes(c.id));
              applyAction(`Delete ${curSels.length} clip(s)`, newClips);
              setSelectedClipIds([]);
              notify(`Deleted ${curSels.length} clip(s)`);
           }
        }
      }
      if((e.ctrlKey||e.metaKey)){
         if(e.key==='z'||e.key==='Z'){
            if (e.shiftKey) { e.preventDefault(); redo(); }
            else { e.preventDefault(); undo(); }
         }
         else if(e.key==='y'||e.key==='Y'){ e.preventDefault(); redo(); }
         else if(e.key==='i'||e.key==='I'){ e.preventDefault(); fileInputRef.current?.click(); }
         else if(e.key==='a'||e.key==='A'){
            e.preventDefault();
            setSelectedClipIds(stateRef.current.clips.map(c => c.id));
            notify('Selected all clips');
         }
         else if((e.shiftKey && (e.key==='d'||e.key==='D')) || ((e.ctrlKey||e.metaKey) && (e.key==='d'||e.key==='D'))){
            e.preventDefault();
            const { clips: curClips, selectedClipIds: curSels } = stateRef.current;
            if (curSels.length === 2) {
               const c1 = curClips.find(c => c.id === curSels[0]);
               const c2 = curClips.find(c => c.id === curSels[1]);
               if (c1 && c2 && c1.trackId === c2.trackId) {
                  const ordered = [c1, c2].sort((a,b) => a.start - b.start);
                  const gap = ordered[1].start - (ordered[0].start + ordered[0].width);
                  if (Math.abs(gap) < 5) {
                     const startTime = ordered[1].start - 7.5;
                     const newTr: Transition = { id: Date.now(), trackId: c1.trackId, startTime, duration: 15, type: 'Cross Dissolve' };
                     applyAction('Apply Cross Dissolve', curClips, [...transitions, newTr]);
                     notify('Cross Dissolve applied (Shift+D)');
                  }
               }
            }
         }
      }
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[]);

  // Timeline Playback loop
  useEffect(() => {
    let req: number;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      if (dt > 0) {
         setPlayheadPos(p => {
             const playheadUnits = p / (zoom * 0.14);
             const newUnits = playheadUnits + ((dt / 1000) * 15);
             let pct = newUnits * (zoom * 0.14);
             if (pct > 100) pct = 0; // loop back
             return pct;
         });
      }
      req = requestAnimationFrame(loop);
    };
    if (isPlaying) {
      req = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(req);
  }, [isPlaying, zoom]);

  const handleProcessUploadedFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles: ProjectFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isAudio && !isImage) continue;

      let type: 'video' | 'audio' | 'image' = isVideo ? 'video' : isAudio ? 'audio' : 'image';
      let color = isVideo ? '#9966FF' : isAudio ? '#00E5FF' : '#FFD60A';
      let duration = 150; // default timeline units
      let thumbnailUrl = '';
      
      if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => {
            duration = Math.max(30, Math.round(video.duration * 15)); 
            video.currentTime = Math.min(1, video.duration / 2); // get frame at 1s
          };
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(video, 0, 0, 160, 90);
            thumbnailUrl = canvas.toDataURL('image/jpeg');
            resolve();
          };
          video.onerror = () => resolve(); 
        });
      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.src = url;
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
             duration = Math.max(30, Math.round(audio.duration * 15));
             resolve();
          };
          audio.onerror = () => resolve();
        });
      } else if (isImage) {
        thumbnailUrl = url;
        duration = 75; // 5 seconds roughly
      }
      
      newFiles.push({
        id: Date.now().toString() + i,
        name: file.name,
        type,
        duration,
        color,
        url,
        thumbnailUrl,
        hasAudio: isVideo || isAudio 
      });
    }
    
    if (newFiles.length) {
      setProjectFiles(prev => [...prev, ...newFiles]);
      notify(`Imported ${newFiles.length} file(s)`);
    }
  };

  const handleImportMedia=(f:ProjectFile|string)=>{
    let label = typeof f === 'string' ? f : f.name;
    let color = typeof f === 'string' ? '#9966FF' : f.color;
    let type = typeof f === 'string' ? 'video' : f.type;
    let trackId = type === 'audio' ? 4 : 3;
    let width = typeof f === 'string' ? 130 : f.duration || 150;
    let url = typeof f === 'string' ? undefined : f.url;
    setClips(p=>[...p,{id:Date.now(),trackId,start: Math.round(playheadPos/(zoom*0.14)) || 0,width,label,color,type:type as 'video'|'audio',url,sourceOffset:0,sourceWidth:width}]);
    notify(`"${label}" added to timeline`);
  };
  const handleImportTrack=(t:typeof MUSIC_TRACKS_DATA[0])=>{
    setClips(p=>[...p,{id:Date.now(),trackId:5,start:0,width:420,label:`${t.title} — ${t.artist}`,color:t.accent,type:'audio'}]);
    notify(`"${t.title}" imported to A2`);
  };
  const handleOpenSource=(item:any)=>{
    setSourceClip({ label: item.label, type: item.type, color: item.color, duration: item.duration || 150, url: item.url });
    setSourcePlayheadPct(0);
    setSourceInPct(0);
    setSourceOutPct(100);
    setSourceIsPlaying(false);
  };
  const handleSourceInsert = (mode: 'insert' | 'overwrite') => {
      if (!sourceClip) return;
      
      const inP = Math.min(sourceInPct, sourceOutPct);
      const outP = Math.max(sourceInPct, sourceOutPct);
      const widthUnits = Math.max(1, Math.round((outP - inP) / 100 * sourceClip.duration));
      
      const targetTrackId = sourceClip.type === 'video' ? 3 : 5;
      const insertStart = Math.round(playheadPos / (zoom * 0.14));
      
      let newClips = [...clips];
      if (mode === 'insert') {
         // Push existing clips forward on the target track
         newClips = newClips.map(c => {
            if (c.trackId === targetTrackId && c.start >= insertStart) {
               return { ...c, start: c.start + widthUnits };
            }
            return c;
         });
      } else {
         // Overwrite: remove parts of clips that overlap
         newClips = newClips.filter(c => {
            if (c.trackId !== targetTrackId) return true;
            if (c.start >= insertStart && c.start + c.width <= insertStart + widthUnits) return false;
            return true;
         }).map(c => {
            if (c.trackId === targetTrackId) {
               if (c.start < insertStart && c.start + c.width > insertStart) {
                  return { ...c, width: insertStart - c.start };
               }
               if (c.start >= insertStart && c.start < insertStart + widthUnits) {
                   const diff = (insertStart + widthUnits) - c.start;
                   return { ...c, start: c.start + diff, width: Math.max(0, c.width - diff) };
               }
            }
            return c;
         }).filter(c => c.width > 0);
      }
      
      const newClip: Clip = {
         id: Date.now(),
         trackId: targetTrackId,
         start: insertStart,
         width: widthUnits,
         label: sourceClip.label,
         color: sourceClip.color,
         type: sourceClip.type,
         sourceWidth: sourceClip.duration,
         url: sourceClip.url,
         sourceOffset: Math.min(sourceInPct, sourceOutPct) / 100 * sourceClip.duration
      };
      
      const nextClips = [...newClips, newClip];
      applyAction(`Source ${mode} "${sourceClip.label}"`, nextClips);
      notify(`Source ${mode} completed`);
  };

  const handleTLClick=(e:React.MouseEvent<HTMLDivElement>)=>{
    if(!tlRef.current) return;
    const r=tlRef.current.getBoundingClientRect();
    const pct=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100));
    setPlayheadPos(pct);
    if(activeTool==='select') {
      setSelectedClipIds([]);
      setSelectedKeyframe(null);
    }
  };

  const handleTracksMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select' || e.button !== 0) return;
    setSelectedKeyframe(null);
    
    // Start marquee selection if clicking on tracks background
    const r = tracksAreaRef.current?.getBoundingClientRect();
    if (r) {
      setMarqueeSelection({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        isActive: false 
      });
    }
  };

  // ── RAZOR: split clip at click position ──
  const handleRazorSplit=(e:React.MouseEvent,clip:Clip)=>{
    e.stopPropagation();
    if(!tlRef.current) return;
    const r=tlRef.current.getBoundingClientRect();
    const pct=((e.clientX-r.left)/r.width)*100;
    const splitUnit=Math.round(pct/(zoom*0.14));
    if(splitUnit<=clip.start||splitUnit>=(clip.start+clip.width)) return;
    const id1=Date.now(), id2=id1+1;
    const left:Clip ={...clip,id:id1,width:splitUnit-clip.start};
    const right:Clip={...clip,id:id2,start:splitUnit,width:(clip.start+clip.width)-splitUnit};
    const nextClips = clips.filter(c=>c.id!==clip.id).concat([left,right]);
    applyAction(`Cut clip "${clip.label}"`, nextClips);
    setActiveTool('select');
    setSelectedClipIds([id1]);
    notify('✂ Clip split · Ctrl+Z to undo');
  };

  // ── DRAG: global mouse-up ends clip drag ──
  useEffect(()=>{
    const onUp=()=>{
       dragNewItemRef.current = null;  // always clear on mouseup
       setDragState(null); setDragNewState(null); setDragNewPos(null); setDragOverTrackId(null);
       setEdgeDragState(null); setTrimTooltip(null);
       setSnapLineUnits(null);
       setMarqueeSelection(null);
    };
    window.addEventListener('mouseup',onUp);
    return ()=>window.removeEventListener('mouseup',onUp);
  },[]);
  // ── NEW CLIP DRAG START ──
  const handleDragStartNewItem = (e:React.DragEvent, item:{type:'video'|'audio', label:string, color:string, duration?:number, url?:string, sourceOffset?:number}) => {
    e.dataTransfer.setData('text/plain', item.label);
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
    dragNewItemRef.current = item;  // store in ref for stale-closure-safe access
    setDragNewState(item);
  };

  // ── NEW CLIP DRAG OVER (GHOST) ──
  const handleDragOver = (e:React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // allow drop
    // Read from ref (not state) to avoid stale closure
    const item = dragNewItemRef.current;
    if (!item || !tracksAreaRef.current || !tlRef.current) return;
    const r=tlRef.current.getBoundingClientRect();
    const pct=((e.clientX-r.left)/r.width)*100;
    const newStart=Math.max(0, Math.round(pct/(zoom*0.14)));

    const areaRect=tracksAreaRef.current.getBoundingClientRect();
    let relY=e.clientY-areaRect.top;
    let targetTrack:Track|null=null;
    for(const t of tracks){
      if(relY<t.height){ targetTrack=t; break; }
      relY-=t.height;
    }

    if (targetTrack && targetTrack.type !== 'caption') {
       // Accept drop on any non-caption track; type mismatch handled in handleDrop
       setDragNewPos({ trackId: targetTrack.id, start: newStart });
       setDragOverTrackId(targetTrack.id);
    } else {
       setDragNewPos(null);
       setDragOverTrackId(null);
    }
  };

  // ── NEW CLIP DROP ──
  const handleDrop = (e:React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverTrackId(null);

    // Check for transition drop
    const trData = e.dataTransfer.getData('application/transition');
    if (trData) {
       try {
          const tr = JSON.parse(trData);
          const r=tlRef.current!.getBoundingClientRect();
          const finalStart=Math.max(0, Math.round(((e.clientX-r.left)/r.width)*100/(zoom*0.14)));
          const areaRect=tracksAreaRef.current!.getBoundingClientRect();
          let relY=e.clientY-areaRect.top;
          let targetTrack:Track|null=null;
          for(const t of tracks){ if(relY<t.height){ targetTrack=t; break; } relY-=t.height; }
          if (targetTrack && targetTrack.type === 'video') {
             const trackClips = stateRef.current.clips.filter(c => c.trackId === targetTrack!.id).sort((a,b) => a.start - b.start);
             let finalStartTime = finalStart - 7.5;
             
             // Snap to edit points if near
             const nearEdge = trackClips.find(c => Math.abs(c.start - finalStart) < 10 || Math.abs((c.start + c.width) - finalStart) < 10);
             if (nearEdge) {
                if (Math.abs(nearEdge.start - finalStart) < 10) {
                   // Drop at start of clip
                   finalStartTime = nearEdge.start - 7.5;
                } else {
                   // Drop at end of clip
                   finalStartTime = (nearEdge.start + nearEdge.width) - 7.5;
                }
             }

             const newTr: Transition = { id: Date.now(), trackId: targetTrack.id, startTime: finalStartTime, duration: 15, type: tr.name };
             applyAction(`Add ${tr.name}`, clips, [...transitions, newTr]);
             notify(`${tr.name} added at edit point`);
             return;
          }
       } catch(e){}
    }

    // 1. Try ref first (most reliable, avoids stale state)
    // 2. Fall back to dataTransfer JSON
    let state = dragNewItemRef.current;
    if (!state) {
        try { state = JSON.parse(e.dataTransfer.getData('application/json')); } catch(err){}
    }
    dragNewItemRef.current = null;  // clear ref

    if (!state || !tracksAreaRef.current || !tlRef.current) {
       setDragNewState(null);
       setDragNewPos(null);
       return;
    }
    
    // Re-calculate exactly where we dropped (bypassing any mouseup race condition erasures)
    const r=tlRef.current.getBoundingClientRect();
    const pct=((e.clientX-r.left)/r.width)*100;
    const finalStart=Math.max(0, Math.round(pct/(zoom*0.14)));

    const areaRect=tracksAreaRef.current.getBoundingClientRect();
    let relY=e.clientY-areaRect.top;
    let targetTrack:Track|null=null;
    for(const t of tracks){
      if(relY<t.height){ targetTrack=t; break; }
      relY-=t.height;
    }

    if (!targetTrack || targetTrack.type === 'caption') {
       setDragNewState(null);
       setDragNewPos(null);
       return;
    }

    let finalTrackId = targetTrack.id;
    if (targetTrack.type !== state.type) {
       // Match strict media types to allowed tracks
       const fallback = tracks.find(t => t.type === state?.type);
       if (!fallback) {
          setDragNewState(null);
          setDragNewPos(null);
          return;
       }
       finalTrackId = fallback.id;
    }
    
    const w = state.duration || 100; // default duration
    
    // Check overlap
    const overlaps = clips.filter(c => c.trackId === finalTrackId && 
                                  ((finalStart >= c.start && finalStart < c.start + c.width) ||
                                   (c.start >= finalStart && c.start < finalStart + w) ||
                                   (finalStart <= c.start && finalStart + w >= c.start + c.width)));
    let newClips = [...clips];
    if (overlaps.length > 0) {
       // Ripple push later clips
       const pushAmount = w;
       newClips = newClips.map(c => 
         (c.trackId === finalTrackId && c.start + c.width/2 >= finalStart) 
            ? { ...c, start: c.start + pushAmount } 
            : c
       );
    }

    const newClip: Clip = {
       id: Date.now(),
       trackId: finalTrackId,
       start: finalStart,
       width: w,
       label: state.label,
       color: state.color,
       type: state.type as 'video'|'audio',
       url: state.url,
       sourceOffset: state.sourceOffset || 0
    };

    const nextClips = [...newClips, newClip];
    applyAction(`Add clip "${newClip.label}"`, nextClips);
    setDragNewState(null);
    setDragNewPos(null);
    setSelectedClipIds([newClip.id]);
    notify(`Drop: "${newClip.label}" added & snapped`);

  };

  // ── RAZOR line + MOVE/CROSS-TRACK drag + EDGE TRIMMING ──
  const handleTracksMouseMove=(e:React.MouseEvent<HTMLDivElement>)=>{
    // -- MARQUEE SELECTION --
    if (marqueeSelection) {
      const r = tracksAreaRef.current?.getBoundingClientRect();
      if (r) {
        const currentX = e.clientX;
        const currentY = e.clientY;
        const isActive = Math.abs(currentX - marqueeSelection.startX) > 5 || Math.abs(currentY - marqueeSelection.startY) > 5;
        
        setMarqueeSelection(prev => prev ? { ...prev, currentX, currentY, isActive: isActive || prev.isActive } : null);
        
        if (isActive || marqueeSelection.isActive) {
          const mLeft = Math.min(marqueeSelection.startX, currentX);
          const mRight = Math.max(marqueeSelection.startX, currentX);
          const mTop = Math.min(marqueeSelection.startY, currentY);
          const mBottom = Math.max(marqueeSelection.startY, currentY);

          const tlRect = tlRef.current?.getBoundingClientRect();
          if (tlRect) {
            const newSels: number[] = [];
            let currentTrackY = r.top;
            tracks.forEach(track => {
              const trackTop = currentTrackY;
              const trackBottom = currentTrackY + track.height;
              const clipsOnTrack = stateRef.current.clips.filter(c => c.trackId === track.id);
              clipsOnTrack.forEach(clip => {
                 const clipLeft = tlRect.left + (clip.start * zoom * 0.14 / 100 * tlRect.width);
                 const clipRight = clipLeft + (clip.width * zoom * 0.14 / 100 * tlRect.width);
                 const intersectsX = clipLeft < mRight && clipRight > mLeft;
                 const intersectsY = trackTop < mBottom && trackBottom > mTop;
                 if (intersectsX && intersectsY) newSels.push(clip.id);
              });
              currentTrackY += track.height;
            });
            setSelectedClipIds(newSels);
          }
        }
      }
      return;
    }

    // –– EDGE DRAG: Trimming clip ––
    if(edgeDragState && tlRef.current) {
       const dx = e.clientX - edgeDragState.startX;
       const r = tlRef.current.getBoundingClientRect();
       const deltaUnits = Math.round((dx/r.width)*100/(zoom*0.14));

       let newStart = edgeDragState.initialStart;
       let newWidth = edgeDragState.initialWidth;
       const minWidth = 15; 
       let shiftAmount = 0;

       if (edgeDragState.edge === 'left') {
          const clampedDelta = Math.min(edgeDragState.initialWidth - minWidth, Math.max(-edgeDragState.initialStart, deltaUnits));
          newWidth = edgeDragState.initialWidth - clampedDelta;

          if (activeTool === 'ripple') {
             // Ripple Left Edit: clip itself doesn't move its visual start to prevent a gap.
             // Instead, it shrinks, and the right edge pulls everything downstream leftwards.
             newStart = edgeDragState.initialStart;
             shiftAmount = -clampedDelta; 
          } else {
             // Normal trim: left edge moves freely.
             newStart = edgeDragState.initialStart + clampedDelta;
          }
       } else {
          newWidth = Math.max(minWidth, edgeDragState.initialWidth + deltaUnits);
          if (edgeDragState.sourceWidth && newWidth > edgeDragState.sourceWidth) {
             newWidth = edgeDragState.sourceWidth;
          }
          if (activeTool === 'ripple') {
             shiftAmount = newWidth - edgeDragState.initialWidth;
          }
       }

       setClips(prev => {
         const updatedClips = [...prev];
         const clipIdx = updatedClips.findIndex(c => c.id === edgeDragState.clipId);
         if (clipIdx === -1) return prev;
         
         const oldClip = updatedClips[clipIdx];
         updatedClips[clipIdx] = {...oldClip, start: newStart, width: newWidth};

         if (activeTool === 'ripple' && shiftAmount !== 0) {
           // Standard Ripple: downstream clips on the SAME track shift.
           updatedClips.forEach((c, idx) => {
             if (idx !== clipIdx && c.trackId === oldClip.trackId && c.start >= edgeDragState.initialStart + edgeDragState.initialWidth - 1) {
                updatedClips[idx] = {...c, start: Math.max(0, c.start + shiftAmount)};
             }
           });
         }
         return updatedClips;
       });

       const durationS = newWidth/15;
       let tooltipText = `Dur: ${durationS.toFixed(1)}s`;
       if (activeTool === 'ripple' && shiftAmount !== 0) {
          const shiftS = shiftAmount/15;
          tooltipText += ` (${shiftS > 0 ? '+' : ''}${shiftS.toFixed(1)}s ripple)`;
       }

       setTrimTooltip({
         x: e.clientX,
         y: e.clientY - 40,
         text: tooltipText
       });
       return;
    }

    // –– MOVE: drag clip (horizontal + cross-track vertical) ––
    if(dragState&&tlRef.current&&tracksAreaRef.current){
      const dx=e.clientX-dragState.startX;
      const r=tlRef.current.getBoundingClientRect();
      const deltaUnits=Math.abs(dx)>2?Math.round((dx/r.width)*100/(zoom*0.14)):0;

      const draggedClip=clips.find(c=>c.id===dragState.clipId);
      if(!draggedClip) return;

      const areaRect=tracksAreaRef.current.getBoundingClientRect();
      let relY=e.clientY-areaRect.top;
      let targetTrack:Track|null=null;
      for(const t of tracks){
        if(relY<t.height){ targetTrack=t; break; }
        relY-=t.height;
      }
      
      let trackDelta = 0;
      if (targetTrack && targetTrack.type === draggedClip.type) {
         trackDelta = targetTrack.id - draggedClip.trackId;
      }

      setClips(prev => prev.map(c => {
         if (dragState.clipOffsets[c.id]) {
            const initial = dragState.clipOffsets[c.id];
            let newStart = Math.max(0, initial.start + deltaUnits);
            let newTrackId = initial.trackId + trackDelta;
            
            // Ensure track exists and is valid type
            const tt = tracks.find(t => t.id === newTrackId);
            if (!tt || tt.type !== c.type) {
               newTrackId = initial.trackId;
            }
            
            return { ...c, start: newStart, trackId: newTrackId };
         }
         return c;
      }));
      dragMovedRef.current=true;
      return;
    }
    // –– RAZOR: red cursor line ––
    if(activeTool!=='razor'||!tlRef.current){ if(razorLinePos!==null) setRazorLinePos(null); return; }
    const r=tlRef.current.getBoundingClientRect();
    setRazorLinePos(Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100)));
  };

  const selectedClipObj = clips?.find(c=>selectedClipIds.includes(c.id));

  if(isMobile) return (
    <MobileEditor clips={clips} isPlaying={isPlaying} setIsPlaying={setIsPlaying}
      playheadPct={playheadPos} setPlayheadPct={setPlayheadPos}
      timecode={timecode} selectedClip={selectedClipIds[0] || null} setSelectedClip={(id) => setSelectedClipIds(id ? [id] : [])}
      onImportMedia={handleImportMedia} onImportTrack={handleImportTrack}
      showExport={showExport} setShowExport={setShowExport} notification={notification}
    />
  );

  // Desktop
  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'var(--bg-primary)',overflow:'hidden',userSelect:'none'}}>
      <input type="file" ref={fileInputRef} multiple accept="video/*,audio/*,image/*" style={{display:'none'}} onChange={e=>handleProcessUploadedFiles(e.target.files)} />
      {/* ─── TOP MENU BAR ─── */}
      <div style={{height:'38px',flexShrink:0,background:'var(--bg-tertiary)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 14px',gap:'0',zIndex:50}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:'6px',textDecoration:'none',marginRight:'18px'}}>
          <div style={{width:'20px',height:'20px',borderRadius:'4px',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,fontFamily:'Syne,sans-serif',color:'white',boxShadow:'0 0 10px var(--accent-glow)'}}>E</div>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'12px',letterSpacing:'1px',color:'var(--text-primary)'}}>ECLIPSO</span>
        </Link>
        {['File','Edit','Clip','Sequence','Markers','Graphics','View','Window','Help'].map(m=>{
          const isWindow = m === 'Window';
          return (
            <button key={m} onClick={isWindow?()=>setLeftTab('history'):undefined} style={{padding:'0 8px',height:'100%',background:'none',border:'none',color:isWindow&&leftTab==='history'?'var(--accent)':'var(--text-secondary)',fontSize:'11px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',transition:'all 0.15s',whiteSpace:'nowrap'}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';e.currentTarget.style.color=isWindow&&leftTab==='history'?'var(--accent)':'var(--text-primary)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color=isWindow&&leftTab==='history'?'var(--accent)':'var(--text-secondary)';}}
            >{m}{isWindow&&leftTab==='history'?' ●':''}</button>
          );
        })}
        <div style={{flex:1,textAlign:'center'}}>
          <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Strike_the_Heavens</span>
          <span style={{fontSize:'10px',color:'var(--accent)',marginLeft:'6px'}}>● Edited</span>
        </div>
        {/* Workspace selector */}
        <div style={{display:'flex',gap:'2px',background:'var(--bg-secondary)',borderRadius:'6px',padding:'2px',border:'1px solid var(--border)',marginRight:'10px'}}>
          {WORKSPACES.map(w=>(
            <button key={w.id} onClick={()=>setWorkspace(w.id)} style={{padding:'3px 8px',borderRadius:'4px',border:'none',background:workspace===w.id?'var(--accent)':'transparent',color:workspace===w.id?'white':'var(--text-muted)',fontSize:'10px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,transition:'all 0.15s',whiteSpace:'nowrap'}}>{w.label}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <button style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'14px'}}>🔔</button>
          <button style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'13px'}}>⚙</button>
          <button onClick={()=>setShowExport(true)} style={{background:'var(--accent)',border:'none',color:'white',padding:'4px 12px',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:700,boxShadow:'0 0 10px var(--accent-glow)'}}>Export</button>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE ─── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ── TOOL PANEL ── */}
        <div style={{width:'42px',flexShrink:0,background:'var(--bg-secondary)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 0',gap:'1px',zIndex:40}}>
          {TOOLS.map((tool,idx)=>{
            const showDivider = idx>0 && tool.group !== TOOLS[idx-1].group;
            return (
              <div key={tool.id} style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
                {showDivider && <div style={{width:'24px',height:'1px',background:'var(--border)',margin:'3px 0'}}/>}
                <button title={`${tool.label} (${tool.key})`} onClick={()=>setActiveTool(tool.id)} style={{width:'32px',height:'32px',borderRadius:'6px',border:'none',background:activeTool===tool.id?'var(--accent)':'transparent',color:activeTool===tool.id?'white':'var(--text-secondary)',fontSize:'13px',cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',boxShadow:activeTool===tool.id?'0 0 10px var(--accent-glow)':'none'}}
                  onMouseEnter={e=>{if(activeTool!==tool.id){e.currentTarget.style.background='var(--bg-hover)';e.currentTarget.style.color='var(--text-primary)';}}}
                  onMouseLeave={e=>{if(activeTool!==tool.id){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-secondary)';}}}
                >{tool.icon}</button>
              </div>
            );
          })}
          <div style={{flex:1}}/>
          {/* Bottom tool utilities */}
          {['📤','🔗','📝','?'].map((ic,i)=>(
            <button key={i} title={['Send to Encoder','Link/Unlink','Notes','Help'][i]} style={{width:'32px',height:'32px',borderRadius:'6px',border:'none',background:'transparent',color:'var(--text-muted)',fontSize:'12px',cursor:'pointer',transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.color='var(--text-secondary)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';}}
            >{ic}</button>
          ))}
        </div>

        {/* ── LEFT PANEL ── */}
        <div style={{width:`${leftWidth}px`,flexShrink:0,background:'var(--bg-secondary)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',zIndex:30}}>
          {/* Tab icons (icon-only, scrollable) */}
          <div style={{display:'flex',borderBottom:'1px solid var(--border)',overflowX:'auto',background:'var(--bg-tertiary)',flexShrink:0}}>
            {LEFT_TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setLeftTab(tab.id)} title={tab.label} style={{flexShrink:0,width:'42px',padding:'7px 0',border:'none',background:'transparent',borderBottom:`2px solid ${leftTab===tab.id?'var(--accent)':'transparent'}`,cursor:'pointer',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1px',position:'relative'}}
                onMouseEnter={e=>{if(leftTab!==tab.id)e.currentTarget.style.background='var(--bg-hover)';}}
                onMouseLeave={e=>{if(leftTab!==tab.id)e.currentTarget.style.background='transparent';}}
              >
                <span style={{fontSize:'14px'}}>{tab.icon}</span>
                {tab.badge && <div style={{position:'absolute',top:'3px',right:'3px',background:'var(--accent)',color:'white',fontSize:'7px',borderRadius:'4px',padding:'0 3px',fontFamily:'Syne,sans-serif',fontWeight:700,lineHeight:'12px',minWidth:'12px',textAlign:'center'}}>{tab.badge}</div>}
              </button>
            ))}
          </div>
          {/* Tab label */}
          <div style={{padding:'7px 12px',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
            <span style={{fontSize:'9px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>{LEFT_TABS.find(t=>t.id===leftTab)?.label.toUpperCase()}</span>
          </div>
          {/* Panel content */}
          <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
            {leftTab==='media'       && <PanelMedia files={projectFiles} onUploadClick={()=>fileInputRef.current?.click()} onImport={handleImportMedia} onDragStartItem={handleDragStartNewItem} onDoubleClickItem={handleOpenSource}/>}
            {leftTab==='library'     && <PanelLibrary onImport={handleImportTrack} onDragStartItem={handleDragStartNewItem}/>}
            {leftTab==='effects'     && <PanelEffects/>}
            {leftTab==='transitions' && <PanelTransitions/>}
            {leftTab==='color'       && <PanelColor/>}
            {leftTab==='sound'       && <PanelSound/>}
            {leftTab==='mixer'       && <PanelMixer/>}
            {leftTab==='captions'    && <PanelCaptions/>}
            {leftTab==='ai'          && <PanelAI/>}
            {leftTab==='markers'     && <PanelMarkers markers={markers} onJump={t=>setPlayheadPos(t/120*100)}/>}
            {leftTab==='history'     && <HistoryPanel history={history} onJumpTo={jumpToHistory} />}
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

          {/* MONITORS */}
          <div style={{display:'flex',height:'42%',flexShrink:0,borderBottom:'1px solid var(--border)'}}>
            {/* Source Monitor */}
            <div style={{flex:1,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
              <div style={{padding:'5px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
                <span style={{fontSize:'10px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'150px'}}>Source: {sourceClip ? sourceClip.label.replace('.mp4','') : '(no clips)'}</span>
                {sourceClip ? (
                  <div style={{display:'flex',gap:'4px'}}>
                    <button title="Insert Range" onClick={()=>handleSourceInsert('insert')} style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--accent)',cursor:'pointer',fontSize:'9px',padding:'3px 6px',borderRadius:'4px',fontFamily:'Syne,sans-serif',fontWeight:700}}>Insert</button>
                    <button title="Overwrite Range" onClick={()=>handleSourceInsert('overwrite')} style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--pink)',cursor:'pointer',fontSize:'9px',padding:'3px 6px',borderRadius:'4px',fontFamily:'Syne,sans-serif',fontWeight:700}}>Overwrite</button>
                  </div>
                ) : (
                  <div style={{display:'flex',gap:'4px'}}>
                    {['◁','▷'].map((ic,i)=><button key={i} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'11px'}}>{ic}</button>)}
                  </div>
                )}
              </div>
              
              <div style={{flex:1,background:'#050508',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',minWidth:0,minHeight:0}}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                   e.preventDefault();
                   try {
                     const item = JSON.parse(e.dataTransfer.getData('application/json'));
                     handleOpenSource(item);
                   } catch(err){}
                }}
              >
                {sourceClip?.url ? (
                   <video 
                      src={sourceClip.url} 
                      style={{width:'100%',height:'100%',objectFit:'contain',position:'relative',zIndex:2,cursor:'grab'}}
                      muted
                      draggable
                      onDragStart={(e) => {
                         const offset = Math.min(sourceInPct, sourceOutPct) / 100 * sourceClip.duration;
                         const length = Math.abs(sourceOutPct - sourceInPct) / 100 * sourceClip.duration;
                         handleDragStartNewItem(e, {
                           type: sourceClip.type as 'video'|'audio',
                           label: sourceClip.label,
                           color: sourceClip.color,
                           duration: length,
                           url: sourceClip.url,
                           sourceOffset: offset
                         });
                      }}
                      onTimeUpdate={(e) => {
                         if (sourceClip.duration > 0 && sourceIsPlaying) {
                            const pct = (e.currentTarget.currentTime / (sourceClip.duration / 15)) * 100;
                            setSourcePlayheadPct(pct);
                         }
                      }}
                      ref={(el) => {
                         if (el) {
                            const expectedTime = (sourcePlayheadPct / 100) * (sourceClip.duration / 15);
                            if (Math.abs(el.currentTime - expectedTime) > 0.3 && !sourceIsPlaying) {
                               el.currentTime = expectedTime;
                            }
                            if (sourceIsPlaying && el.paused) {
                               let p = el.play();
                               if (p !== undefined) p.catch(()=>{});
                            }
                            if (!sourceIsPlaying && !el.paused) el.pause();
                         }
                      }}
                   />
                ) : sourceClip ? (
                   <div style={{position:'absolute',inset:'8%',border:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',background:`${sourceClip.color}15`,borderRadius:'4px',zIndex:2}}>
                      <span style={{fontSize:'32px',opacity:0.8}}>{sourceClip.type==='video'?'🎬':'🎵'}</span>
                   </div>
                ) : (
                   <div style={{textAlign:'center',color:'var(--text-muted)'}}>
                     <div style={{fontSize:'28px',marginBottom:'6px',opacity:0.15}}>🎬</div>
                     <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>Double-click clip or drag to preview</div>
                   </div>
                )}
              </div>
              
              {/* Source Scrubber */}
              {sourceClip && (
                 <div style={{height:'16px',background:'var(--bg-secondary)',borderTop:'1px solid var(--border)',position:'relative',cursor:'pointer'}}
                   onMouseDown={(e)=>{
                      const r=e.currentTarget.getBoundingClientRect();
                      const updatePct = (ev:MouseEvent) => setSourcePlayheadPct(Math.max(0,Math.min(100,((ev.clientX-r.left)/r.width)*100)));
                      updatePct(e as unknown as MouseEvent);
                      const move = (ev:MouseEvent) => updatePct(ev);
                      const up = () => { window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
                      window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
                   }}
                 >
                   <div style={{position:'absolute',left:`${Math.min(sourceInPct,sourceOutPct)}%`,width:`${Math.abs(sourceOutPct-sourceInPct)}%`,top:0,bottom:0,background:'rgba(255,255,255,0.1)'}}/>
                   <div style={{position:'absolute',left:`${sourceInPct}%`,top:0,bottom:0,width:'2px',background:'var(--cyan)',zIndex:2}}>
                      <div style={{position:'absolute',top:0,left:'-4px',width:'4px',height:'6px',borderLeft:'2px solid var(--cyan)',borderTop:'2px solid var(--cyan)'}}/>
                   </div>
                   <div style={{position:'absolute',left:`${sourceOutPct}%`,top:0,bottom:0,width:'2px',background:'var(--pink)',zIndex:2}}>
                      <div style={{position:'absolute',top:0,right:'-4px',width:'4px',height:'6px',borderRight:'2px solid var(--pink)',borderTop:'2px solid var(--pink)'}}/>
                   </div>
                   <div style={{position:'absolute',left:`${sourcePlayheadPct}%`,top:0,bottom:0,width:'1px',background:'var(--yellow)',zIndex:3,pointerEvents:'none'}}>
                      <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'4px solid transparent',borderRight:'4px solid transparent',borderTop:'5px solid var(--yellow)'}}/>
                   </div>
                 </div>
              )}
              
              {/* Source monitor controls */}
              <div style={{padding:'4px 8px',display:'flex',gap:'4px',alignItems:'center',borderTop:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
                <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--text-secondary)',marginRight:'4px',minWidth:'55px'}}>
                  {sourceClip ? `Dur: ${Math.floor(sourceClip.duration * Math.abs(sourceOutPct - sourceInPct)/100 / 15).toFixed(1)}s` : '00;00;00;00'}
                </span>
                <div style={{flex:1,display:'flex',justifyContent:'center',gap:'3px',alignItems:'center'}}>
                  <button title="Mark In (I)" onClick={()=>setSourceInPct(sourcePlayheadPct)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px',padding:'2px 3px',borderRadius:'3px',fontFamily:'monospace'}}>{'{I}'}</button>
                  {['⏮','⏪', sourceIsPlaying?'⏸':'▶','⏩','⏭'].map(ic=><button key={ic} onClick={() => { if(ic==='▶'||ic==='⏸') setSourceIsPlaying(!sourceIsPlaying); }} style={{background:(ic==='▶'||ic==='⏸')?'var(--accent)':'none',border:'none',color:(ic==='▶'||ic==='⏸')?'white':'var(--text-secondary)',width:(ic==='▶'||ic==='⏸')?'20px':'auto',height:(ic==='▶'||ic==='⏸')?'20px':'auto',borderRadius:'50%',cursor:'pointer',fontSize:(ic==='▶'||ic==='⏸')?'8px':'11px',display:'flex',alignItems:'center',justifyContent:'center'}}>{ic}</button>)}
                  <button title="Mark Out (O)" onClick={()=>setSourceOutPct(sourcePlayheadPct)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px',padding:'2px 3px',borderRadius:'3px',fontFamily:'monospace'}}>{'O}'}</button>
                </div>
                {/* Drag video/audio only icons */}
                <div style={{display:'flex',gap:'3px'}}>
                  <button draggable onDragStart={e=>handleDragStartNewItem(e,{type:'video',label:sourceClip?.label||'',color:sourceClip?.color||'',duration:sourceClip?Math.abs(sourceOutPct-sourceInPct)/100*sourceClip.duration:100, url:sourceClip?.url, sourceOffset:sourceClip?Math.min(sourceInPct,sourceOutPct)/100*sourceClip.duration:0})} title="Drag Video Only" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',cursor:sourceClip?'grab':'default',fontSize:'9px',padding:'2px 4px',borderRadius:'3px',opacity:sourceClip?1:0.3}}>V</button>
                  <button draggable onDragStart={e=>handleDragStartNewItem(e,{type:'audio',label:sourceClip?.label||'',color:sourceClip?.color||'',duration:sourceClip?Math.abs(sourceOutPct-sourceInPct)/100*sourceClip.duration:100, url:sourceClip?.url, sourceOffset:sourceClip?Math.min(sourceInPct,sourceOutPct)/100*sourceClip.duration:0})} title="Drag Audio Only" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',cursor:sourceClip?'grab':'default',fontSize:'9px',padding:'2px 4px',borderRadius:'3px',opacity:sourceClip?1:0.3}}>A</button>
                </div>
              </div>
            </div>

            {/* Program Monitor */}
            <div style={{flex:1,display:'flex',flexDirection:'column'}}>
              <div style={{padding:'5px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
                <span style={{fontSize:'10px',color:'var(--accent)',fontFamily:'Syne,sans-serif',fontWeight:600}}>Program: Strike_the_Heavens</span>
                <div style={{display:'flex',gap:'3px'}}>
                  <button title="Safe Margins" style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>⊞</button>
                  <button title="Full Screen" style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>⛶</button>
                </div>
              </div>
              <div style={{flex:1,background:'#020204',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',minWidth:0,minHeight:0}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0a0020,#000510,#050005)'}}/>
                {(() => {
                   const playheadUnits = playheadPos / (zoom * 0.14);
                   
                   // Check for transition
                   const activeTr = transitions.find(t => playheadUnits >= t.startTime && playheadUnits < t.startTime + t.duration);
                   
                   const activeVidClips = clips.filter(c => c.type === 'video' && c.url && playheadUnits >= c.start - 30 && playheadUnits < c.start + c.width + 30)
                      .sort((a,b) => b.trackId - a.trackId);
                   
                   const activeVidClip = activeVidClips.find(c => playheadUnits >= c.start && playheadUnits < c.start + c.width);

                   if (activeTr) {
                      const tClips = clips.filter(c => c.trackId === activeTr.trackId && c.type === 'video').sort((a,b) => a.start - b.start);
                      const clipA = tClips.find(c => activeTr.startTime > c.start && activeTr.startTime < c.start + c.width + 5);
                      const clipB = tClips.find(c => activeTr.startTime + activeTr.duration > c.start && activeTr.startTime + activeTr.duration < c.start + c.width + 5);
                      
                      const progress = (playheadUnits - activeTr.startTime) / activeTr.duration;
                      const cvA = clipA ? (prop: string) => getClipValue(clipA, prop, playheadUnits) : null;
                      const cvB = clipB ? (prop: string) => getClipValue(clipB, prop, playheadUnits) : null;

                      if (activeTr.type === 'Cross Dissolve' && clipA && clipB) {
                         return (
                            <div style={{width:'100%', height:'100%', position:'relative'}}>
                               <video src={clipA.url} muted style={{
                                  position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain',
                                  transform: `translate(${cvA!('x')}px, ${cvA!('y')}px) scale(${cvA!('scale') / 100}) rotate(${cvA!('rotation')}deg)`,
                                  opacity: (cvA!('opacity') / 100) * (1 - progress), zIndex: 2
                               }} ref={el => { if(el && !isPlaying) el.currentTime = (playheadUnits - clipA.start + (clipA.sourceOffset||0))/15; }} />
                               <video src={clipB.url} muted style={{
                                  position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain',
                                  transform: `translate(${cvB!('x')}px, ${cvB!('y')}px) scale(${cvB!('scale') / 100}) rotate(${cvB!('rotation')}deg)`,
                                  opacity: (cvB!('opacity') / 100) * progress, zIndex: 3
                               }} ref={el => { if(el && !isPlaying) el.currentTime = (playheadUnits - clipB.start + (clipB.sourceOffset||0))/15; }} />
                            </div>
                         );
                      } else if (activeTr.type === 'Dip to Black' || activeTr.type === 'Dip to White') {
                         const dipColor = activeTr.type === 'Dip to Black' ? '#000' : '#fff';
                         // Smooth sine easing for dip
                         const dipProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
                         const opA = progress < 0.5 ? 1 - Math.sin(progress * Math.PI) : 0;
                         const opB = progress >= 0.5 ? 1 - Math.sin((1 - progress) * Math.PI) : 0;
                         
                         // Standard linear for safety if sine feels too fast
                         const linearOpA = progress < 0.5 ? 1 - (progress * 2) : 0;
                         const linearOpB = progress >= 0.5 ? (progress - 0.5) * 2 : 0;

                         return (
                            <div style={{width:'100%', height:'100%', position:'relative', background: dipColor}}>
                               {clipA && (
                                  <video src={clipA.url} muted style={{
                                     position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain',
                                     transform: `translate(${cvA!('x')}px, ${cvA!('y')}px) scale(${cvA!('scale') / 100}) rotate(${cvA!('rotation')}deg)`,
                                     opacity: (cvA!('opacity') / 100) * linearOpA, zIndex: 2
                                  }} ref={el => { if(el && !isPlaying) el.currentTime = (playheadUnits - clipA.start + (clipA.sourceOffset||0))/15; }} />
                               )}
                               {clipB && (
                                  <video src={clipB.url} muted style={{
                                     position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain',
                                     transform: `translate(${cvB!('x')}px, ${cvB!('y')}px) scale(${cvB!('scale') / 100}) rotate(${cvB!('rotation')}deg)`,
                                     opacity: (cvB!('opacity') / 100) * linearOpB, zIndex: 3
                                  }} ref={el => { if(el && !isPlaying) el.currentTime = (playheadUnits - clipB.start + (clipB.sourceOffset||0))/15; }} />
                               )}
                            </div>
                         );
                      }
                   }

                   if (activeVidClip) {
                      const cv = (prop: string) => getClipValue(activeVidClip, prop, playheadUnits);
                      return (
                         <video 
                            src={activeVidClip.url}
                            style={{
                              width:'100%', height:'100%', objectFit:'contain', position:'relative', zIndex:2,
                              transform: `translate(${cv('x')}px, ${cv('y')}px) scale(${cv('scale') / 100}) rotate(${cv('rotation')}deg)`,
                              transformOrigin: `${activeVidClip.anchorX ?? 960}px ${activeVidClip.anchorY ?? 540}px`,
                              opacity: cv('opacity') / 100
                            }}
                            muted
                            ref={(el) => {
                               if (el) {
                                  const localTime = (playheadUnits - activeVidClip.start) + (activeVidClip.sourceOffset || 0);
                                  const expectedSeconds = localTime / 15;
                                  if (Math.abs(el.currentTime - expectedSeconds) > 0.3 && !isPlaying) {
                                     el.currentTime = expectedSeconds;
                                  }
                                  if (isPlaying && el.paused) {
                                     let p = el.play();
                                     if (p !== undefined) p.catch(()=>{});
                                  }
                                  if (!isPlaying && !el.paused) el.pause();
                               }
                            }}
                         />
                      );
                   }
                   return (
                     <div style={{position:'relative',zIndex:1}}>
                       <div style={{fontSize:'10px',color:'rgba(255,255,255,0.07)',fontFamily:'Syne,sans-serif',letterSpacing:'3px'}}>STRIKE THE HEAVENS</div>
                     </div>
                   );
                })()}

                <div style={{position:'absolute',inset:'8%',border:'1px solid rgba(255,255,255,0.04)',pointerEvents:'none'}}/>
                {/* Scope mini */}
                {workspace==='color' && (
                  <div style={{position:'absolute',bottom:'6px',right:'6px',width:'80px',height:'50px',background:'rgba(0,0,0,0.7)',border:'1px solid var(--border)',borderRadius:'4px',overflow:'hidden',display:'flex',alignItems:'flex-end',gap:'1px',padding:'2px'}}>
                    {Array.from({length:20},(_,k)=>(
                      <div key={k} style={{flex:1,height:`${CLIP_WAVE[k]*0.6+10}%`,background:`hsl(${k*18},80%,55%)`,opacity:0.7,borderRadius:'1px'}}/>
                    ))}
                  </div>
                )}
              </div>
              <div style={{padding:'4px 8px',display:'flex',gap:'4px',alignItems:'center',borderTop:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
                <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700,minWidth:'80px'}}>{timecode}</span>
                <div style={{flex:1,display:'flex',justifyContent:'center',gap:'3px',alignItems:'center'}}>
                  {['⏮','⏪'].map(ic=><button key={ic} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px'}}>{ic}</button>)}
                  <button onClick={()=>setIsPlaying(p=>!p)} style={{background:'var(--accent)',border:'none',color:'white',width:'24px',height:'24px',borderRadius:'50%',cursor:'pointer',fontSize:'10px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 8px var(--accent-glow)'}}>{isPlaying?'⏸':'▶'}</button>
                  {['⏩','⏭'].map(ic=><button key={ic} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px'}}>{ic}</button>)}
                </div>
                <div style={{display:'flex',gap:'3px'}}>
                  <select style={{background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'9px',borderRadius:'3px',padding:'1px 3px',outline:'none',cursor:'pointer'}}>
                    {['Full','1/2','1/4'].map(v=><option key={v}>{v}</option>)}
                  </select>
                  <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--text-secondary)',minWidth:'64px',textAlign:'right'}}>00;02;01;22</span>
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Timeline toolbar */}
            <div style={{padding:'4px 10px',display:'flex',alignItems:'center',gap:'8px',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
              {/* Sequence tab */}
              <div style={{display:'flex',gap:'1px',background:'var(--bg-secondary)',borderRadius:'5px',padding:'2px',border:'1px solid var(--border)'}}>
                {['Strike_the_Heavens','Sequence 02'].map((s,i)=>(
                  <button key={s} style={{padding:'2px 8px',borderRadius:'3px',border:'none',background:i===0?'var(--accent)':'transparent',color:i===0?'white':'var(--text-muted)',fontSize:'9px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap'}}>{s}</button>
                ))}
                <button style={{padding:'2px 5px',borderRadius:'3px',border:'none',background:'transparent',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>+</button>
              </div>
              <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700}}>{timecode}</span>
              <div style={{flex:1}}/>
              {/* Timeline tools */}
              <div style={{display:'flex',gap:'2px'}}>
                {[
                  {ic:'🔧',tip:'Timeline Settings'},
                  {ic:'✂',tip:'Ripple Delete'},
                  {ic:'⟺',tip:'Match Frame'},
                  {ic:'🔍',tip:'Zoom to Sequence'},
                  {ic:'🧲',tip:'Snapping (S)'},
                  {ic:'🔗',tip:'Linked Selection'},
                ].map(b=>(
                  <button key={b.ic} title={b.tip} onClick={()=>{ if(b.ic==='🧲') { setSnappingEnabled(!snappingEnabled); notify(!snappingEnabled?'🧲 Snapping On':'🧲 Snapping Off'); } }} style={{background:b.ic==='🧲'&&snappingEnabled?'var(--accent)':'none',border:'none',color:b.ic==='🧲'&&snappingEnabled?'white':'var(--text-secondary)',cursor:'pointer',fontSize:'12px',padding:'2px 4px',borderRadius:'3px',transition:'all 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=(b.ic==='🧲'&&snappingEnabled)?'var(--accent)':'var(--bg-hover)'}
                    onMouseLeave={e=>e.currentTarget.style.background=(b.ic==='🧲'&&snappingEnabled)?'var(--accent)':'none'}
                  >{b.ic}</button>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>—</button>
                <input type="range" min={50} max={400} value={zoom*100} onChange={e=>setZoom(Number(e.target.value)/100)} style={{width:'70px',accentColor:'var(--accent)',height:'3px'}}/>
                <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>+</button>
              </div>
            </div>

            {/* Timeline body */}
            <div style={{flex:1,display:'flex',overflow:'hidden'}}>
              {/* Track headers */}
              <div style={{width:'130px',flexShrink:0,background:'var(--bg-secondary)',borderRight:'1px solid var(--border)',overflowY:'hidden',display:'flex',flexDirection:'column'}}>
                {/* Ruler placeholder */}
                <div style={{height:'30px',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 6px',gap:'4px'}}>
                  <button title="Add Video Track" style={{fontSize:'9px',background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-secondary)',borderRadius:'3px',padding:'1px 4px',cursor:'pointer'}}>+V</button>
                  <button title="Add Audio Track" style={{fontSize:'9px',background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-secondary)',borderRadius:'3px',padding:'1px 4px',cursor:'pointer'}}>+A</button>
                </div>
                {tracks.map(track=>(
                  <div key={track.id} style={{height:`${track.height}px`,display:'flex',alignItems:'center',padding:'0 6px',gap:'4px',borderBottom:'1px solid var(--border)',background:track.type==='video'?'rgba(124,92,255,0.04)':track.type==='caption'?'rgba(255,214,10,0.04)':'rgba(0,229,255,0.04)',flexShrink:0,position:'relative'}}>
                    {/* Track color bar */}
                    <div style={{position:'absolute',left:0,top:0,bottom:0,width:'2px',background:track.color}}/>
                    <button onClick={()=>setTracks(p=>p.map(t=>t.id===track.id?{...t,locked:!t.locked}:t))} style={{background:'none',border:'none',cursor:'pointer',fontSize:'9px',opacity:track.locked?0.9:0.2,color:'var(--text-secondary)',flexShrink:0,padding:0}}>🔒</button>
                    <span style={{fontSize:'10px',fontFamily:'monospace',color:track.color,fontWeight:700,width:'20px',flexShrink:0}}>{track.label}</span>
                    {track.type!=='caption' && (
                      <>
                        <button onClick={()=>setTracks(p=>p.map(t=>t.id===track.id?{...t,muted:!t.muted}:t))} style={{width:'16px',height:'14px',borderRadius:'2px',border:'none',cursor:'pointer',fontSize:'7px',background:track.muted?'#FF3B82':'var(--bg-card)',color:track.muted?'white':'var(--text-secondary)',fontWeight:700,flexShrink:0}}>M</button>
                        <button onClick={()=>setTracks(p=>p.map(t=>t.id===track.id?{...t,solo:!t.solo}:t))} style={{width:'16px',height:'14px',borderRadius:'2px',border:'none',cursor:'pointer',fontSize:'7px',background:track.solo?'#FFD60A':'var(--bg-card)',color:track.solo?'#000':'var(--text-secondary)',fontWeight:700,flexShrink:0}}>S</button>
                      </>
                    )}
                    <button style={{background:'none',border:'none',cursor:'pointer',fontSize:'9px',opacity:0.3,color:'var(--text-secondary)',flexShrink:0,padding:0}}>👁</button>
                  </div>
                ))}
              </div>

              {/* Track canvas area */}
              <div style={{flex:1,overflowX:'auto',overflowY:'hidden',position:'relative'}}>
                {/* Ruler */}
                <div ref={tlRef} onClick={handleTLClick} style={{height:'30px',background:'var(--bg-tertiary)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:5,cursor:'crosshair',flexShrink:0,overflow:'hidden'}}>
                  <div style={{minWidth:'700px',width:'100%',height:'100%',position:'relative'}}>
                    {Array.from({length:25},(_,i)=>(
                      <div key={i} style={{position:'absolute',left:`${i*4*zoom}%`,display:'flex',flexDirection:'column',alignItems:'flex-start',top:'6px'}}>
                        <div style={{width:'1px',height:'8px',background:'var(--border-bright)'}}/>
                        <span style={{fontSize:'8px',color:'var(--text-secondary)',fontFamily:'monospace',whiteSpace:'nowrap',marginTop:'1px'}}>
                          {String(Math.floor(i*4/60)).padStart(2,'0')}:{String((i*4)%60).padStart(2,'0')}
                        </span>
                      </div>
                    ))}
                    {/* Tick marks */}
                    {Array.from({length:100},(_,i)=>(
                      <div key={i} style={{position:'absolute',left:`${i*zoom}%`,top:'4px',width:'1px',height:'4px',background:'rgba(255,255,255,0.06)'}}/>
                    ))}
                    {/* Markers on ruler */}
                    {markers.map(m=>(
                      <div key={m.id} title={m.label} style={{position:'absolute',left:`${m.time/120*100}%`,top:0,zIndex:8,cursor:'pointer'}}>
                        <div style={{width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:`8px solid ${m.color}`,transform:'translateX(-50%)'}}/>
                        <div style={{position:'absolute',top:'8px',left:'50%',transform:'translateX(-50%)',background:m.color,color:'#000',fontSize:'7px',padding:'1px 3px',borderRadius:'2px',whiteSpace:'nowrap',fontFamily:'Syne,sans-serif',fontWeight:700}}>{m.label}</div>
                      </div>
                    ))}
                    {/* Playhead in ruler */}
                    <div style={{position:'absolute',left:`${playheadPos}%`,top:0,bottom:0,width:'1px',background:'var(--yellow)',zIndex:10,boxShadow:'0 0 8px rgba(255,214,10,0.5)'}}>
                      <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'8px solid var(--yellow)'}}/>
                    </div>
                  </div>
                </div>

                {/* Tracks */}
                <div ref={tracksAreaRef} onMouseDown={handleTracksMouseDown} onClick={handleTLClick} onMouseMove={handleTracksMouseMove} onMouseLeave={()=>setRazorLinePos(null)} onDragOver={handleDragOver} onDrop={handleDrop} style={{position:'relative',cursor:activeTool==='razor'?'none':'default'}}>
                  {tracks.map(track=>(
                    <div key={track.id} style={{
                      height:`${track.height}px`,
                      borderBottom:'1px solid var(--border)',
                      background:
                        dragOverTrackId===track.id&&(dragState||dragNewState)
                          ? track.type==='video'?'rgba(124,92,255,0.09)'
                            :track.type==='audio'?'rgba(0,229,255,0.09)'
                            :'rgba(255,214,10,0.04)'
                          : track.type==='video'?'rgba(124,92,255,0.015)'
                            :track.type==='caption'?'rgba(255,214,10,0.015)'
                            :'rgba(0,229,255,0.015)',
                      outline: dragOverTrackId===track.id&&(dragState||dragNewState)
                        ? `2px solid ${track.type==='video'?'rgba(124,92,255,0.45)':'rgba(0,229,255,0.45)'}` : 'none',
                      position:'relative',
                      cursor:activeTool==='razor'?'crosshair':dragState?'grabbing':'pointer',
                      flexShrink:0,
                      transition:'background 0.15s, outline 0.15s',
                    }}>
                      {/* Beat grid */}
                      {Array.from({length:100},(_,i)=>(
                        <div key={i} style={{position:'absolute',left:`${i*zoom}%`,top:0,bottom:0,width:'1px',background:'rgba(255,255,255,0.015)'}}/>
                      ))}
                      {Array.from({length:25},(_,i)=>(
                        <div key={i} style={{position:'absolute',left:`${i*4*zoom}%`,top:0,bottom:0,width:'1px',background:'rgba(255,255,255,0.04)'}}/>
                      ))}

                      {/* GAPs rendering for Ripple Delete */}
                      {(() => {
                         const trackClips = clips.filter(c => c.trackId === track.id).sort((a,b) => a.start - b.start);
                         const gaps = [];
                         let currentX = 0;
                         for (let i = 0; i < trackClips.length; i++) {
                           const c = trackClips[i];
                           if (c.start > currentX) {
                             gaps.push({ start: currentX, width: c.start - currentX, trackId: track.id });
                           }
                           currentX = c.start + c.width;
                         }
                         return gaps.map((gap, i) => (
                           <div key={`gap-${i}`}
                             onContextMenu={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setGapContextMenu({ x: e.clientX, y: e.clientY, gap });
                             }}
                             onClick={e => { e.stopPropagation(); setSelectedClipIds([]); }}
                             style={{
                                position:'absolute',
                                left:`${gap.start*zoom*0.14}%`,
                                width:`${gap.width*zoom*0.14}%`,
                                top: track.type==='caption'?'2px':'4px',
                                bottom: track.type==='caption'?'2px':'4px',
                                background:'rgba(255,255,255,0.03)',
                                border:'1px dashed rgba(255,255,255,0.06)',
                                borderRadius: track.type==='caption'?'3px':'5px',
                                overflow:'hidden',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                cursor:'context-menu', zIndex:5,
                                transition:'background 0.2s',
                             }}
                             onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                             onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                           >
                             {gap.width > 25 && <span style={{fontSize:'8.5px',fontFamily:'monospace',color:'rgba(255,255,255,0.25)',fontWeight:700,pointerEvents:'none'}}>{(gap.width/15).toFixed(1)}s Gap</span>}
                           </div>
                         ));
                      })()}

                      {/* Caption track label */}
                      {track.type==='caption' && (
                        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',padding:'0 8px',gap:'8px',pointerEvents:'none'}}>
                          <span style={{fontSize:'8px',color:'rgba(255,214,10,0.3)',fontFamily:'Syne,sans-serif',fontWeight:700,letterSpacing:'1px'}}>CAPTIONS TRACK</span>
                        </div>
                      )}

                      {/* ── DRAG NEW CLIP GHOST ── */}
                      {dragNewPos && dragOverTrackId===track.id && dragNewState && (
                        <div style={{
                          position:'absolute',
                          left:`${dragNewPos.start*zoom*0.14}%`,
                          width:`${(dragNewState.duration||100)*zoom*0.14}%`,
                          top: track.type==='caption'?'2px':'4px',
                          bottom: track.type==='caption'?'2px':'4px',
                          background:`${dragNewState.color}40`,
                          border:`1px dashed ${dragNewState.color}`,
                          borderRadius: track.type==='caption'?'3px':'5px',
                          zIndex: 20,
                          pointerEvents: 'none',
                          display:'flex', alignItems:'center', padding:'0 4px',
                          overflow:'hidden'
                        }}>
                           <span style={{fontSize:'8px',color:dragNewState.color,fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{dragNewState.label}</span>
                        </div>
                      )}

                      {/* Transitions */}
                      {transitions.filter(t=>t.trackId===track.id).map(tr=>(
                        <div key={tr.id}
                          style={{
                            position:'absolute',
                            left:`${tr.startTime*zoom*0.14}%`,
                            width:`${tr.duration*zoom*0.14}%`,
                            top: '15%', bottom: '15%',
                            background: tr.type === 'Dip to Black' 
                               ? 'linear-gradient(to right, #333, #000, #333)'
                               : tr.type === 'Dip to White'
                               ? 'linear-gradient(to right, #ccc, #fff, #ccc)'
                               : 'repeating-linear-gradient(45deg, rgba(124,92,255,0.3), rgba(124,92,255,0.3) 5px, rgba(124,92,255,0.5) 5px, rgba(124,92,255,0.5) 10px)',
                            border: `1px solid ${tr.type==='Dip to White'?'#999':'var(--accent)'}`,
                            borderRadius: '4px',
                            zIndex: 15,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                          onContextMenu={e => {
                             e.preventDefault(); e.stopPropagation();
                             const options = ['Center on Cut', 'Start at Cut', 'End at Cut', 'Set as Default'];
                             notify(`Alignment: ${options[0]} (simulated)`);
                          }}
                        >
                           <span style={{fontSize:'7px', color:tr.type==='Dip to White'?'#333':'white', fontWeight:800, textTransform:'uppercase', pointerEvents:'none'}}>{tr.type}</span>
                           {/* Left handle */}
                           <div onMouseDown={e => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startDur = tr.duration;
                              const startPos = tr.startTime;
                              const move = (ev: MouseEvent) => {
                                 const dx = ev.clientX - startX;
                                 const delta = Math.round((dx/tlRef.current!.getBoundingClientRect().width)*100/(zoom*0.14));
                                 setTransitions(prev => prev.map(t => t.id === tr.id ? { ...t, startTime: startPos + delta, duration: Math.max(5, startDur - delta) } : t));
                              };
                              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                              window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
                           }} style={{position:'absolute', left:0, top:0, bottom:0, width:'5px', cursor:'ew-resize'}} />
                           {/* Duration drag handles (Right) */}
                           <div onMouseDown={e => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startDur = tr.duration;
                              const move = (ev: MouseEvent) => {
                                 const dx = ev.clientX - startX;
                                 const delta = Math.round((dx/tlRef.current!.getBoundingClientRect().width)*100/(zoom*0.14));
                                 setTransitions(prev => prev.map(t => t.id === tr.id ? { ...t, duration: Math.max(5, startDur + delta) } : t));
                              };
                              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                              window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
                           }} style={{position:'absolute', right:0, top:0, bottom:0, width:'5px', cursor:'ew-resize'}} />
                        </div>
                      ))}

                      {/* Clips on this track */}
                      {clips.filter(c=>c.trackId===track.id).map(clip=>{
                        const isSelected = selectedClipIds.includes(clip.id);
                        return (
                        <div key={clip.id}
                          onMouseDown={e=>{
                            if((activeTool==='select'||activeTool==='track_fwd')&&e.button===0){
                              e.stopPropagation();
                              dragMovedRef.current=false;
                              
                              let newSelections: number[] = [];
                              
                              if (activeTool === 'track_fwd') {
                                 const selectAllTracks = e.shiftKey;
                                 newSelections = clips
                                    .filter(c => (selectAllTracks || c.trackId === clip.trackId) && c.start >= clip.start)
                                    .map(c => c.id);
                              } else {
                                 newSelections = [...selectedClipIds];
                                 if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                   if (isSelected) {
                                     newSelections = newSelections.filter(id => id !== clip.id);
                                   } else {
                                     newSelections.push(clip.id);
                                   }
                                 } else {
                                   if (!isSelected) {
                                     newSelections = [clip.id];
                                   }
                                 }
                              }
                              setSelectedClipIds(newSelections);

                              // save state for undo before drag
                              historyRef.current=[...historyRef.current.slice(-30),[...clips]];
                              
                              const offsets: Record<number, {start:number, trackId:number}> = {};
                              newSelections.forEach(id => {
                                const c = clips.find(x => x.id === id);
                                if (c) offsets[id] = { start: c.start, trackId: c.trackId };
                              });
                              setDragState({clipId:clip.id, startX:e.clientX, clipOffsets: offsets});
                            }
                          }}
                          onClick={e=>{
                            if(dragMovedRef.current){ dragMovedRef.current=false; return; }
                            if(activeTool==='razor'){ handleRazorSplit(e,clip); }
                            else { e.stopPropagation(); }
                          }}
                          style={{
                          position:'absolute',
                          left:`${clip.start*zoom*0.14}%`,
                          width:`${clip.width*zoom*0.14}%`,
                          top: track.type==='caption'?'2px':'4px',
                          bottom: track.type==='caption'?'2px':'4px',
                          background:`${clip.color}${isSelected?'40':'20'}`,
                          border:`1px solid ${clip.color}${isSelected?'ee':'50'}`,
                          borderRadius: track.type==='caption'?'3px':'5px',
                          overflow:'hidden',
                          cursor:dragState?.clipId===clip.id?'grabbing':activeTool==='select'?'grab':activeTool==='razor'?'crosshair':'pointer',
                          boxShadow:isSelected?`0 0 0 1.5px ${clip.color}, inset 0 0 0 1px ${clip.color}40`:'none',
                          transition:'border-color 0.1s',
                          display:'flex', flexDirection:'column',
                        }}>
                          {/* Clip header */}
                          <div style={{display:'flex',alignItems:'center',gap:'3px',padding:'2px 4px',flexShrink:0,background:`${clip.color}10`}}>
                            <span style={{fontSize:'8px',color:clip.color,fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}>{clip.label}</span>
                            {/* Badges */}
                            {clip.speed && clip.speed!==100 && <span style={{fontSize:'7px',background:'#FFD60A22',border:'1px solid #FFD60A44',color:'#FFD60A',borderRadius:'2px',padding:'0 3px',flexShrink:0}}>{clip.speed}%</span>}
                            {clip.proxy && <span style={{fontSize:'7px',background:'#00E5FF22',border:'1px solid #00E5FF44',color:'#00E5FF',borderRadius:'2px',padding:'0 2px',flexShrink:0}}>P</span>}
                            {clip.nested && <span style={{fontSize:'7px',background:'rgba(124,92,255,0.2)',border:'1px solid rgba(124,92,255,0.4)',color:'var(--accent)',borderRadius:'2px',padding:'0 2px',flexShrink:0}}>N</span>}
                          </div>
                          {/* Waveform body */}
                          {track.type!=='caption' && (
                            <div style={{flex:1,overflow:'hidden',position:'relative'}}>
                              <ClipWave color={clip.color} n={Math.floor(clip.width*zoom*0.25)}/>
                              
                              {/* Keyframes rendering */}
                              {clip.keyframes && Object.entries(clip.keyframes).map(([prop, kfs]) => (
                                <div key={prop} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
                                  {kfs.map(kf => {
                                    const isSelected = selectedKeyframe?.clipId === clip.id && selectedKeyframe?.prop === prop && selectedKeyframe?.kfId === kf.id;
                                    return (
                                      <div 
                                        key={kf.id}
                                        onMouseDown={e => {
                                          e.stopPropagation();
                                          setSelectedKeyframe({ clipId: clip.id, prop, kfId: kf.id });
                                        }}
                                        onContextMenu={e => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedKeyframe({ clipId: clip.id, prop, kfId: kf.id });
                                          const nextInterpolation = kf.interpolation === 'linear' ? 'ease-in' : kf.interpolation === 'ease-in' ? 'ease-out' : 'linear';
                                          setClips(prev => prev.map(c => {
                                            if (c.id !== clip.id || !c.keyframes?.[prop]) return c;
                                            const nextKfs = { ...c.keyframes };
                                            nextKfs[prop] = nextKfs[prop].map(k => k.id === kf.id ? { ...k, interpolation: nextInterpolation } : k);
                                            return { ...c, keyframes: nextKfs };
                                          }));
                                          notify(`Interpolation: ${nextInterpolation}`);
                                        }}
                                        style={{
                                          position:'absolute',
                                          left:`${kf.time * zoom * 0.14 / clip.width * 100}%`,
                                          top:'50%',
                                          width:'8px', height:'8px',
                                          background: isSelected ? 'var(--yellow)' : 'white',
                                          border: '1px solid rgba(0,0,0,0.5)',
                                          transform: 'translate(-50%, -50%) rotate(45deg)',
                                          cursor: 'pointer',
                                          pointerEvents: 'auto',
                                          zIndex: 30,
                                          boxShadow: isSelected ? '0 0 8px var(--yellow)' : 'none'
                                        }}
                                        title={`${prop}: ${kf.value} (${kf.interpolation})`}
                                      />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Transition zone indicator at edges */}
                          {['select', 'ripple'].includes(activeTool) && (
                            <>
                              <div onMouseDown={e=>{
                                e.stopPropagation();
                                dragMovedRef.current=false;
                                historyRef.current=[...historyRef.current.slice(-30),[...clips]];
                                setEdgeDragState({clipId:clip.id, edge:'left', startX:e.clientX, initialStart:clip.start, initialWidth:clip.width, sourceWidth:clip.sourceWidth||clip.width});
                                setSelectedClipIds([clip.id]);
                              }} style={{position:'absolute',left:0,top:0,bottom:0,width:'8px',cursor:activeTool==='ripple'?'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><text y=%2220%22 font-size=%2220%22 fill=%22%23FFD60A%22>⟪</text></svg>") 12 12, ew-resize':'col-resize',zIndex:10}}/>
                              <div onMouseDown={e=>{
                                e.stopPropagation();
                                dragMovedRef.current=false;
                                historyRef.current=[...historyRef.current.slice(-30),[...clips]];
                                setEdgeDragState({clipId:clip.id, edge:'right', startX:e.clientX, initialStart:clip.start, initialWidth:clip.width, sourceWidth:clip.sourceWidth||clip.width});
                                setSelectedClipIds([clip.id]);
                              }} style={{position:'absolute',right:0,top:0,bottom:0,width:'8px',cursor:activeTool==='ripple'?'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><text y=%2220%22 font-size=%2220%22 fill=%22%23FFD60A%22>⟫</text></svg>") 12 12, ew-resize':'col-resize',zIndex:10}}/>
                            </>
                          )}
                          <div style={{position:'absolute',left:0,top:0,bottom:0,width:'6px',background:`linear-gradient(to right,${clip.color}40,transparent)`,pointerEvents:'none'}}/>
                          <div style={{position:'absolute',right:0,top:0,bottom:0,width:'6px',background:`linear-gradient(to left,${clip.color}40,transparent)`,pointerEvents:'none'}}/>
                        </div>
                      )})}

                      {/* ── RAZOR LINE ── */}
                      {activeTool==='razor'&&razorLinePos!==null&&(
                        <div style={{position:'absolute',left:`${razorLinePos}%`,top:0,bottom:0,width:'2px',background:'rgba(255,59,82,0.95)',zIndex:25,pointerEvents:'none',transform:'translateX(-50%)',boxShadow:'0 0 10px rgba(255,59,82,0.7)',transition:'left 0.02s linear'}}>
                          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:'14px',lineHeight:1,userSelect:'none',filter:'drop-shadow(0 0 6px rgba(255,59,82,1))'}}>✂</div>
                        </div>
                      )}

                      {/* ── SNAP LINE ── */}
                      {snapLineUnits!==null&&(
                        <div style={{position:'absolute',left:`${snapLineUnits*zoom*0.14}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',zIndex:24,pointerEvents:'none',boxShadow:'0 0 8px rgba(255,214,10,0.6)'}}>
                          <div style={{position:'absolute',top:0,left:'50%',transform:'translate(-50%, -50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'6px solid var(--yellow)'}}/>
                        </div>
                      )}

                      {/* Playhead line */}
                      <div style={{position:'absolute',left:`${playheadPos}%`,top:0,bottom:0,width:'1px',background:'var(--yellow)',opacity:0.85,zIndex:8,pointerEvents:'none',boxShadow:'0 0 4px rgba(255,214,10,0.4)'}}/>
                    </div>
                  ))}

                  {/* MARQUEE SELECTION OVERLAY */}
                  {marqueeSelection?.isActive && (
                    <div style={{
                       position:'fixed',
                       left:`${Math.min(marqueeSelection.startX, marqueeSelection.currentX)}px`,
                       top:`${Math.min(marqueeSelection.startY, marqueeSelection.currentY)}px`,
                       width:`${Math.abs(marqueeSelection.startX - marqueeSelection.currentX)}px`,
                       height:`${Math.abs(marqueeSelection.startY - marqueeSelection.currentY)}px`,
                       background:'rgba(124,92,255,0.15)',
                       border:'1px solid var(--accent)',
                       borderRadius:'2px',
                       zIndex:100,
                       pointerEvents:'none'
                    }} />
                  )}
                </div>
              </div>
            </div>

            {/* TRIMMING TOOLTIP */}
            {trimTooltip && (
              <div style={{
                position:'fixed',
                left:`${trimTooltip.x}px`,
                top:`${trimTooltip.y}px`,
                transform:'translateX(-50%)',
                background:'rgba(0,0,0,0.85)',
                color:'white',
                padding:'4px 8px',
                borderRadius:'4px',
                fontSize:'10px',
                fontFamily:'monospace',
                fontWeight:700,
                border:'1px solid var(--border-bright)',
                boxShadow:'0 4px 12px rgba(0,0,0,0.5)',
                zIndex:1000,
                pointerEvents:'none'
              }}>
                {trimTooltip.text}
              </div>
            )}

            {/* GAP CONTEXT MENU */}
            {gapContextMenu && (
              <>
              <div style={{position:'fixed',inset:0,zIndex:9998}} onClick={(e)=>{e.stopPropagation();setGapContextMenu(null);}} onContextMenu={e=>{e.preventDefault();e.stopPropagation();setGapContextMenu(null);}} />
              <div style={{
                 position:'fixed', left:gapContextMenu.x, top:gapContextMenu.y, zIndex:9999,
                 background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'6px',
                 padding:'4px', boxShadow:'0 4px 12px rgba(0,0,0,0.5)', display:'flex', flexDirection:'column', width:'150px'
              }}>
                 <button onClick={(e) => {
                    e.stopPropagation();
                    const { gap } = gapContextMenu;
                    historyRef.current=[...historyRef.current.slice(-30),[...stateRef.current.clips]];
                    setClips(prev => prev.map(c => {
                       if (c.trackId === gap.trackId && c.start >= gap.start + gap.width) {
                          return { ...c, start: Math.max(0, c.start - gap.width) };
                       }
                       return c;
                    }));
                    setGapContextMenu(null);
                    notify('Ripple Delete applied to Gap');
                 }} style={{
                    background:'transparent', border:'none', color:'var(--text-primary)', padding:'6px 8px',
                    textAlign:'left', fontSize:'11px', fontFamily:'Syne,sans-serif', cursor:'pointer', borderRadius:'4px',
                    display:'flex', alignItems:'center', gap:'8px'
                 }} onMouseOver={e=>e.currentTarget.style.background='var(--accent)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{color:'var(--accent)'}}>🗑</span> Ripple Delete
                 </button>
              </div>
              </>
            )}

            {/* Timeline footer / transport */}
            <div style={{height:'30px',flexShrink:0,display:'flex',alignItems:'center',padding:'0 10px',gap:'10px',borderTop:'1px solid var(--border)',background:'var(--bg-tertiary)'}}>
              <div style={{display:'flex',gap:'3px',alignItems:'center'}}>
                {['⏮','⏪',isPlaying?'⏸':'▶','⏩','⏭'].map((ic,i)=>(
                  <button key={i} onClick={i===2?()=>setIsPlaying(p=>!p):undefined} style={{background:i===2?'var(--accent)':'none',border:'none',color:i===2?'white':'var(--text-secondary)',cursor:'pointer',fontSize:'12px',borderRadius:'4px',width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{ic}</button>
                ))}
              </div>
              <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700}}>{timecode}</span>
              {/* Progress bar */}
              <div style={{flex:1,height:'3px',background:'var(--border)',borderRadius:'2px',position:'relative',cursor:'pointer'}} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setPlayheadPos((e.clientX-r.left)/r.width*100);}}>
                <div style={{width:`${playheadPos}%`,height:'100%',background:'var(--accent)',borderRadius:'2px'}}/>
                <div style={{position:'absolute',left:`${playheadPos}%`,top:'50%',transform:'translate(-50%,-50%)',width:'9px',height:'9px',borderRadius:'50%',background:'var(--accent)',border:'1.5px solid white'}}/>
              </div>
              <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--text-secondary)'}}>00;02;01;22</span>
              {/* Auto-save indicator */}
              <div style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'4px'}}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--green)'}}/>
                <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — EFFECT CONTROLS ── */}
        <div style={{width:'240px',flexShrink:0,background:'var(--bg-secondary)',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',zIndex:30}}>
          {/* Tab bar */}
          <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
            {[{id:'effectcontrols' as RightTab,label:'Effect Controls'},{id:'info' as RightTab,label:'Info'}].map(t=>(
              <button key={t.id} onClick={()=>setRightTab(t.id)} style={{flex:1,padding:'7px 4px',border:'none',background:'transparent',borderBottom:`2px solid ${rightTab===t.id?'var(--accent)':'transparent'}`,color:rightTab===t.id?'var(--accent)':'var(--text-muted)',fontSize:'10px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,transition:'all 0.15s'}}>{t.label}</button>
            ))}
          </div>

          {rightTab==='effectcontrols' && (
            <EffectControls 
              clip={selectedClipObj} 
              playheadUnits={playheadPos / (zoom * 0.14)}
              onChange={(id, changes) => setClips(prev => prev.map(c => {
                if (c.id !== id) return c;
                const playheadUnits = playheadPos / (zoom * 0.14);
                const relTime = playheadUnits - c.start;
                
                let nextChanges = { ...changes };
                
                // Auto-keyframing logic
                if (c.keyframes) {
                  const updatedKfs = { ...c.keyframes };
                  Object.keys(changes).forEach(prop => {
                    if (updatedKfs[prop]) {
                      const existingIdx = updatedKfs[prop].findIndex(k => Math.abs(k.time - relTime) < 0.1);
                      const newVal = (changes as any)[prop];
                      if (existingIdx !== -1) {
                        updatedKfs[prop][existingIdx] = { ...updatedKfs[prop][existingIdx], value: newVal };
                      } else {
                        updatedKfs[prop] = [...updatedKfs[prop], { id: Date.now(), time: relTime, value: newVal, interpolation: 'linear' }].sort((a,b) => a.time - b.time);
                      }
                      // remove from top-level changes so we don't update static val if keyframed
                      delete (nextChanges as any)[prop];
                    }
                  });
                  nextChanges = { ...nextChanges, keyframes: updatedKfs } as any;
                }
                
                return { ...c, ...nextChanges };
              }))} 
              onToggleKeyframing={(id, prop) => setClips(prev => prev.map(c => {
                if (c.id !== id) return c;
                const kfs = c.keyframes || {};
                if (kfs[prop]) {
                  const nextKfs = { ...kfs };
                  delete nextKfs[prop];
                  return { ...c, keyframes: Object.keys(nextKfs).length > 0 ? nextKfs : undefined };
                } else {
                  const playheadUnits = playheadPos / (zoom * 0.14);
                  const relTime = playheadUnits - c.start;
                  const currentVal = getClipValue(c, prop, playheadUnits);
                  return { ...c, keyframes: { ...kfs, [prop]: [{ id: Date.now(), time: relTime, value: currentVal, interpolation: 'linear' }] } };
                }
              }))}
              onJumpToKeyframe={(id, prop, dir) => {
                const clip = clips.find(c => c.id === id);
                if (!clip || !clip.keyframes?.[prop]) return;
                const playheadUnits = playheadPos / (zoom * 0.14);
                const relTime = playheadUnits - clip.start;
                const sorted = [...clip.keyframes[prop]].sort((a,b) => a.time - b.time);
                let target: Keyframe | undefined;
                if (dir === 'prev') {
                  target = [...sorted].reverse().find(k => k.time < relTime - 0.1);
                } else {
                  target = sorted.find(k => k.time > relTime + 0.1);
                }
                if (target) setPlayheadPos((clip.start + target.time) * (zoom * 0.14));
              }}
            />
          )}

          {rightTab==='info' && (
            <div style={{flex:1,padding:'12px',overflowY:'auto'}}>
              <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'10px'}}>SEQUENCE INFO</div>
              {[
                {l:'Sequence',v:'Strike_the_Heavens'},{l:'Duration',v:'00;02;01;22'},
                {l:'Start TC',v:'00;00;00;00'},{l:'Resolution',v:'1920 × 1080'},
                {l:'Frame Rate',v:'29.97 fps'},{l:'Audio',v:'48000 Hz Stereo'},
                {l:'Editing Mode',v:'Desktop'},
              ].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',marginBottom:'7px'}}>
                  <span style={{fontSize:'10px',color:'var(--text-secondary)'}}>{r.l}</span>
                  <span style={{fontSize:'10px',color:'var(--text-primary)',fontFamily:'monospace',textAlign:'right',maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis'}}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Branding footer */}
          <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}><span style={{color:'var(--accent)',fontWeight:700}}>ECLIPSO</span> v1.0 Beta</span>
            <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'monospace'}}>30 fps</span>
          </div>
        </div>
      </div>

      {/* ─── STATUS BAR ─── */}
      <div style={{height:'22px',flexShrink:0,background:'var(--bg-tertiary)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 12px',gap:'16px',zIndex:50}}>
        <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700}}>{timecode}</span>
        <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>Duration: 02:01;22</span>
        <span style={{fontSize:'9px',color:'var(--text-muted)'}}>In: 00;00;00;00 · Out: 00;02;01;22</span>
        <div style={{flex:1}}/>
        {/* Undo/Redo indicators */}
        <div style={{display:'flex',gap:'6px',alignItems:'center',marginRight:'8px'}}>
          <button onClick={undo} disabled={history.past.length===0} title="Undo (Ctrl+Z)" style={{background:'none',border:'none',cursor:history.past.length>0?'pointer':'not-allowed',fontSize:'11px',opacity:history.past.length>0?1:0.3,color:history.past.length>0?'var(--text-secondary)':'var(--text-muted)',padding:'2px 4px',borderRadius:'3px'}}>↩</button>
          <button onClick={redo} disabled={history.future.length===0} title="Redo (Ctrl+Y)" style={{background:'none',border:'none',cursor:history.future.length>0?'pointer':'not-allowed',fontSize:'11px',opacity:history.future.length>0?1:0.3,color:history.future.length>0?'var(--text-secondary)':'var(--text-muted)',padding:'2px 4px',borderRadius:'3px'}}>↪</button>
          <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'monospace',marginLeft:'4px'}}>{history.past.length}/{history.future.length}</span>
        </div>
        {/* Audio level meters */}
        <div style={{display:'flex',gap:'2px',alignItems:'center'}}>
          <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',marginRight:'3px'}}>L</span>
          <div style={{width:'60px',height:'6px',background:'var(--border)',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{width:'72%',height:'100%',background:'linear-gradient(to right,#00FF94,#FFD60A,#FF3B82 90%)'}}/>
          </div>
          <div style={{width:'60px',height:'6px',background:'var(--border)',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{width:'68%',height:'100%',background:'linear-gradient(to right,#00FF94,#FFD60A,#FF3B82 90%)'}}/>
          </div>
          <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',marginLeft:'3px'}}>R</span>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>29.97 fps</span>
          <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>1920×1080</span>
          <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>Zoom: {Math.round(zoom*100)}%</span>
        </div>
      </div>

      {showExport && <ExportModal onClose={()=>setShowExport(false)}/>}
      {notification && <div style={{position:'fixed',bottom:'30px',left:'50%',transform:'translateX(-50%)',zIndex:2000,padding:'9px 18px',borderRadius:'9px',background:'var(--bg-card)',border:'1px solid var(--accent)',fontSize:'12px',fontFamily:'Syne,sans-serif',fontWeight:600,color:'var(--accent)',boxShadow:'0 8px 30px rgba(0,0,0,0.5)',animation:'fadeInUp 0.3s ease',whiteSpace:'nowrap'}}>✓ {notification}</div>}
    </div>
  );
}
