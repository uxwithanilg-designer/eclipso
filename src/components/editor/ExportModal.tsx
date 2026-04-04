'use client';
import { useState } from 'react';

interface ExportModalProps { onClose: () => void }

export default function ExportModal({ onClose }: ExportModalProps) {
  const [format, setFormat] = useState('H.264 MP4');
  const [res, setRes]       = useState('1080p (1920×1080)');
  const [fps, setFps]       = useState('30 fps');
  const [preset, setPreset] = useState('');
  const platforms = [
    {n:'YouTube',    icon:'🎬', tag:'1080p H.264'},
    {n:'Reels/TikTok',icon:'📱',tag:'9:16 1080p'},
    {n:'Vimeo',      icon:'🎥', tag:'4K ProRes'},
    {n:'Broadcast',  icon:'📺', tag:'1080i 29.97'},
  ];
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={onClose}>
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'20px',width:'100%',maxWidth:'480px',position:'relative',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,var(--accent),var(--cyan),var(--pink))'}}/>
        <div style={{padding:'24px 24px 0'}}>
          <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'18px',marginBottom:'16px',color:'var(--text-primary)'}}>Export Project</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'16px'}}>
            {platforms.map(p=>(
              <button key={p.n} onClick={()=>setPreset(p.n)} style={{padding:'7px 4px',borderRadius:'8px',border:`1px solid ${preset===p.n?'var(--accent)':'var(--border)'}`,background:preset===p.n?'var(--accent-dim)':'var(--bg-secondary)',cursor:'pointer',transition:'all 0.15s',textAlign:'center'}}>
                <div style={{fontSize:'16px',marginBottom:'3px'}}>{p.icon}</div>
                <div style={{fontSize:'9px',fontFamily:'Syne,sans-serif',fontWeight:700,color:preset===p.n?'var(--accent)':'var(--text-secondary)'}}>{p.n}</div>
                <div style={{fontSize:'8px',color:'var(--text-muted)'}}>{p.tag}</div>
              </button>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
            {[
              {l:'Format',    v:format,  opts:['H.264 MP4','H.265 HEVC','ProRes 4444','WebM VP9','GIF'],         set:setFormat},
              {l:'Resolution',v:res,     opts:['4K UHD (3840×2160)','1080p (1920×1080)','720p','480p','Custom'], set:setRes},
              {l:'Frame Rate',v:fps,     opts:['23.976 fps','24 fps','29.97 fps','30 fps','60 fps'],              set:setFps},
              {l:'Bitrate',   v:'VBR 2-pass', opts:['CBR','VBR 1-pass','VBR 2-pass','Auto'],                    set:()=>{}},
            ].map(f=>(
              <div key={f.l}>
                <div style={{fontSize:'9px',color:'var(--text-muted)',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'4px'}}>{f.l.toUpperCase()}</div>
                <select value={f.v} onChange={e=>f.set(e.target.value)} style={{width:'100%',padding:'7px 8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'7px',color:'var(--text-primary)',fontSize:'11px',outline:'none'}}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
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
