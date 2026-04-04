'use client';
import { useEditorStore } from '@/store/editorStore';

interface Props {
  onDragStartItem: (e: React.DragEvent, item: any) => void;
  onInsert: (mode: 'insert' | 'overwrite') => void;
}

export default function SourceMonitor({ onDragStartItem, onInsert }: Props) {
  const sourceClip        = useEditorStore(s => s.sourceClip);
  const sourceIsPlaying   = useEditorStore(s => s.sourceIsPlaying);
  const sourcePlayheadPct = useEditorStore(s => s.sourcePlayheadPct);
  const sourceInPct       = useEditorStore(s => s.sourceInPct);
  const sourceOutPct      = useEditorStore(s => s.sourceOutPct);
  const setSourceIsPlaying   = useEditorStore(s => s.setSourceIsPlaying);
  const setSourcePlayheadPct = useEditorStore(s => s.setSourcePlayheadPct);
  const setSourceInPct       = useEditorStore(s => s.setSourceInPct);
  const setSourceOutPct      = useEditorStore(s => s.setSourceOutPct);
  const setSourceClip        = useEditorStore(s => s.setSourceClip);

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const update = (ev: MouseEvent) => setSourcePlayheadPct(Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100)));
    update(e as unknown as MouseEvent);
    const move = (ev: MouseEvent) => update(ev);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  return (
    <div style={{flex:1,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{padding:'5px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
        <span style={{fontSize:'10px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'150px'}}>
          Source: {sourceClip ? sourceClip.label.replace('.mp4','') : '(no clips)'}
        </span>
        {sourceClip ? (
          <div style={{display:'flex',gap:'4px'}}>
            <button title="Insert Range" onClick={()=>onInsert('insert')} style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--accent)',cursor:'pointer',fontSize:'9px',padding:'3px 6px',borderRadius:'4px',fontFamily:'Syne,sans-serif',fontWeight:700}}>Insert</button>
            <button title="Overwrite Range" onClick={()=>onInsert('overwrite')} style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--pink)',cursor:'pointer',fontSize:'9px',padding:'3px 6px',borderRadius:'4px',fontFamily:'Syne,sans-serif',fontWeight:700}}>Overwrite</button>
          </div>
        ) : (
          <div style={{display:'flex',gap:'4px'}}>
            {['◁','▷'].map((ic,i)=><button key={i} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'11px'}}>{ic}</button>)}
          </div>
        )}
      </div>

      {/* Preview area */}
      <div style={{flex:1,background:'#050508',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',minWidth:0,minHeight:0}}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          try {
            const item = JSON.parse(e.dataTransfer.getData('application/json'));
            setSourceClip({ label: item.label, type: item.type, color: item.color, duration: item.duration || 150, url: item.url });
            setSourcePlayheadPct(0); setSourceInPct(0); setSourceOutPct(100); setSourceIsPlaying(false);
          } catch(err){}
        }}
      >
        {sourceClip?.url ? (
          <video
            src={sourceClip.url}
            style={{width:'100%',height:'100%',objectFit:'contain',position:'relative',zIndex:2,cursor:'grab'}}
            draggable
            onDragStart={(e) => {
              const offset = Math.min(sourceInPct, sourceOutPct) / 100 * sourceClip.duration;
              const length = Math.abs(sourceOutPct - sourceInPct) / 100 * sourceClip.duration;
              onDragStartItem(e, {type: sourceClip.type, label: sourceClip.label, color: sourceClip.color, duration: length, url: sourceClip.url, sourceOffset: offset});
            }}
            onTimeUpdate={(e) => {
              if (sourceClip.duration > 0 && sourceIsPlaying) {
                const pct = (e.currentTarget.currentTime / (sourceClip.duration / 15)) * 100;
                setSourcePlayheadPct(pct);
              }
            }}
            ref={(el) => {
              if (el) {
                const expectedTime = (sourcePlayheadPct / 100) * (sourceClip.duration / 15);
                if (Math.abs(el.currentTime - expectedTime) > 0.3 && !sourceIsPlaying) el.currentTime = expectedTime;
                if (sourceIsPlaying && el.paused) { let p = el.play(); if (p) p.catch(()=>{}); }
                if (!sourceIsPlaying && !el.paused) el.pause();
              }
            }}
          />
        ) : sourceClip ? (
          <div style={{position:'absolute',inset:'8%',border:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',background:`${sourceClip.color}15`,borderRadius:'4px',zIndex:2}}>
            <span style={{fontSize:'32px',opacity:0.8}}>{sourceClip.type==='video'?'🎬':'🎵'}</span>
          </div>
        ) : (
          <div style={{textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'28px',marginBottom:'6px',opacity:0.15}}>🎬</div>
            <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>Double-click clip or drag to preview</div>
          </div>
        )}
      </div>

      {/* Scrubber */}
      {sourceClip && (
        <div style={{height:'16px',background:'var(--bg-secondary)',borderTop:'1px solid var(--border)',position:'relative',cursor:'pointer'}} onMouseDown={handleScrubberMouseDown}>
          <div style={{position:'absolute',left:`${Math.min(sourceInPct,sourceOutPct)}%`,width:`${Math.abs(sourceOutPct-sourceInPct)}%`,top:0,bottom:0,background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',left:`${sourceInPct}%`,top:0,bottom:0,width:'2px',background:'var(--cyan)',zIndex:2}}>
            <div style={{position:'absolute',top:0,left:'-4px',width:'4px',height:'6px',borderLeft:'2px solid var(--cyan)',borderTop:'2px solid var(--cyan)'}}/>
          </div>
          <div style={{position:'absolute',left:`${sourceOutPct}%`,top:0,bottom:0,width:'2px',background:'var(--pink)',zIndex:2}}>
            <div style={{position:'absolute',top:0,right:'-4px',width:'4px',height:'6px',borderRight:'2px solid var(--pink)',borderTop:'2px solid var(--pink)'}}/>
          </div>
          <div style={{position:'absolute',left:`${sourcePlayheadPct}%`,top:0,bottom:0,width:'1px',background:'var(--yellow)',zIndex:3,pointerEvents:'none'}}>
            <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'4px solid transparent',borderRight:'4px solid transparent',borderTop:'5px solid var(--yellow)'}}/>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{padding:'4px 8px',display:'flex',gap:'4px',alignItems:'center',borderTop:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
        <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--text-secondary)',marginRight:'4px',minWidth:'55px'}}>
          {sourceClip ? `Dur: ${(sourceClip.duration * Math.abs(sourceOutPct - sourceInPct)/100 / 15).toFixed(1)}s` : '00;00;00;00'}
        </span>
        <div style={{flex:1,display:'flex',justifyContent:'center',gap:'3px',alignItems:'center'}}>
          <button title="Mark In (I)" onClick={()=>setSourceInPct(sourcePlayheadPct)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px',padding:'2px 3px',borderRadius:'3px',fontFamily:'monospace'}}>{'{I}'}</button>
          {(['⏮','⏪', sourceIsPlaying?'⏸':'▶','⏩','⏭'] as const).map((ic,i)=>(
            <button key={i} onClick={() => { if(i===2) setSourceIsPlaying(!sourceIsPlaying); }}
              style={{background:i===2?'var(--accent)':'none',border:'none',color:i===2?'white':'var(--text-secondary)',width:i===2?'20px':'auto',height:i===2?'20px':'auto',borderRadius:'50%',cursor:'pointer',fontSize:i===2?'8px':'11px',display:'flex',alignItems:'center',justifyContent:'center'}}
            >{ic}</button>
          ))}
          <button title="Mark Out (O)" onClick={()=>setSourceOutPct(sourcePlayheadPct)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px',padding:'2px 3px',borderRadius:'3px',fontFamily:'monospace'}}>{'O}'}</button>
        </div>
        <div style={{display:'flex',gap:'3px'}}>
          <button draggable
            onDragStart={e=>onDragStartItem(e,{type:'video',label:sourceClip?.label||'',color:sourceClip?.color||'',duration:sourceClip?Math.abs(sourceOutPct-sourceInPct)/100*sourceClip.duration:100,url:sourceClip?.url,sourceOffset:sourceClip?Math.min(sourceInPct,sourceOutPct)/100*sourceClip.duration:0})}
            title="Drag Video Only" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',cursor:sourceClip?'grab':'default',fontSize:'9px',padding:'2px 4px',borderRadius:'3px',opacity:sourceClip?1:0.3}}>V</button>
          <button draggable
            onDragStart={e=>onDragStartItem(e,{type:'audio',label:sourceClip?.label||'',color:sourceClip?.color||'',duration:sourceClip?Math.abs(sourceOutPct-sourceInPct)/100*sourceClip.duration:100,url:sourceClip?.url,sourceOffset:sourceClip?Math.min(sourceInPct,sourceOutPct)/100*sourceClip.duration:0})}
            title="Drag Audio Only" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',cursor:sourceClip?'grab':'default',fontSize:'9px',padding:'2px 4px',borderRadius:'3px',opacity:sourceClip?1:0.3}}>A</button>
        </div>
      </div>
    </div>
  );
}
