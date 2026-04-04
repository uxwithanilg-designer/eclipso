'use client';
import React, { memo, useState } from 'react';
import { ProjectFile } from '@/types/editor';

interface Props {
  files: ProjectFile[];
  onUploadClick(): void;
  onImport(f: ProjectFile | string): void;
  onDragStartItem?(e: React.DragEvent, item: any): void;
  onDoubleClickItem?(item: any): void;
}

function PanelMedia({ files, onUploadClick, onImport, onDragStartItem, onDoubleClickItem }: Props) {
  const bins = ['All Media', 'Video', 'Audio', 'Images', 'B-Roll'];
  const [bin, setBin] = useState('All Media');

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <span style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>PROJECT BINS</span>
        <button style={{background:'var(--accent-dim)',border:'1px solid rgba(124,92,255,0.3)',color:'var(--accent)',fontSize:'10px',borderRadius:'5px',padding:'2px 8px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600}}>+ Bin</button>
      </div>
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'10px'}}>
        {bins.map(b=>(
          <button key={b} onClick={()=>setBin(b)} style={{padding:'3px 8px',borderRadius:'6px',fontSize:'10px',fontFamily:'Syne,sans-serif',fontWeight:600,cursor:'pointer',background:bin===b?'var(--accent-dim)':'var(--bg-card)',border:`1px solid ${bin===b?'var(--accent)':'var(--border)'}`,color:bin===b?'var(--accent)':'var(--text-secondary)',transition:'all 0.15s'}}>{b}</button>
        ))}
      </div>
      <div onClick={onUploadClick} style={{border:'2px dashed var(--border)',borderRadius:'10px',padding:'12px',textAlign:'center',marginBottom:'10px',cursor:'pointer',transition:'all 0.2s'}}
        onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--accent)')}
        onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}
      >
        <div style={{fontSize:'18px',marginBottom:'4px'}}>+</div>
        <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>Click or Ctrl+I to import</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
        {files.length === 0 && <div style={{fontSize:'10px',color:'var(--text-muted)',textAlign:'center',padding:'10px'}}>No files imported</div>}
        {files.map((f)=>(
          <div key={f.id}
            draggable
            onDragStart={e=>onDragStartItem&&onDragStartItem(e,{type:f.type,label:f.name,color:f.color,duration:f.duration,url:f.url})}
            onDoubleClick={()=>onDoubleClickItem?onDoubleClickItem({type:f.type,label:f.name,color:f.color,duration:f.duration,url:f.url}):onImport(f)}
            style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 8px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',cursor:'grab',transition:'all 0.15s',position:'relative'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-bright)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{width:'36px',height:'24px',borderRadius:'4px',background:`${f.color}20`,border:`1px solid ${f.color}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden',position:'relative'}}>
              {f.thumbnailUrl?(
                <img src={f.thumbnailUrl} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              ):f.type==='audio'?(
                <div style={{display:'flex',gap:'1px',alignItems:'center'}}>{[3,5,4,6,4,3].map((h,k)=><div key={k} style={{width:'2px',height:`${h*3}px`,background:f.color,borderRadius:'1px',opacity:0.7}}/>)}</div>
              ):null}
              {f.hasAudio&&f.type==='video'&&(
                <div style={{position:'absolute',bottom:'2px',right:'2px',display:'flex',gap:'1px',opacity:0.9}}>
                  {[2,3,2,4].map((h,k)=><div key={k} style={{width:'1.5px',height:`${h*1.5}px`,background:'white',borderRadius:'1px'}}/>)}
                </div>
              )}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'11px',fontWeight:600,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
              <div style={{fontSize:'9px',color:'var(--text-secondary)'}}>{f.type}{f.duration?` · ${Math.round(f.duration/15)}s`:''}</div>
            </div>
            <button onClick={()=>onImport(f)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'11px',flexShrink:0}}>▶</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(PanelMedia);
