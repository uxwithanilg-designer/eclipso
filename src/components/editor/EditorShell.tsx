'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore, selectClips } from '@/store/editorStore';
import { MUSIC_TRACKS_DATA, ProjectFile } from '@/types/editor';
import { usePlayback } from '@/hooks/usePlayback';
import { useKeyboard } from '@/hooks/useKeyboard';
import TopBar from './TopBar';
import ToolPanel from './ToolPanel';
import LeftPanel from './LeftPanel';
import SourceMonitor from './SourceMonitor';
import ProgramMonitor from './ProgramMonitor';
import RightPanel from './RightPanel';
import Timeline from './Timeline';
import ExportModal from './ExportModal';
import MobileEditor from './MobileEditor';

export default function EditorShell() {
  const isMobile       = useEditorStore(s => s.isMobile);
  const setIsMobile    = useEditorStore(s => s.setIsMobile);
  const showExport     = useEditorStore(s => s.showExport);
  const setShowExport  = useEditorStore(s => s.setShowExport);
  const notification   = useEditorStore(s => s.notification);
  const zoom           = useEditorStore(s => s.zoom);
  const past           = useEditorStore(s => s.past);
  const future         = useEditorStore(s => s.future);
  const playheadPos    = useEditorStore(s => s.playheadPos);
  const snappingEnabled= useEditorStore(s => s.snappingEnabled);
  const setSnappingEnabled = useEditorStore(s => s.setSnappingEnabled);
  const undo           = useEditorStore(s => s.undo);
  const redo           = useEditorStore(s => s.redo);
  const notify         = useEditorStore(s => s.notify);
  const setPlayheadPos = useEditorStore(s => s.setPlayheadPos);
  const setClips       = useEditorStore(s => s.setClips);
  const applyAction    = useEditorStore(s => s.applyAction);
  const addProjectFiles= useEditorStore(s => s.addProjectFiles);
  const setSourceClip  = useEditorStore(s => s.setSourceClip);
  const setSourcePlayheadPct = useEditorStore(s => s.setSourcePlayheadPct);
  const setSourceInPct = useEditorStore(s => s.setSourceInPct);
  const setSourceOutPct= useEditorStore(s => s.setSourceOutPct);
  const setSourceIsPlaying = useEditorStore(s => s.setSourceIsPlaying);
  const sourceClip     = useEditorStore(s => s.sourceClip);
  const sourceInPct    = useEditorStore(s => s.sourceInPct);
  const sourceOutPct   = useEditorStore(s => s.sourceOutPct);
  const clips          = useEditorStore(selectClips);

  // Timecode display
  const playheadUnits = playheadPos / (zoom * 0.14);
  const totalFrames = Math.round(playheadUnits / 15 * 30);
  const ss = Math.floor(totalFrames / 30);
  const ff = totalFrames % 30;
  const mm = Math.floor(ss / 60);
  const hh = Math.floor(mm / 60);
  const timecode = `${String(hh).padStart(2,'0')};${String(mm%60).padStart(2,'0')};${String(ss%60).padStart(2,'0')};${String(ff).padStart(2,'0')}`;

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const dragNewItemRef = useRef<{type:'video'|'audio'; label:string; color:string; duration?:number; url?:string; sourceOffset?:number; sourceWidth?:number} | null>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobile]);

  // Playback rAF loop
  usePlayback();

  // Global keyboard shortcuts
  useKeyboard(fileInputRef);

  // ── File upload handler ──
  const handleProcessUploadedFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles: ProjectFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isAudio && !isImage) continue;

      let type: 'video' | 'audio' | 'image' = isVideo ? 'video' : isAudio ? 'audio' : 'image';
      let color = isVideo ? '#9966FF' : isAudio ? '#00E5FF' : '#FFD60A';
      let duration = 150;
      let thumbnailUrl = '';

      if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => {
            duration = Math.max(30, Math.round(video.duration * 15));
            video.currentTime = Math.min(1, video.duration / 2);
          };
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160; canvas.height = 90;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(video, 0, 0, 160, 90);
            thumbnailUrl = canvas.toDataURL('image/jpeg');
            resolve();
          };
          video.onerror = () => resolve();
        });
      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.src = url;
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => { duration = Math.max(30, Math.round(audio.duration * 15)); resolve(); };
          audio.onerror = () => resolve();
        });
      } else if (isImage) {
        thumbnailUrl = url;
        duration = 75;
      }

      newFiles.push({
        id: Date.now().toString() + i,
        name: file.name,
        type,
        duration,
        color,
        url,
        thumbnailUrl,
        hasAudio: isVideo || isAudio
      });
    }

    if (newFiles.length) {
      addProjectFiles(newFiles);
      notify(`Imported ${newFiles.length} file(s)`);
    }
  }, [addProjectFiles, notify]);

  // ── Media import handlers ──
  const handleImportMedia = useCallback((f: ProjectFile | string) => {
    const label  = typeof f === 'string' ? f : f.name;
    const color  = typeof f === 'string' ? '#9966FF' : f.color;
    const type   = typeof f === 'string' ? 'video' : f.type;
    const trackId= type === 'audio' ? 4 : 3;
    const width  = typeof f === 'string' ? 130 : f.duration || 150;
    const url    = typeof f === 'string' ? undefined : f.url;
    const insertStart = Math.round(playheadPos / (zoom * 0.14)) || 0;
    setClips(p => [...p, {id:Date.now(), trackId, start:insertStart, width, label, color, type:type as 'video'|'audio', url, sourceOffset:0, sourceWidth:width}]);
    notify(`"${label}" added to timeline`);
  }, [playheadPos, zoom, setClips, notify]);

  const handleImportTrack = useCallback((t: typeof MUSIC_TRACKS_DATA[0]) => {
    setClips(p => [...p, {id:Date.now(), trackId:5, start:0, width:420, label:`${t.title} — ${t.artist}`, color:t.accent, type:'audio'}]);
    notify(`"${t.title}" imported to A2`);
  }, [setClips, notify]);

  // ── Open source monitor ──
  const handleOpenSource = useCallback((item: any) => {
    setSourceClip({ label:item.label, type:item.type, color:item.color, duration:item.duration||150, url:item.url });
    setSourcePlayheadPct(0);
    setSourceInPct(0);
    setSourceOutPct(100);
    setSourceIsPlaying(false);
  }, [setSourceClip, setSourcePlayheadPct, setSourceInPct, setSourceOutPct, setSourceIsPlaying]);

  // ── Source insert ──
  const handleSourceInsert = useCallback((mode: 'insert' | 'overwrite') => {
    if (!sourceClip) return;
    const inP  = Math.min(sourceInPct, sourceOutPct);
    const outP = Math.max(sourceInPct, sourceOutPct);
    const durationUnits = Math.max(1, Math.round((outP - inP) / 100 * sourceClip.duration * 15));
    const videoTrackId = 3;
    const audioTrackId = 4;
    const insertStart = Math.round(playheadPos / (zoom * 0.14));

    let nextClips = [...clips];
    if (mode === 'insert') {
      nextClips = nextClips.map(c => c.start >= insertStart ? { ...c, start: c.start + durationUnits } : c);
    } else {
      nextClips = nextClips.filter(c => {
        const ends = c.start + c.width;
        const isOverlapping = (c.trackId === videoTrackId || c.trackId === audioTrackId) &&
          ((c.start >= insertStart && c.start < insertStart + durationUnits) ||
           (ends > insertStart && ends <= insertStart + durationUnits) ||
           (c.start < insertStart && ends > insertStart + durationUnits));
        return !isOverlapping;
      });
    }

    const gid = Date.now();
    const videoClip = {
      id: gid, trackId: videoTrackId, start: insertStart, width: durationUnits,
      label: sourceClip.label, color: sourceClip.color, type: 'video' as const,
      url: sourceClip.url, sourceOffset: (inP / 100 * sourceClip.duration) * 15,
      sourceWidth: sourceClip.duration * 15, groupId: gid
    };
    const audioClip = { ...videoClip, id: gid + 1, trackId: audioTrackId, type: 'audio' as const, color: '#00E5FF' };
    applyAction(`${mode === 'insert' ? 'Insert' : 'Overwrite'} "${sourceClip.label}"`, [...nextClips, videoClip, audioClip]);
    notify(`"${sourceClip.label}" ${mode}ed to timeline`);
  }, [sourceClip, sourceInPct, sourceOutPct, playheadPos, zoom, clips, applyAction, notify]);

  // ── Drag start from media/library/source ──
  const handleDragStartNewItem = useCallback((e: React.DragEvent, item: {type:'video'|'audio'; label:string; color:string; duration?:number; url?:string; sourceOffset?:number}) => {
    e.dataTransfer.setData('text/plain', item.label);
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
    dragNewItemRef.current = item;
  }, []);

  if (isMobile) {
    return (
      <MobileEditor
        onImportMedia={(label) => handleImportMedia(label)}
        onImportTrack={handleImportTrack}
      />
    );
  }

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'var(--bg-primary)',overflow:'hidden',userSelect:'none'}}>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="video/*,audio/*,image/*"
        style={{display:'none'}}
        onChange={e => handleProcessUploadedFiles(e.target.files)}
      />

      {/* Top bar */}
      <TopBar/>

      {/* Main workspace */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* Tool panel */}
        <ToolPanel/>

        {/* Left panel */}
        <LeftPanel
          onUploadClick={() => fileInputRef.current?.click()}
          onDragStartItem={handleDragStartNewItem}
          onDoubleClickItem={handleOpenSource}
          onImportMedia={handleImportMedia}
          onImportTrack={handleImportTrack}
        />

        {/* Center column */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

          {/* Monitors row */}
          <div style={{display:'flex',height:'42%',flexShrink:0,borderBottom:'1px solid var(--border)'}}>
            <SourceMonitor
              onDragStartItem={handleDragStartNewItem}
              onInsert={handleSourceInsert}
            />
            <ProgramMonitor/>
          </div>

          {/* Timeline */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <Timeline dragNewItemRef={dragNewItemRef}/>
          </div>
        </div>

        {/* Right panel */}
        <RightPanel/>
      </div>

      {/* Status bar */}
      <div style={{height:'22px',flexShrink:0,background:'var(--bg-tertiary)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 12px',gap:'16px',zIndex:50}}>
        <span style={{fontSize:'9px',fontFamily:'monospace',color:'var(--yellow)',fontWeight:700}}>{timecode}</span>
        <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>Duration: 02:01;22</span>
        <span style={{fontSize:'9px',color:'var(--text-muted)'}}>In: 00;00;00;00 · Out: 00;02;01;22</span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',gap:'6px',alignItems:'center',marginRight:'8px'}}>
          <button onClick={undo} disabled={past.length===0} title="Undo (Ctrl+Z)"
            style={{background:'none',border:'none',cursor:past.length>0?'pointer':'not-allowed',fontSize:'11px',opacity:past.length>0?1:0.3,color:past.length>0?'var(--text-secondary)':'var(--text-muted)',padding:'2px 4px',borderRadius:'3px'}}>↩</button>
          <button onClick={redo} disabled={future.length===0} title="Redo (Ctrl+Y)"
            style={{background:'none',border:'none',cursor:future.length>0?'pointer':'not-allowed',fontSize:'11px',opacity:future.length>0?1:0.3,color:future.length>0?'var(--text-secondary)':'var(--text-muted)',padding:'2px 4px',borderRadius:'3px'}}>↪</button>
          <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'monospace',marginLeft:'4px'}}>{past.length}/{future.length}</span>
        </div>
        <div style={{display:'flex',gap:'2px',alignItems:'center'}}>
          <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',marginRight:'3px'}}>L</span>
          <div style={{width:'60px',height:'6px',background:'var(--border)',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{width:'72%',height:'100%',background:'linear-gradient(to right,#00FF94,#FFD60A,#FF3B82 90%)'}}/>
          </div>
          <div style={{width:'60px',height:'6px',background:'var(--border)',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{width:'68%',height:'100%',background:'linear-gradient(to right,#00FF94,#FFD60A,#FF3B82 90%)'}}/>
          </div>
          <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',marginLeft:'3px'}}>R</span>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>29.97 fps</span>
          <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>1920×1080</span>
          <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>Zoom: {Math.round(zoom*100)}%</span>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)}/>}
      {notification && (
        <div style={{position:'fixed',bottom:'30px',left:'50%',transform:'translateX(-50%)',zIndex:2000,padding:'9px 18px',borderRadius:'9px',background:'var(--bg-card)',border:'1px solid var(--accent)',fontSize:'12px',fontFamily:'Syne,sans-serif',fontWeight:600,color:'var(--accent)',boxShadow:'0 8px 30px rgba(0,0,0,0.5)',animation:'fadeInUp 0.3s ease',whiteSpace:'nowrap'}}>
          ✓ {notification}
        </div>
      )}
    </div>
  );
}
