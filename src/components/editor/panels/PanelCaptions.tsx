'use client';
import React, { memo } from 'react';

function PanelCaptions() {
  const lines = [
    {t:'00:00:02',text:'The hunt begins with a bang'},
    {t:'00:00:05',text:'As the storm approaches...'},
    {t:'00:00:09',text:"Nothing can stop what's coming"},
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

export default memo(PanelCaptions);
