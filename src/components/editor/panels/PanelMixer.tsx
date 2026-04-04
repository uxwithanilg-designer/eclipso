'use client';
import React, { memo } from 'react';

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
            <div style={{width:'12px',height:'80px',background:'var(--bg-card)',borderRadius:'3px',overflow:'hidden',position:'relative',border:'1px solid var(--border)'}}>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:'65%',background:`linear-gradient(to top,${t.color},${t.color}88,#FFD60A33)`,transition:'height 0.1s'}}/>
              {[0,25,50,75].map(p=>(
                <div key={p} style={{position:'absolute',left:0,right:0,bottom:`${p}%`,height:'1px',background:'var(--bg-primary)',opacity:0.5}}/>
              ))}
            </div>
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

export default memo(PanelMixer);
