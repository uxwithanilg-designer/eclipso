'use client';
import React, { memo } from 'react';
import { Marker, HistoryEntry, MAX_HISTORY } from '@/types/editor';

// ── History sub-panel ──
function HistoryPanel({
  past, present, future, onJumpTo
}: {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
  onJumpTo(idx: number): void;
}) {
  const all = [...past, present, ...future];
  const currentIdx = past.length;

  const fmt = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  const actionIcon: Record<string, string> = {
    'Add':'➕','Cut':'✂','Delete':'🗑','Move':'↔','Trim':'◀▶','Source':'📥','Ripple':'⟪','Drag':'🖱',
    'Split':'✂','Import':'📂','Insert':'⤵','Overwrite':'⤴','Change':'⚙','Apply':'✨','Set':'⚡',
    'Clear':'🗑','Undo':'↩','Redo':'↪','Update':'📝','Create':'➕','Remove':'✕','Ripple Delete':'🗑',
  };
  const getIcon = (label: string) => {
    const key = Object.keys(actionIcon).find(k => label.startsWith(k));
    return key ? actionIcon[key] : '⚙';
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <span style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>HISTORY</span>
        <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'monospace'}}>{all.length}/{MAX_HISTORY}</span>
      </div>
      {all.length <= 1 && <div style={{fontSize:'10px',color:'var(--text-muted)',textAlign:'center',padding:'12px 0',opacity:0.5}}>No actions yet.<br/>Edit the timeline to record history.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
        {[...all].reverse().map((entry, revIdx) => {
          const idx = all.length - 1 - revIdx;
          const isCurrent = idx === currentIdx;
          const isPast = idx < currentIdx;
          const isFuture = idx > currentIdx;
          return (
            <div key={entry.id} onClick={() => onJumpTo(idx)}
              style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 8px',borderRadius:'6px',
                background:isCurrent?'var(--accent-dim)':'transparent',
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
      {future.length > 0 && (
        <div style={{marginTop:'8px',padding:'6px 8px',borderRadius:'6px',background:'rgba(255,214,10,0.06)',border:'1px solid rgba(255,214,10,0.2)',fontSize:'9px',color:'var(--yellow)',fontFamily:'Syne,sans-serif',textAlign:'center'}}>
          ↪ {future.length} redo action{future.length > 1 ? 's' : ''} available (Ctrl+Shift+Z)
        </div>
      )}
    </div>
  );
}

// ── Main Markers panel ──
interface Props {
  markers: Marker[];
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
  onJump(t: number): void;
  onJumpToHistory(idx: number): void;
  showHistory?: boolean;
}

function PanelMarkers({ markers, past, present, future, onJump, onJumpToHistory, showHistory }: Props) {
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

      {showHistory && (
        <HistoryPanel past={past} present={present} future={future} onJumpTo={onJumpToHistory}/>
      )}
    </div>
  );
}

export { HistoryPanel };
export default memo(PanelMarkers);
