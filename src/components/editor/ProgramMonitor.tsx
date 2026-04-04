'use client';
import { useEditorStore, selectClips, selectTransitions } from '@/store/editorStore';
import { getClipValue, CLIP_WAVE } from '@/types/editor';

export default function ProgramMonitor() {
  const clips       = useEditorStore(selectClips);
  const transitions = useEditorStore(selectTransitions);
  const tracks      = useEditorStore(s => s.tracks);
  const playheadPos = useEditorStore(s => s.playheadPos);
  const zoom        = useEditorStore(s => s.zoom);
  const isPlaying   = useEditorStore(s => s.isPlaying);
  const workspace   = useEditorStore(s => s.workspace);
  const setIsPlaying= useEditorStore(s => s.setIsPlaying);
  const setPlayheadPos = useEditorStore(s => s.setPlayheadPos);

  const playheadUnits = playheadPos / (zoom * 0.14);

  // Timecode display
  const totalFrames = Math.round(playheadUnits / 15 * 30);
  const ss = Math.floor(totalFrames / 30);
  const ff = totalFrames % 30;
  const mm = Math.floor(ss / 60);
  const hh = Math.floor(mm / 60);
  const timecode = `${String(hh).padStart(2,'0')};${String(mm%60).padStart(2,'0')};${String(ss%60).padStart(2,'0')};${String(ff).padStart(2,'0')}`;

  const activeTr = transitions.find(t => playheadUnits >= t.startTime && playheadUnits < t.startTime + t.duration);
  const activeAudClips = clips.filter(c => c.type === 'audio' && c.url && playheadUnits >= c.start && playheadUnits < c.start + c.width);

  const syncVideo = (el: HTMLVideoElement | null, targetTime: number) => {
    if (!el) return;
    const threshold = isPlaying ? 0.5 : 0.05;
    if (Math.abs(el.currentTime - targetTime) > threshold) el.currentTime = targetTime;
    if (isPlaying && el.paused) el.play().catch(()=>{});
    else if (!isPlaying && !el.paused) el.pause();
  };

  const renderContent = () => {
    if (activeTr) {
      const tClips = clips.filter(c => c.trackId === activeTr.trackId && c.type === 'video').sort((a,b) => a.start - b.start);
      const clipA = tClips.find(c => activeTr.startTime > c.start && activeTr.startTime < c.start + c.width + 5);
      const clipB = tClips.find(c => activeTr.startTime + activeTr.duration > c.start && activeTr.startTime + activeTr.duration < c.start + c.width + 5);
      const progress = Math.max(0, Math.min(1, (playheadUnits - activeTr.startTime) / activeTr.duration));

      if (clipA && clipB) {
        const cvA = (p: string) => getClipValue(clipA, p, playheadUnits);
        const cvB = (p: string) => getClipValue(clipB, p, playheadUnits);
        const timeA = (playheadUnits - clipA.start + (clipA.sourceOffset||0))/15;
        const timeB = (playheadUnits - clipB.start + (clipB.sourceOffset||0))/15;

        if (activeTr.type.includes('Dissolve')) return (
          <div style={{width:'100%',height:'100%',position:'relative'}}>
            <video src={clipA.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',transform:`translate(${cvA('x')}px,${cvA('y')}px) scale(${cvA('scale')/100}) rotate(${cvA('rotation')}deg)`,opacity:(cvA('opacity')/100)*(1-progress),zIndex:2}} ref={el=>syncVideo(el,timeA)}/>
            <video src={clipB.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',transform:`translate(${cvB('x')}px,${cvB('y')}px) scale(${cvB('scale')/100}) rotate(${cvB('rotation')}deg)`,opacity:(cvB('opacity')/100)*progress,zIndex:3}} ref={el=>syncVideo(el,timeB)}/>
          </div>
        );
        if (activeTr.type === 'Dip to Black' || activeTr.type === 'Dip to White') {
          const dipColor = activeTr.type === 'Dip to Black' ? '#000' : '#fff';
          const opA = progress < 0.5 ? 1 - progress*2 : 0;
          const opB = progress >= 0.5 ? (progress-0.5)*2 : 0;
          return (
            <div style={{width:'100%',height:'100%',position:'relative',background:dipColor}}>
              <video src={clipA.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',opacity:(cvA('opacity')/100)*opA,zIndex:2}} ref={el=>syncVideo(el,timeA)}/>
              <video src={clipB.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',opacity:(cvB('opacity')/100)*opB,zIndex:3}} ref={el=>syncVideo(el,timeB)}/>
            </div>
          );
        }
        if (activeTr.type.startsWith('Wipe')) {
          const ap = activeTr.reversed ? 1-progress : progress;
          let clipPath = 'inset(0 0 0 0)';
          if (activeTr.type.includes('Left→Right')) clipPath = `inset(0 ${100-ap*100}% 0 0)`;
          if (activeTr.type.includes('Right→Left')) clipPath = `inset(0 0 0 ${100-ap*100}%)`;
          if (activeTr.type.includes('Top→Bottom')) clipPath = `inset(0 0 ${100-ap*100}% 0)`;
          return (
            <div style={{width:'100%',height:'100%',position:'relative'}}>
              <video src={clipA.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',opacity:cvA('opacity')/100,zIndex:2}} ref={el=>syncVideo(el,timeA)}/>
              <video src={clipB.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',opacity:cvB('opacity')/100,zIndex:3,clipPath,WebkitClipPath:clipPath}} ref={el=>syncVideo(el,timeB)}/>
            </div>
          );
        }
        if (activeTr.type.startsWith('Slide')) {
          const ap = activeTr.reversed ? 1-progress : progress;
          let transformB = 'none';
          if (activeTr.type.includes('Left')) transformB = `translateX(${(1-ap)*100}%)`;
          if (activeTr.type.includes('Right')) transformB = `translateX(${(ap-1)*100}%)`;
          return (
            <div style={{width:'100%',height:'100%',position:'relative',overflow:'hidden'}}>
              <video src={clipA.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',opacity:cvA('opacity')/100,zIndex:2}} ref={el=>syncVideo(el,timeA)}/>
              <video src={clipB.url} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',opacity:cvB('opacity')/100,zIndex:3,transform:`translate(${cvB('x')}px,${cvB('y')}px) scale(${cvB('scale')/100}) rotate(${cvB('rotation')}deg) ${transformB}`}} ref={el=>syncVideo(el,timeB)}/>
            </div>
          );
        }
      }
    }

    const activeVidClip = clips.find(c => c.type === 'video' && playheadUnits >= c.start && playheadUnits < c.start + c.width);
    return (
      <div style={{width:'100%',height:'100%',position:'relative'}}>
        {activeVidClip && (() => {
          const cv = (p: string) => getClipValue(activeVidClip, p, playheadUnits);
          const hasLinkedAudio = activeVidClip.groupId != null && clips.some(c => c.groupId === activeVidClip.groupId && c.type === 'audio' && c.id !== activeVidClip.id);
          const isMuted = hasLinkedAudio || (tracks.find(t => t.id === activeVidClip.trackId)?.muted || false) || !isPlaying;
          return (
            <video key={activeVidClip.id} src={activeVidClip.url}
              style={{width:'100%',height:'100%',objectFit:'contain',position:'relative',zIndex:2,transform:`translate(${cv('x')}px,${cv('y')}px) scale(${cv('scale')/100}) rotate(${cv('rotation')}deg)`,transformOrigin:`${activeVidClip.anchorX??960}px ${activeVidClip.anchorY??540}px`,opacity:cv('opacity')/100}}
              muted={isMuted}
              ref={(el) => {
                if (el) {
                  const localTime = (playheadUnits - activeVidClip.start) + (activeVidClip.sourceOffset||0);
                  const expectedSeconds = localTime / 15;
                  const threshold = isPlaying ? 0.5 : 0.05;
                  if (Math.abs(el.currentTime - expectedSeconds) > threshold) el.currentTime = expectedSeconds;
                  if (isPlaying && el.paused) { let p = el.play(); if (p) p.catch(()=>{}); }
                  if (!isPlaying && !el.paused) el.pause();
                }
              }}
            />
          );
        })()}
        {activeAudClips.map(ac => {
          const isMuted = tracks.find(t=>t.id===ac.trackId)?.muted || false;
          return (
            <video key={ac.id} src={ac.url} style={{display:'none'}} muted={isMuted || !isPlaying}
              ref={el => {
                if (el) {
                  const localTime = (playheadUnits - ac.start) + (ac.sourceOffset||0);
                  const expectedSeconds = localTime / 15;
                  const threshold = isPlaying ? 0.4 : 0.1;
                  if (Math.abs(el.currentTime - expectedSeconds) > threshold) el.currentTime = expectedSeconds;
                  if (isPlaying && el.paused) el.play().catch(()=>{});
                  if (!isPlaying && !el.paused) el.pause();
                }
              }}
            />
          );
        })}
        {!activeVidClip && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.07)',fontFamily:'Syne,sans-serif',letterSpacing:'3px'}}>STRIKE THE HEAVENS</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'5px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
        <span style={{fontSize:'10px',color:'var(--accent)',fontFamily:'Syne,sans-serif',fontWeight:600}}>Program: Strike_the_Heavens</span>
        <div style={{display:'flex',gap:'3px'}}>
          <button title="Safe Margins" style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>⊞</button>
          <button title="Full Screen" style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>⛶</button>
        </div>
      </div>
      <div style={{flex:1,background:'#020204',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',minWidth:0,minHeight:0}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0a0020,#000510,#050005)'}}/>
        {renderContent()}
        <div style={{position:'absolute',inset:'8%',border:'1px solid rgba(255,255,255,0.04)',pointerEvents:'none'}}/>
        {workspace === 'color' && (
          <div style={{position:'absolute',bottom:'6px',right:'6px',width:'80px',height:'50px',background:'rgba(0,0,0,0.7)',border:'1px solid var(--border)',borderRadius:'4px',overflow:'hidden',display:'flex',alignItems:'flex-end',gap:'1px',padding:'2px'}}>
            {Array.from({length:20},(_,k)=>(
              <div key={k} style={{flex:1,height:`${CLIP_WAVE[k]*0.6+10}%`,background:`hsl(${k*18},80%,55%)`,opacity:0.7,borderRadius:'1px'}}/>
            ))}
          </div>
        )}
      </div>
      <div style={{padding:'4px 8px',display:'flex',gap:'4px',alignItems:'center',borderTop:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
        <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700,minWidth:'80px'}}>{timecode}</span>
        <div style={{flex:1,display:'flex',justifyContent:'center',gap:'3px',alignItems:'center'}}>
          {(['⏮','⏪'] as const).map(ic=><button key={ic} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px'}}>{ic}</button>)}
          <button onClick={()=>setIsPlaying(!isPlaying)} style={{background:'var(--accent)',border:'none',color:'white',width:'24px',height:'24px',borderRadius:'50%',cursor:'pointer',fontSize:'10px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 8px var(--accent-glow)'}}>{isPlaying?'⏸':'▶'}</button>
          {(['⏩','⏭'] as const).map(ic=><button key={ic} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px'}}>{ic}</button>)}
        </div>
        <div style={{display:'flex',gap:'3px'}}>
          <select style={{background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'9px',borderRadius:'3px',padding:'1px 3px',outline:'none',cursor:'pointer'}}>
            {['Full','1/2','1/4'].map(v=><option key={v}>{v}</option>)}
          </select>
          <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--text-secondary)',minWidth:'64px',textAlign:'right'}}>00;02;01;22</span>
        </div>
      </div>
    </div>
  );
}
