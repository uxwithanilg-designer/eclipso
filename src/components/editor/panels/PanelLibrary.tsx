'use client';
import React, { memo, useState } from 'react';
import Link from 'next/link';
import { MUSIC_TRACKS_DATA, CLIP_WAVE } from '@/types/editor';

interface Props {
  onImport(t: typeof MUSIC_TRACKS_DATA[0]): void;
  onDragStartItem?(e: React.DragEvent, item: any): void;
}

function PanelLibrary({ onImport, onDragStartItem }: Props) {
  const [q, setQ] = useState('');
  const filtered = MUSIC_TRACKS_DATA.filter(t => t.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'10px'}}>MUSIC LIBRARY</div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search 1000+ tracks..." style={{width:'100%',padding:'7px 10px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-primary)',fontSize:'11px',outline:'none',marginBottom:'8px'}}/>
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {filtered.map(t=>(
          <div key={t.id}
            draggable
            onDragStart={e=>onDragStartItem&&onDragStartItem(e,{type:'audio',label:t.title,color:t.accent,duration:150})}
            style={{padding:'9px 10px',borderRadius:'9px',background:'var(--bg-secondary)',border:'1px solid var(--border)',cursor:'grab',transition:'all 0.15s'}}
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

export default memo(PanelLibrary);
