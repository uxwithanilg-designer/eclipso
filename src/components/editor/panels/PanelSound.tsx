'use client';
import React, { memo, useState } from 'react';

function PanelSound() {
  const [type, setType] = useState<'dialogue'|'music'|'sfx'|'ambience'>('dialogue');
  const [ducking, setDucking] = useState(false);

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

      {type==='dialogue'&&(
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

      {type==='music'&&(
        <div>
          <div style={{fontSize:'9px',letterSpacing:'1.5px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'6px',borderBottom:'1px solid var(--border)',paddingBottom:'4px'}}>AUTO-DUCKING</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
            <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Enable Ducking</span>
            <button onClick={()=>setDucking(p=>!p)} style={{width:'36px',height:'20px',borderRadius:'10px',border:'none',background:ducking?'var(--accent)':'var(--border)',cursor:'pointer',position:'relative',transition:'all 0.2s'}}>
              <div style={{position:'absolute',top:'2px',left:ducking?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'white',transition:'all 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
            </button>
          </div>
          {ducking&&(
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

      {(type==='sfx'||type==='ambience')&&(
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

export default memo(PanelSound);
