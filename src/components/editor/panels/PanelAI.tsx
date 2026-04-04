'use client';
import React, { memo } from 'react';

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

export default memo(PanelAI);
