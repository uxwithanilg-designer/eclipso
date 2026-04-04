'use client';
import React, { memo, useState } from 'react';
import { VIDEO_EFFECTS, AUDIO_EFFECTS } from '@/types/editor';

function PanelEffects() {
  const [q, setQ] = useState('');
  const cats = [...new Set(VIDEO_EFFECTS.map(e => e.cat))];
  const filtered = VIDEO_EFFECTS.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search effects..." style={{width:'100%',padding:'7px 10px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:'11px',outline:'none',marginBottom:'10px'}}/>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'8px'}}>VIDEO EFFECTS</div>
      {cats.map(cat=>{
        const items=filtered.filter(e=>e.cat===cat);
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

export default memo(PanelEffects);
