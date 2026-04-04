'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore, selectClips, selectTransitions } from '@/store/editorStore';
import { Clip, Track, Transition, CLIP_WAVE } from '@/types/editor';

// ── Mini waveform ──
function ClipWave({ color, n = 30 }: { color: string; n?: number }) {
  const bars = Math.min(n, 60);
  return (
    <div style={{display:'flex',alignItems:'center',gap:'1px',height:'100%',overflow:'hidden',padding:'3px 0'}}>
      {Array.from({length:bars},(_,i)=>(
        <div key={i} style={{width:'2px',flexShrink:0,height:`${CLIP_WAVE[i%CLIP_WAVE.length]}%`,background:color,opacity:0.6,borderRadius:'1px'}}/>
      ))}
    </div>
  );
}

interface Props {
  dragNewItemRef: React.MutableRefObject<{type:'video'|'audio'; label:string; color:string; duration?:number; url?:string; sourceOffset?:number; sourceWidth?:number} | null>;
}

export default function Timeline({ dragNewItemRef }: Props) {
  const clips          = useEditorStore(selectClips);
  const transitions    = useEditorStore(selectTransitions);
  const tracks         = useEditorStore(s => s.tracks);
  const playheadPos    = useEditorStore(s => s.playheadPos);
  const zoom           = useEditorStore(s => s.zoom);
  const activeTool     = useEditorStore(s => s.activeTool);
  const snappingEnabled= useEditorStore(s => s.snappingEnabled);
  const selectedClipIds= useEditorStore(s => s.selectedClipIds);
  const selectedKeyframe = useEditorStore(s => s.selectedKeyframe);
  const markers        = useEditorStore(s => s.markers);
  const isPlaying      = useEditorStore(s => s.isPlaying);
  const past           = useEditorStore(s => s.past);
  const future         = useEditorStore(s => s.future);

  const setTracks         = useEditorStore(s => s.setTracks);
  const setClips          = useEditorStore(s => s.setClips);
  const setTransitions    = useEditorStore(s => s.setTransitions);
  const setPlayheadPos    = useEditorStore(s => s.setPlayheadPos);
  const setZoom           = useEditorStore(s => s.setZoom);
  const setActiveTool     = useEditorStore(s => s.setActiveTool);
  const setSnappingEnabled= useEditorStore(s => s.setSnappingEnabled);
  const setSelectedClipIds= useEditorStore(s => s.setSelectedClipIds);
  const setSelectedKeyframe = useEditorStore(s => s.setSelectedKeyframe);
  const setIsPlaying      = useEditorStore(s => s.setIsPlaying);
  const applyAction       = useEditorStore(s => s.applyAction);
  const undo              = useEditorStore(s => s.undo);
  const redo              = useEditorStore(s => s.redo);
  const notify            = useEditorStore(s => s.notify);

  // Local drag/UI state
  const [dragState, setDragState] = useState<{clipId:number; startX:number; clipOffsets:Record<number,{start:number; trackId:number}>}|null>(null);
  const [dragNewState, setDragNewState] = useState<{type:'video'|'audio'; label:string; color:string; duration?:number; url?:string}|null>(null);
  const [dragNewPos, setDragNewPos]     = useState<{trackId:number; start:number}|null>(null);
  const [dragOverTrackId, setDragOverTrackId] = useState<number|null>(null);
  const [edgeDragState, setEdgeDragState] = useState<{clipId:number; edge:'left'|'right'; startX:number; initialStart:number; initialWidth:number; sourceWidth:number}|null>(null);
  const [trimTooltip, setTrimTooltip]   = useState<{x:number; y:number; text:string}|null>(null);
  const [gapContextMenu, setGapContextMenu] = useState<{x:number; y:number; gap:{trackId:number; start:number; width:number}}|null>(null);
  const [razorLinePos, setRazorLinePos] = useState<number|null>(null);
  const [snapLineUnits, setSnapLineUnits] = useState<number|null>(null);
  const [marqueeSelection, setMarqueeSelection] = useState<{startX:number; startY:number; currentX:number; currentY:number; isActive:boolean}|null>(null);

  const tlRef           = useRef<HTMLDivElement>(null);
  const tracksAreaRef   = useRef<HTMLDivElement>(null);
  const dragMovedRef    = useRef(false);
  const historyRef      = useRef<Clip[][]>([]);
  const mouseMoveRafRef = useRef<number|undefined>(undefined);
  const stateRef        = useRef({ clips, selectedClipIds, selectedKeyframe });
  useEffect(() => { stateRef.current = { clips, selectedClipIds, selectedKeyframe }; }, [clips, selectedClipIds, selectedKeyframe]);

  // Timecode
  const playheadUnits = playheadPos / (zoom * 0.14);
  const totalFrames = Math.round(playheadUnits / 15 * 30);
  const ss = Math.floor(totalFrames / 30);
  const ff = totalFrames % 30;
  const mm = Math.floor(ss / 60);
  const hh = Math.floor(mm / 60);
  const timecode = `${String(hh).padStart(2,'0')};${String(mm%60).padStart(2,'0')};${String(ss%60).padStart(2,'0')};${String(ff).padStart(2,'0')}`;

  // Cleanup drag on mouseup
  useEffect(() => {
    const onUp = () => {
      dragNewItemRef.current = null;
      setDragState(null); setDragNewState(null); setDragNewPos(null); setDragOverTrackId(null);
      setEdgeDragState(null); setTrimTooltip(null); setSnapLineUnits(null); setMarqueeSelection(null);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const handleTLClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tlRef.current) return;
    const r = tlRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    setPlayheadPos(pct);
    if (activeTool === 'select') { setSelectedClipIds([]); setSelectedKeyframe(null); }
  };

  const handleTracksMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select' || e.button !== 0) return;
    setSelectedKeyframe(null);
    const r = tracksAreaRef.current?.getBoundingClientRect();
    if (r) setMarqueeSelection({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, isActive: false });
  };

  const handleRazorSplit = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();
    if (!tlRef.current) return;
    const r = tlRef.current.getBoundingClientRect();
    const pct = ((e.clientX - r.left) / r.width) * 100;
    const splitUnit = Math.round(pct / (zoom * 0.14));
    const clipsToSplit = clip.groupId
      ? clips.filter(c => c.groupId === clip.groupId && splitUnit > c.start && splitUnit < c.start + c.width)
      : [clip];
    if (clipsToSplit.length === 0) return;
    let nextClips = [...clips];
    const newIds: number[] = [];
    const leftGid = Date.now(), rightGid = leftGid + 2;
    clipsToSplit.forEach((c, idx) => {
      const id1 = leftGid + idx, id2 = rightGid + idx;
      const splitRelative = splitUnit - c.start;
      const left: Clip  = { ...c, id: id1, width: splitRelative, groupId: c.groupId ? leftGid  : undefined };
      const right: Clip = { ...c, id: id2, start: splitUnit, width: (c.start + c.width) - splitUnit, sourceOffset: (c.sourceOffset||0) + splitRelative, groupId: c.groupId ? rightGid : undefined };
      nextClips = nextClips.filter(x => x.id !== c.id).concat([left, right]);
      newIds.push(id1);
    });
    applyAction(`Split ${clipsToSplit.length} clip(s)`, nextClips);
    setActiveTool('select');
    setSelectedClipIds(newIds);
    notify(`✂ ${clipsToSplit.length} Clip(s) split`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const item = dragNewItemRef.current;
    if (!item || !tracksAreaRef.current || !tlRef.current) return;
    const r = tlRef.current.getBoundingClientRect();
    const pct = ((e.clientX - r.left) / r.width) * 100;
    const newStart = Math.max(0, Math.round(pct / (zoom * 0.14)));
    const areaRect = tracksAreaRef.current.getBoundingClientRect();
    let relY = e.clientY - areaRect.top;
    let targetTrack: Track|null = null;
    for (const t of tracks) { if (relY < t.height) { targetTrack = t; break; } relY -= t.height; }
    if (targetTrack && targetTrack.type !== 'caption') {
      setDragNewPos({ trackId: targetTrack.id, start: newStart });
      setDragOverTrackId(targetTrack.id);
      setDragNewState(item);
    } else { setDragNewPos(null); setDragOverTrackId(null); }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverTrackId(null);

    // Transition drop
    const trData = e.dataTransfer.getData('application/transition');
    if (trData) {
      try {
        const tr = JSON.parse(trData);
        const r = tlRef.current!.getBoundingClientRect();
        const finalStart = Math.max(0, Math.round(((e.clientX - r.left) / r.width) * 100 / (zoom * 0.14)));
        const areaRect = tracksAreaRef.current!.getBoundingClientRect();
        let relY = e.clientY - areaRect.top;
        let targetTrack: Track|null = null;
        for (const t of tracks) { if (relY < t.height) { targetTrack = t; break; } relY -= t.height; }
        if (targetTrack && targetTrack.type === 'video') {
          const trackClips = stateRef.current.clips.filter(c => c.trackId === targetTrack!.id).sort((a,b) => a.start - b.start);
          let finalStartTime = finalStart - 7.5;
          const nearEdge = trackClips.find(c => Math.abs(c.start - finalStart) < 10 || Math.abs((c.start + c.width) - finalStart) < 10);
          if (nearEdge) {
            finalStartTime = Math.abs(nearEdge.start - finalStart) < 10 ? nearEdge.start - 7.5 : (nearEdge.start + nearEdge.width) - 7.5;
          }
          const newTr: Transition = { id: Date.now(), trackId: targetTrack.id, startTime: finalStartTime, duration: 15, type: tr.name };
          applyAction(`Add ${tr.name}`, clips, [...transitions, newTr]);
          notify(`${tr.name} added at edit point`);
          return;
        }
      } catch(err){}
    }

    let state = dragNewItemRef.current;
    if (!state) { try { state = JSON.parse(e.dataTransfer.getData('application/json')); } catch(err){} }
    dragNewItemRef.current = null;
    if (!state || !tracksAreaRef.current || !tlRef.current) { setDragNewState(null); setDragNewPos(null); return; }

    const r = tlRef.current.getBoundingClientRect();
    const pct = ((e.clientX - r.left) / r.width) * 100;
    const areaRect = tracksAreaRef.current.getBoundingClientRect();
    let relY = e.clientY - areaRect.top;
    let targetTrack: Track|null = null;
    for (const t of tracks) { if (relY < t.height) { targetTrack = t; break; } relY -= t.height; }
    if (!targetTrack || targetTrack.type === 'caption') { setDragNewState(null); setDragNewPos(null); return; }

    const finalStart = Math.max(0, Math.round(pct / (zoom * 0.14)));
    const durationUnits = (state.duration || 10) * 15;

    if (state.type === 'video' && targetTrack.type === 'video') {
      const gid = Date.now();
      const videoClip: Clip = { id: gid, trackId: 3, start: finalStart, width: durationUnits, label: state.label, color: state.color, type: 'video', url: state.url, sourceOffset: (state.sourceOffset||0)*15, sourceWidth: (state.sourceWidth||state.duration||10)*15, groupId: gid };
      const audioClip: Clip = { ...videoClip, id: gid+1, trackId: 4, type: 'audio', color: '#00E5FF' };
      applyAction(`Add "${state.label}" (V+A)`, [...clips, videoClip, audioClip]);
      setDragNewState(null); setDragNewPos(null);
      return;
    }

    let finalTrackId = targetTrack.id;
    if (targetTrack.type !== state.type) {
      const fallback = tracks.find(t => t.type === state?.type);
      if (!fallback) { setDragNewState(null); setDragNewPos(null); return; }
      finalTrackId = fallback.id;
    }
    const overlaps = clips.filter(c => c.trackId === finalTrackId && ((finalStart >= c.start && finalStart < c.start + c.width) || (c.start >= finalStart && c.start < finalStart + durationUnits) || (finalStart <= c.start && finalStart + durationUnits >= c.start + c.width)));
    let newClips = [...clips];
    if (overlaps.length > 0) newClips = newClips.map(c => (c.trackId === finalTrackId && c.start + c.width/2 >= finalStart) ? { ...c, start: c.start + durationUnits } : c);
    const newClip: Clip = { id: Date.now(), trackId: finalTrackId, start: finalStart, width: durationUnits, label: state.label, color: state.color, type: state.type as 'video'|'audio', url: state.url, sourceOffset: (state.sourceOffset||0)*15, sourceWidth: (state.sourceWidth||state.duration||10)*15 };
    applyAction(`Add clip "${newClip.label}"`, [...newClips, newClip]);
    setDragNewState(null); setDragNewPos(null);
    setSelectedClipIds([newClip.id]);
    notify(`Drop: "${newClip.label}" added & snapped`);
  };

  const handleTracksMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseMoveRafRef.current !== undefined) return;
    mouseMoveRafRef.current = requestAnimationFrame(() => { mouseMoveRafRef.current = undefined; });

    // Marquee
    if (marqueeSelection) {
      const r = tracksAreaRef.current?.getBoundingClientRect();
      if (r) {
        const currentX = e.clientX, currentY = e.clientY;
        const isActive = Math.abs(currentX - marqueeSelection.startX) > 5 || Math.abs(currentY - marqueeSelection.startY) > 5;
        setMarqueeSelection(prev => prev ? { ...prev, currentX, currentY, isActive: isActive || prev.isActive } : null);
        if (isActive || marqueeSelection.isActive) {
          const mLeft = Math.min(marqueeSelection.startX, currentX), mRight = Math.max(marqueeSelection.startX, currentX);
          const mTop = Math.min(marqueeSelection.startY, currentY), mBottom = Math.max(marqueeSelection.startY, currentY);
          const tlRect = tlRef.current?.getBoundingClientRect();
          if (tlRect) {
            const newSels: number[] = [];
            let currentTrackY = r.top;
            tracks.forEach(track => {
              const trackTop = currentTrackY, trackBottom = currentTrackY + track.height;
              stateRef.current.clips.filter(c => c.trackId === track.id).forEach(clip => {
                const clipLeft  = tlRect.left + (clip.start  * zoom * 0.14 / 100 * tlRect.width);
                const clipRight = clipLeft + (clip.width * zoom * 0.14 / 100 * tlRect.width);
                if (clipLeft < mRight && clipRight > mLeft && trackTop < mBottom && trackBottom > mTop) newSels.push(clip.id);
              });
              currentTrackY += track.height;
            });
            setSelectedClipIds(newSels);
          }
        }
      }
      return;
    }

    // Edge trim
    if (edgeDragState && tlRef.current) {
      const dx = e.clientX - edgeDragState.startX;
      const r = tlRef.current.getBoundingClientRect();
      const deltaUnits = Math.round((dx / r.width) * 100 / (zoom * 0.14));
      let newStart = edgeDragState.initialStart, newWidth = edgeDragState.initialWidth;
      const minWidth = 15;
      let shiftAmount = 0;
      if (edgeDragState.edge === 'left') {
        const clampedDelta = Math.min(edgeDragState.initialWidth - minWidth, Math.max(-edgeDragState.initialStart, deltaUnits));
        newWidth = edgeDragState.initialWidth - clampedDelta;
        if (activeTool === 'ripple') { newStart = edgeDragState.initialStart; shiftAmount = -clampedDelta; }
        else { newStart = edgeDragState.initialStart + clampedDelta; }
      } else {
        newWidth = Math.max(minWidth, edgeDragState.initialWidth + deltaUnits);
        if (edgeDragState.sourceWidth && newWidth > edgeDragState.sourceWidth) newWidth = edgeDragState.sourceWidth;
        if (activeTool === 'ripple') shiftAmount = newWidth - edgeDragState.initialWidth;
      }
      setClips(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c.id === edgeDragState.clipId);
        if (idx === -1) return prev;
        const old = updated[idx];
        updated[idx] = { ...old, start: newStart, width: newWidth };
        if (activeTool === 'ripple' && shiftAmount !== 0) {
          updated.forEach((c, i) => {
            if (i !== idx && c.trackId === old.trackId && c.start >= edgeDragState.initialStart + edgeDragState.initialWidth - 1) {
              updated[i] = { ...c, start: Math.max(0, c.start + shiftAmount) };
            }
          });
        }
        return updated;
      });
      setTrimTooltip({ x: e.clientX, y: e.clientY - 40, text: `Dur: ${(newWidth/15).toFixed(1)}s${activeTool==='ripple'&&shiftAmount!==0?` (${shiftAmount>0?'+':''}${(shiftAmount/15).toFixed(1)}s ripple)`:''}` });
      return;
    }

    // Move clips
    if (dragState && tlRef.current && tracksAreaRef.current) {
      const dx = e.clientX - dragState.startX;
      const r = tlRef.current.getBoundingClientRect();
      const deltaUnits = Math.abs(dx) > 2 ? Math.round((dx / r.width) * 100 / (zoom * 0.14)) : 0;
      const draggedClip = clips.find(c => c.id === dragState.clipId);
      if (!draggedClip) return;
      const areaRect = tracksAreaRef.current.getBoundingClientRect();
      let relY = e.clientY - areaRect.top;
      let targetTrack: Track|null = null;
      for (const t of tracks) { if (relY < t.height) { targetTrack = t; break; } relY -= t.height; }
      let trackDelta = 0;
      if (targetTrack && targetTrack.type === draggedClip.type) trackDelta = targetTrack.id - draggedClip.trackId;
      setClips(prev => prev.map(c => {
        if (dragState.clipOffsets[c.id]) {
          const initial = dragState.clipOffsets[c.id];
          let newStart = Math.max(0, initial.start + deltaUnits);
          let newTrackId = initial.trackId + trackDelta;
          const tt = tracks.find(t => t.id === newTrackId);
          if (!tt || tt.type !== c.type) newTrackId = initial.trackId;
          return { ...c, start: newStart, trackId: newTrackId };
        }
        return c;
      }));
      setDragOverTrackId(targetTrack?.id || null);
      dragMovedRef.current = true;
      return;
    }

    // Razor line
    if (activeTool !== 'razor' || !tlRef.current) { if (razorLinePos !== null) setRazorLinePos(null); return; }
    const r = tlRef.current.getBoundingClientRect();
    setRazorLinePos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Toolbar */}
      <div style={{padding:'4px 10px',display:'flex',alignItems:'center',gap:'8px',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
        <div style={{display:'flex',gap:'1px',background:'var(--bg-secondary)',borderRadius:'5px',padding:'2px',border:'1px solid var(--border)'}}>
          {['Strike_the_Heavens','Sequence 02'].map((s,i)=>(
            <button key={s} style={{padding:'2px 8px',borderRadius:'3px',border:'none',background:i===0?'var(--accent)':'transparent',color:i===0?'white':'var(--text-muted)',fontSize:'9px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap'}}>{s}</button>
          ))}
          <button style={{padding:'2px 5px',borderRadius:'3px',border:'none',background:'transparent',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>+</button>
        </div>
        <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700}}>{timecode}</span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',gap:'2px'}}>
          {[{ic:'🔧',tip:'Timeline Settings'},{ic:'✂',tip:'Ripple Delete'},{ic:'⟺',tip:'Match Frame'},{ic:'🔍',tip:'Zoom to Sequence'},{ic:'🧲',tip:'Snapping (S)'},{ic:'🔗',tip:'Linked Selection'}].map(b=>(
            <button key={b.ic} title={b.tip} onClick={()=>{ if(b.ic==='🧲'){setSnappingEnabled(!snappingEnabled);notify(!snappingEnabled?'🧲 Snapping On':'🧲 Snapping Off');} }}
              style={{background:b.ic==='🧲'&&snappingEnabled?'var(--accent)':'none',border:'none',color:b.ic==='🧲'&&snappingEnabled?'white':'var(--text-secondary)',cursor:'pointer',fontSize:'12px',padding:'2px 4px',borderRadius:'3px',transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background=(b.ic==='🧲'&&snappingEnabled)?'var(--accent)':'var(--bg-hover)'}
              onMouseLeave={e=>e.currentTarget.style.background=(b.ic==='🧲'&&snappingEnabled)?'var(--accent)':'none'}
            >{b.ic}</button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
          <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>—</button>
          <input type="range" min={50} max={400} value={zoom*100} onChange={e=>setZoom(Number(e.target.value)/100)} style={{width:'70px',accentColor:'var(--accent)',height:'3px'}}/>
          <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'10px'}}>+</button>
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* Track headers */}
        <div style={{width:'130px',flexShrink:0,background:'var(--bg-secondary)',borderRight:'1px solid var(--border)',overflowY:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{height:'30px',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 6px',gap:'4px'}}>
            <button title="Add Video Track" style={{fontSize:'9px',background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-secondary)',borderRadius:'3px',padding:'1px 4px',cursor:'pointer'}}>+V</button>
            <button title="Add Audio Track" style={{fontSize:'9px',background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-secondary)',borderRadius:'3px',padding:'1px 4px',cursor:'pointer'}}>+A</button>
          </div>
          {tracks.map(track=>(
            <div key={track.id} style={{height:`${track.height}px`,display:'flex',alignItems:'center',padding:'0 6px',gap:'4px',borderBottom:'1px solid var(--border)',background:track.type==='video'?'rgba(124,92,255,0.04)':track.type==='caption'?'rgba(255,214,10,0.04)':'rgba(0,229,255,0.04)',flexShrink:0,position:'relative'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:'2px',background:track.color}}/>
              <button onClick={()=>setTracks(p=>p.map(t=>t.id===track.id?{...t,locked:!t.locked}:t))} style={{background:'none',border:'none',cursor:'pointer',fontSize:'9px',opacity:track.locked?0.9:0.2,color:'var(--text-secondary)',flexShrink:0,padding:0}}>🔒</button>
              <span style={{fontSize:'10px',fontFamily:'monospace',color:track.color,fontWeight:700,width:'20px',flexShrink:0}}>{track.label}</span>
              {track.type !== 'caption' && (
                <>
                  <button onClick={()=>setTracks(p=>p.map(t=>t.id===track.id?{...t,muted:!t.muted}:t))} style={{width:'16px',height:'14px',borderRadius:'2px',border:'none',cursor:'pointer',fontSize:'7px',background:track.muted?'#FF3B82':'var(--bg-card)',color:track.muted?'white':'var(--text-secondary)',fontWeight:700,flexShrink:0}}>M</button>
                  <button onClick={()=>setTracks(p=>p.map(t=>t.id===track.id?{...t,solo:!t.solo}:t))} style={{width:'16px',height:'14px',borderRadius:'2px',border:'none',cursor:'pointer',fontSize:'7px',background:track.solo?'#FFD60A':'var(--bg-card)',color:track.solo?'#000':'var(--text-secondary)',fontWeight:700,flexShrink:0}}>S</button>
                </>
              )}
              <button style={{background:'none',border:'none',cursor:'pointer',fontSize:'9px',opacity:0.3,color:'var(--text-secondary)',flexShrink:0,padding:0}}>👁</button>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div style={{flex:1,overflowX:'auto',overflowY:'hidden',position:'relative'}}>
          {/* Ruler */}
          <div ref={tlRef} onClick={handleTLClick} style={{height:'30px',background:'var(--bg-tertiary)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:5,cursor:'crosshair',flexShrink:0,overflow:'hidden'}}>
            <div style={{minWidth:'700px',width:'100%',height:'100%',position:'relative',backgroundImage:`repeating-linear-gradient(to right,transparent,transparent calc(${zoom}% - 1px),rgba(255,255,255,0.06) calc(${zoom}% - 1px),rgba(255,255,255,0.06) ${zoom}%)`,backgroundSize:'100% 4px',backgroundPositionY:'4px',backgroundRepeat:'repeat-x'}}>
              {Array.from({length:25},(_,i)=>(
                <div key={i} style={{position:'absolute',left:`${i*4*zoom}%`,display:'flex',flexDirection:'column',alignItems:'flex-start',top:'6px'}}>
                  <div style={{width:'1px',height:'8px',background:'var(--border-bright)'}}/>
                  <span style={{fontSize:'8px',color:'var(--text-secondary)',fontFamily:'monospace',whiteSpace:'nowrap',marginTop:'1px'}}>
                    {String(Math.floor(i*4/60)).padStart(2,'0')}:{String((i*4)%60).padStart(2,'0')}
                  </span>
                </div>
              ))}
              {markers.map(m=>(
                <div key={m.id} title={m.label} style={{position:'absolute',left:`${m.time/120*100}%`,top:0,zIndex:8,cursor:'pointer'}}>
                  <div style={{width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:`8px solid ${m.color}`,transform:'translateX(-50%)'}}/>
                  <div style={{position:'absolute',top:'8px',left:'50%',transform:'translateX(-50%)',background:m.color,color:'#000',fontSize:'7px',padding:'1px 3px',borderRadius:'2px',whiteSpace:'nowrap',fontFamily:'Syne,sans-serif',fontWeight:700}}>{m.label}</div>
                </div>
              ))}
              <div style={{position:'absolute',left:`${playheadPos}%`,top:0,bottom:0,width:'1px',background:'var(--yellow)',zIndex:10,boxShadow:'0 0 8px rgba(255,214,10,0.5)'}}>
                <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'8px solid var(--yellow)'}}/>
              </div>
            </div>
          </div>

          {/* Tracks */}
          <div ref={tracksAreaRef} onMouseDown={handleTracksMouseDown} onClick={handleTLClick} onMouseMove={handleTracksMouseMove} onMouseLeave={()=>setRazorLinePos(null)} onDragOver={handleDragOver} onDrop={handleDrop} style={{position:'relative',cursor:activeTool==='razor'?'none':'default'}}>
            {tracks.map(track=>(
              <div key={track.id} style={{
                height:`${track.height}px`, borderBottom:'1px solid var(--border)',
                backgroundImage:[
                  dragOverTrackId===track.id&&(dragState||dragNewState)
                    ? track.type==='video'?'linear-gradient(rgba(124,92,255,0.09),rgba(124,92,255,0.09))':track.type==='audio'?'linear-gradient(rgba(0,229,255,0.09),rgba(0,229,255,0.09))':'linear-gradient(rgba(255,214,10,0.04),rgba(255,214,10,0.04))'
                    : track.type==='video'?'linear-gradient(rgba(124,92,255,0.015),rgba(124,92,255,0.015))':track.type==='caption'?'linear-gradient(rgba(255,214,10,0.015),rgba(255,214,10,0.015))':'linear-gradient(rgba(0,229,255,0.015),rgba(0,229,255,0.015))',
                  `repeating-linear-gradient(to right,transparent,transparent calc(${4*zoom}% - 1px),rgba(255,255,255,0.04) calc(${4*zoom}% - 1px),rgba(255,255,255,0.04) ${4*zoom}%)`,
                  `repeating-linear-gradient(to right,transparent,transparent calc(${zoom}% - 1px),rgba(255,255,255,0.015) calc(${zoom}% - 1px),rgba(255,255,255,0.015) ${zoom}%)`,
                ].join(','),
                outline: dragOverTrackId===track.id&&(dragState||dragNewState)?`2px solid ${track.type==='video'?'rgba(124,92,255,0.45)':'rgba(0,229,255,0.45)'}`:undefined,
                position:'relative', cursor:activeTool==='razor'?'crosshair':dragState?'grabbing':'pointer', flexShrink:0, contain:'layout style',
              }}>
                {/* Gap zones */}
                {(() => {
                  const tc = clips.filter(c=>c.trackId===track.id).sort((a,b)=>a.start-b.start);
                  const gaps: {start:number; width:number; trackId:number}[] = [];
                  let cur = 0;
                  for (const c of tc) { if (c.start > cur) gaps.push({start:cur,width:c.start-cur,trackId:track.id}); cur=c.start+c.width; }
                  return gaps.map((gap,i)=>(
                    <div key={`gap-${i}`}
                      onContextMenu={e=>{e.preventDefault();e.stopPropagation();setGapContextMenu({x:e.clientX,y:e.clientY,gap});}}
                      onClick={e=>{e.stopPropagation();setSelectedClipIds([]);}}
                      style={{position:'absolute',left:`${gap.start*zoom*0.14}%`,width:`${gap.width*zoom*0.14}%`,top:track.type==='caption'?'2px':'4px',bottom:track.type==='caption'?'2px':'4px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.06)',borderRadius:track.type==='caption'?'3px':'5px',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',cursor:'context-menu',zIndex:5,transition:'background 0.2s'}}
                      onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                      onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    >{gap.width>25&&<span style={{fontSize:'8.5px',fontFamily:'monospace',color:'rgba(255,255,255,0.25)',fontWeight:700,pointerEvents:'none'}}>{(gap.width/15).toFixed(1)}s Gap</span>}</div>
                  ));
                })()}

                {track.type==='caption'&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',padding:'0 8px',gap:'8px',pointerEvents:'none'}}><span style={{fontSize:'8px',color:'rgba(255,214,10,0.3)',fontFamily:'Syne,sans-serif',fontWeight:700,letterSpacing:'1px'}}>CAPTIONS TRACK</span></div>}

                {/* Ghost */}
                {dragNewPos&&dragOverTrackId===track.id&&dragNewState&&(
                  <div style={{position:'absolute',left:`${dragNewPos.start*zoom*0.14}%`,width:`${(dragNewState.duration||100)*zoom*0.14}%`,top:track.type==='caption'?'2px':'4px',bottom:track.type==='caption'?'2px':'4px',background:`${dragNewState.color}40`,border:`1px dashed ${dragNewState.color}`,borderRadius:track.type==='caption'?'3px':'5px',zIndex:20,pointerEvents:'none',display:'flex',alignItems:'center',padding:'0 4px',overflow:'hidden'}}>
                    <span style={{fontSize:'8px',color:dragNewState.color,fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{dragNewState.label}</span>
                  </div>
                )}

                {/* Transitions */}
                {transitions.filter(t=>t.trackId===track.id).map(tr=>(
                  <div key={tr.id} style={{position:'absolute',left:`${tr.startTime*zoom*0.14}%`,width:`${tr.duration*zoom*0.14}%`,top:'15%',bottom:'15%',background:tr.type==='Dip to Black'?'linear-gradient(to right,#333,#000,#333)':tr.type==='Dip to White'?'linear-gradient(to right,#ccc,#fff,#ccc)':'repeating-linear-gradient(45deg,rgba(124,92,255,0.3),rgba(124,92,255,0.3) 5px,rgba(124,92,255,0.5) 5px,rgba(124,92,255,0.5) 10px)',border:`1px solid ${tr.type==='Dip to White'?'#999':'var(--accent)'}`,borderRadius:'4px',zIndex:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}
                    onContextMenu={e=>{e.preventDefault();e.stopPropagation();const isR=!tr.reversed;setTransitions(prev=>prev.map(t=>t.id===tr.id?{...t,reversed:isR}:t));notify(`${tr.type} ${isR?'Reversed':'Standard'}`);}}
                  >
                    <span style={{fontSize:'7px',color:tr.type==='Dip to White'?'#333':'white',fontWeight:800,textTransform:'uppercase',pointerEvents:'none'}}>{tr.type}{tr.reversed?' (R)':''}</span>
                    <div onMouseDown={e=>{e.stopPropagation();const sx=e.clientX,sd=tr.duration,sp=tr.startTime;const mv=(ev:MouseEvent)=>{const dx=ev.clientX-sx;const delta=Math.round((dx/tlRef.current!.getBoundingClientRect().width)*100/(zoom*0.14));setTransitions(p=>p.map(t=>t.id===tr.id?{...t,startTime:sp+delta,duration:Math.max(5,sd-delta)}:t));};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);}} style={{position:'absolute',left:0,top:0,bottom:0,width:'5px',cursor:'ew-resize'}}/>
                    <div onMouseDown={e=>{e.stopPropagation();const sx=e.clientX,sd=tr.duration;const mv=(ev:MouseEvent)=>{const dx=ev.clientX-sx;const delta=Math.round((dx/tlRef.current!.getBoundingClientRect().width)*100/(zoom*0.14));setTransitions(p=>p.map(t=>t.id===tr.id?{...t,duration:Math.max(5,sd+delta)}:t));};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);}} style={{position:'absolute',right:0,top:0,bottom:0,width:'5px',cursor:'ew-resize'}}/>
                  </div>
                ))}

                {/* Clips */}
                {clips.filter(c=>c.trackId===track.id).map(clip=>{
                  const isSelected = selectedClipIds.includes(clip.id);
                  return (
                    <div key={clip.id}
                      onMouseDown={e=>{
                        if((activeTool==='select'||activeTool==='track_fwd')&&e.button===0){
                          e.stopPropagation(); dragMovedRef.current=false;
                          let newSels: number[] = [];
                          if(activeTool==='track_fwd'){
                            newSels=clips.filter(c=>(e.shiftKey||c.trackId===clip.trackId)&&c.start>=clip.start).map(c=>c.id);
                          } else {
                            newSels=[...selectedClipIds];
                            const isMod=e.shiftKey||e.ctrlKey||e.metaKey;
                            if(isMod){
                              if(isSelected){
                                const linkedIds=clip.groupId?clips.filter(c=>c.groupId===clip.groupId).map(c=>c.id):[clip.id];
                                newSels=newSels.filter(id=>!linkedIds.includes(id));
                              } else {
                                const linkedIds=clip.groupId?clips.filter(c=>c.groupId===clip.groupId).map(c=>c.id):[clip.id];
                                newSels=[...new Set([...newSels,...linkedIds])];
                              }
                            } else {
                              if(!isSelected) newSels=clip.groupId?clips.filter(c=>c.groupId===clip.groupId).map(c=>c.id):[clip.id];
                            }
                          }
                          setSelectedClipIds(newSels);
                          historyRef.current=[...historyRef.current.slice(-30),[...clips]];
                          const offsets: Record<number,{start:number;trackId:number}> = {};
                          newSels.forEach(id=>{const c=clips.find(x=>x.id===id);if(c)offsets[id]={start:c.start,trackId:c.trackId};});
                          setDragState({clipId:clip.id,startX:e.clientX,clipOffsets:offsets});
                        }
                      }}
                      onClick={e=>{
                        if(dragMovedRef.current){dragMovedRef.current=false;return;}
                        if(activeTool==='razor'){handleRazorSplit(e,clip);}
                        else{e.stopPropagation();}
                      }}
                      onContextMenu={e=>{
                        e.preventDefault();e.stopPropagation();
                        if(clip.groupId){
                          const linkedIds=clips.filter(c=>c.groupId===clip.groupId).map(c=>c.id);
                          setSelectedClipIds(linkedIds);
                          if(window.confirm('Unlink video and audio?')){
                            applyAction('Unlink clips',clips.map(c=>c.groupId===clip.groupId?{...c,groupId:undefined}:c));
                            notify('Clips unlinked');
                          }
                        } else { notify(`Clip: ${clip.label}`); }
                      }}
                      style={{position:'absolute',left:`${clip.start*zoom*0.14}%`,width:`${clip.width*zoom*0.14}%`,top:track.type==='caption'?'2px':'4px',bottom:track.type==='caption'?'2px':'4px',background:`${clip.color}${isSelected?'40':'20'}`,border:`1px solid ${clip.color}${isSelected?'ee':'50'}`,borderRadius:track.type==='caption'?'3px':'5px',overflow:'hidden',cursor:dragState?.clipId===clip.id?'grabbing':activeTool==='select'?'grab':activeTool==='razor'?'crosshair':'pointer',boxShadow:isSelected?`0 0 0 1.5px ${clip.color},inset 0 0 0 1px ${clip.color}40`:'none',display:'flex',flexDirection:'column',willChange:dragState?'transform':'auto',contain:'layout style'}}
                    >
                      <div style={{display:'flex',alignItems:'center',gap:'3px',padding:'2px 4px',flexShrink:0,background:`${clip.color}10`}}>
                        <span style={{fontSize:'8px',color:clip.color,fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}>{clip.label}</span>
                        {clip.speed&&clip.speed!==100&&<span style={{fontSize:'7px',background:'#FFD60A22',border:'1px solid #FFD60A44',color:'#FFD60A',borderRadius:'2px',padding:'0 3px',flexShrink:0}}>{clip.speed}%</span>}
                        {clip.proxy&&<span style={{fontSize:'7px',background:'#00E5FF22',border:'1px solid #00E5FF44',color:'#00E5FF',borderRadius:'2px',padding:'0 2px',flexShrink:0}}>P</span>}
                        {clip.nested&&<span style={{fontSize:'7px',background:'rgba(124,92,255,0.2)',border:'1px solid rgba(124,92,255,0.4)',color:'var(--accent)',borderRadius:'2px',padding:'0 2px',flexShrink:0}}>N</span>}
                      </div>
                      {track.type!=='caption'&&(
                        <div style={{flex:1,overflow:'hidden',position:'relative',display:'flex',alignItems:'center'}}>
                          {clip.type==='video'?(
                            <div style={{display:'flex',gap:'2px',height:'100%',opacity:0.6}}>
                              {Array.from({length:Math.max(1,Math.floor(clip.width*zoom*0.015))}).map((_,i)=>(
                                <div key={i} style={{width:'40px',height:'100%',background:`linear-gradient(135deg,${clip.color}33,${clip.color}11)`,borderRight:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <span style={{fontSize:'12px',opacity:0.2}}>🎬</span>
                                </div>
                              ))}
                            </div>
                          ):(
                            <ClipWave color={clip.color} n={Math.floor(clip.width*zoom*0.25)}/>
                          )}
                          {clip.keyframes&&Object.entries(clip.keyframes).map(([prop,kfs])=>(
                            <div key={prop} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
                              {kfs.map(kf=>{
                                const isSel=selectedKeyframe?.clipId===clip.id&&selectedKeyframe?.prop===prop&&selectedKeyframe?.kfId===kf.id;
                                return (
                                  <div key={kf.id}
                                    onMouseDown={e=>{e.stopPropagation();setSelectedKeyframe({clipId:clip.id,prop,kfId:kf.id});}}
                                    onContextMenu={e=>{
                                      e.preventDefault();e.stopPropagation();
                                      setSelectedKeyframe({clipId:clip.id,prop,kfId:kf.id});
                                      const ni=kf.interpolation==='linear'?'ease-in':kf.interpolation==='ease-in'?'ease-out':'linear';
                                      setClips(prev=>prev.map(c=>{
                                        if(c.id!==clip.id||!c.keyframes?.[prop])return c;
                                        const nk={...c.keyframes};
                                        nk[prop]=nk[prop].map(k=>k.id===kf.id?{...k,interpolation:ni as any}:k);
                                        return{...c,keyframes:nk};
                                      }));
                                      notify(`Interpolation: ${ni}`);
                                    }}
                                    style={{position:'absolute',left:`${kf.time*zoom*0.14/clip.width*100}%`,top:'50%',width:'8px',height:'8px',background:isSel?'var(--yellow)':'white',border:'1px solid rgba(0,0,0,0.5)',transform:'translate(-50%,-50%) rotate(45deg)',cursor:'pointer',pointerEvents:'auto',zIndex:30,boxShadow:isSel?'0 0 8px var(--yellow)':'none'}}
                                    title={`${prop}: ${kf.value} (${kf.interpolation})`}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                      {['select','ripple'].includes(activeTool)&&(
                        <>
                          <div onMouseDown={e=>{e.stopPropagation();dragMovedRef.current=false;historyRef.current=[...historyRef.current.slice(-30),[...clips]];setEdgeDragState({clipId:clip.id,edge:'left',startX:e.clientX,initialStart:clip.start,initialWidth:clip.width,sourceWidth:clip.sourceWidth||clip.width});setSelectedClipIds([clip.id]);}} style={{position:'absolute',left:0,top:0,bottom:0,width:'8px',cursor:'col-resize',zIndex:10}}/>
                          <div onMouseDown={e=>{e.stopPropagation();dragMovedRef.current=false;historyRef.current=[...historyRef.current.slice(-30),[...clips]];setEdgeDragState({clipId:clip.id,edge:'right',startX:e.clientX,initialStart:clip.start,initialWidth:clip.width,sourceWidth:clip.sourceWidth||clip.width});setSelectedClipIds([clip.id]);}} style={{position:'absolute',right:0,top:0,bottom:0,width:'8px',cursor:'col-resize',zIndex:10}}/>
                        </>
                      )}
                      <div style={{position:'absolute',left:0,top:0,bottom:0,width:'6px',background:`linear-gradient(to right,${clip.color}40,transparent)`,pointerEvents:'none'}}/>
                      <div style={{position:'absolute',right:0,top:0,bottom:0,width:'6px',background:`linear-gradient(to left,${clip.color}40,transparent)`,pointerEvents:'none'}}/>
                    </div>
                  );
                })}

                {/* Razor line */}
                {activeTool==='razor'&&razorLinePos!==null&&(
                  <div style={{position:'absolute',left:`${razorLinePos}%`,top:0,bottom:0,width:'2px',background:'rgba(255,59,82,0.95)',zIndex:25,pointerEvents:'none',transform:'translateX(-50%)',boxShadow:'0 0 10px rgba(255,59,82,0.7)',transition:'left 0.02s linear'}}>
                    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:'14px',lineHeight:1,userSelect:'none',filter:'drop-shadow(0 0 6px rgba(255,59,82,1))'}}>✂</div>
                  </div>
                )}

                {/* Snap line */}
                {snapLineUnits!==null&&(
                  <div style={{position:'absolute',left:`${snapLineUnits*zoom*0.14}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',zIndex:24,pointerEvents:'none',boxShadow:'0 0 8px rgba(255,214,10,0.6)'}}>
                    <div style={{position:'absolute',top:0,left:'50%',transform:'translate(-50%,-50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'6px solid var(--yellow)'}}/>
                  </div>
                )}

                {/* Playhead */}
                <div style={{position:'absolute',left:`${playheadPos}%`,top:0,bottom:0,width:'1px',background:'var(--yellow)',opacity:0.85,zIndex:8,pointerEvents:'none',boxShadow:'0 0 4px rgba(255,214,10,0.4)'}}/>
              </div>
            ))}

            {/* Marquee */}
            {marqueeSelection?.isActive&&(
              <div style={{position:'fixed',left:`${Math.min(marqueeSelection.startX,marqueeSelection.currentX)}px`,top:`${Math.min(marqueeSelection.startY,marqueeSelection.currentY)}px`,width:`${Math.abs(marqueeSelection.startX-marqueeSelection.currentX)}px`,height:`${Math.abs(marqueeSelection.startY-marqueeSelection.currentY)}px`,background:'rgba(124,92,255,0.15)',border:'1px solid var(--accent)',borderRadius:'2px',zIndex:100,pointerEvents:'none'}}/>
            )}
          </div>
        </div>
      </div>

      {/* Trim tooltip */}
      {trimTooltip&&(
        <div style={{position:'fixed',left:`${trimTooltip.x}px`,top:`${trimTooltip.y}px`,transform:'translateX(-50%)',background:'rgba(0,0,0,0.85)',color:'white',padding:'4px 8px',borderRadius:'4px',fontSize:'10px',fontFamily:'monospace',fontWeight:700,border:'1px solid var(--border-bright)',boxShadow:'0 4px 12px rgba(0,0,0,0.5)',zIndex:1000,pointerEvents:'none'}}>
          {trimTooltip.text}
        </div>
      )}

      {/* Gap context menu */}
      {gapContextMenu&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:9998}} onClick={e=>{e.stopPropagation();setGapContextMenu(null);}} onContextMenu={e=>{e.preventDefault();e.stopPropagation();setGapContextMenu(null);}}/>
          <div style={{position:'fixed',left:gapContextMenu.x,top:gapContextMenu.y,zIndex:9999,background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'6px',padding:'4px',boxShadow:'0 4px 12px rgba(0,0,0,0.5)',display:'flex',flexDirection:'column',width:'150px'}}>
            <button onClick={e=>{e.stopPropagation();const{gap}=gapContextMenu;historyRef.current=[...historyRef.current.slice(-30),[...stateRef.current.clips]];setClips(prev=>prev.map(c=>c.trackId===gap.trackId&&c.start>=gap.start+gap.width?{...c,start:Math.max(0,c.start-gap.width)}:c));setGapContextMenu(null);notify('Ripple Delete applied to Gap');}}
              style={{background:'transparent',border:'none',color:'var(--text-primary)',padding:'6px 8px',textAlign:'left',fontSize:'11px',fontFamily:'Syne,sans-serif',cursor:'pointer',borderRadius:'4px',display:'flex',alignItems:'center',gap:'8px'}}
              onMouseOver={e=>e.currentTarget.style.background='var(--accent)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}
            ><span style={{color:'var(--accent)'}}>🗑</span> Ripple Delete</button>
          </div>
        </>
      )}

      {/* Transport */}
      <div style={{height:'30px',flexShrink:0,display:'flex',alignItems:'center',padding:'0 10px',gap:'10px',borderTop:'1px solid var(--border)',background:'var(--bg-tertiary)'}}>
        <div style={{display:'flex',gap:'3px',alignItems:'center'}}>
          {(['⏮','⏪',isPlaying?'⏸':'▶','⏩','⏭'] as const).map((ic,i)=>(
            <button key={i} onClick={i===2?()=>setIsPlaying(!isPlaying):undefined} style={{background:i===2?'var(--accent)':'none',border:'none',color:i===2?'white':'var(--text-secondary)',cursor:'pointer',fontSize:'12px',borderRadius:'4px',width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{ic}</button>
          ))}
        </div>
        <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700}}>{timecode}</span>
        <div style={{flex:1,height:'3px',background:'var(--border)',borderRadius:'2px',position:'relative',cursor:'pointer'}} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setPlayheadPos((e.clientX-r.left)/r.width*100);}}>
          <div style={{width:`${playheadPos}%`,height:'100%',background:'var(--accent)',borderRadius:'2px'}}/>
          <div style={{position:'absolute',left:`${playheadPos}%`,top:'50%',transform:'translate(-50%,-50%)',width:'9px',height:'9px',borderRadius:'50%',background:'var(--accent)',border:'1.5px solid white'}}/>
        </div>
        <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--text-secondary)'}}>00;02;01;22</span>
        <div style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'4px'}}>
          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--green)'}}/>
          <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>Saved</span>
        </div>
      </div>
    </div>
  );
}
