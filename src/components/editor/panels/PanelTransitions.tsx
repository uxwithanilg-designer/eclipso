'use client';
import React, { memo, useState } from 'react';
import { TRANSITION_LIST } from '@/types/editor';

function PanelTransitions() {
  const cats = [...new Set(TRANSITION_LIST.map(t => t.cat))];
  const [hovered, setHovered] = useState<string | null>(null);

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
              onDragStart={e=>handleDragStart(e,tr)}
              style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',borderRadius:'6px',cursor:'grab',transition:'all 0.15s',position:'relative'}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';setHovered(tr.name);}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';setHovered(null);}}
            >
              <div style={{width:'32px',height:'20px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'3px',overflow:'hidden',position:'relative',flexShrink:0}}>
                <div style={{
                  position:'absolute',inset:0,background:'var(--accent-dim)',opacity:0.3,
                  animation:hovered===tr.name?'preview-bg 2s infinite':'none'
                }}/>
                <div style={{
                  position:'absolute',bottom:0,width:'100%',background:'var(--accent)',
                  left:tr.name.includes('Right→Left')||tr.name==='Slide Left'?'100%':tr.name.includes('Left→Right')||tr.name==='Slide Right'?'-100%':'0',
                  top:tr.name.includes('Top→Bottom')?'-100%':'0',
                  transform:hovered===tr.name?(
                    tr.name.includes('Left→Right')||tr.name==='Slide Right'?'translateX(100%)':
                    tr.name.includes('Right→Left')||tr.name==='Slide Left'?'translateX(-100%)':
                    tr.name.includes('Top→Bottom')?'translateY(100%)':
                    tr.name.includes('Dissolve')?'scale(1)':'none'
                  ):'none',
                  opacity:tr.name.includes('Dissolve')?(hovered===tr.name?1:0):1,
                  transition:hovered===tr.name?'all 1s ease-in-out':'none'
                }}/>
              </div>
              <span style={{fontSize:'11px',color:'var(--text-secondary)',flex:1}}>{tr.name}</span>
              {tr.key&&<span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'monospace',background:'var(--bg-card)',padding:'1px 5px',borderRadius:'3px',border:'1px solid var(--border)'}}>{tr.key}</span>}
            </div>
          ))}
        </div>
      ))}
      <style jsx global>{`
        @keyframes preview-bg {
          0% { opacity: 0.1; }
          50% { opacity: 0.4; }
          100% { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

export default memo(PanelTransitions);
