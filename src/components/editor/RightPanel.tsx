'use client';
import { useState, useEffect } from 'react';
import { useEditorStore, selectClips } from '@/store/editorStore';
import { Clip, getClipValue } from '@/types/editor';

// ── NumberScrubber ──
function NumberScrubber({ value, onChange, min = -Infinity, max = Infinity, step = 1, unit = '' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(String(value));
  useEffect(() => { setTempVal(String(value)); }, [value]);

  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX, startVal = value;
    const move = (ev: MouseEvent) => {
      let delta = (ev.clientX - startX) * step;
      if (ev.shiftKey) delta *= 10;
      let nv = Math.max(min, Math.min(max, startVal + delta));
      onChange(Math.round(nv * 10) / 10);
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };
  const handleBlur = () => {
    setIsEditing(false);
    let nv = Number(tempVal);
    if (isNaN(nv)) nv = value;
    onChange(Math.max(min, Math.min(max, nv)));
  };
  if (isEditing) return (
    <input autoFocus value={tempVal} onChange={e => setTempVal(e.target.value)} onBlur={handleBlur}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      style={{width:'100%',background:'transparent',border:'none',color:'var(--text-primary)',fontFamily:'monospace',fontSize:'10px',outline:'none'}}
    />
  );
  return (
    <span onMouseDown={handleDrag} onClick={() => setIsEditing(true)}
      style={{cursor:'ew-resize',color:'var(--text-primary)',userSelect:'none',flex:1,height:'100%',display:'flex',alignItems:'center'}}
    >{Number(value).toFixed(1)}{unit}</span>
  );
}

// ── RotationDial ──
function RotationDial({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY, startVal = value;
    const move = (ev: MouseEvent) => {
      let delta = (startY - ev.clientY);
      if (ev.shiftKey) delta *= 5;
      onChange(Math.round(Math.max(-360, Math.min(360, startVal + delta))));
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };
  return (
    <div onMouseDown={handleDrag} style={{width:'16px',height:'16px',borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg-card)',position:'relative',cursor:'ns-resize',flexShrink:0}}>
      <div style={{position:'absolute',top:'50%',left:'50%',width:'50%',height:'1.5px',background:'var(--accent)',transformOrigin:'0% 50%',transform:`translate(0%,-50%) rotate(${value-90}deg)`}}/>
    </div>
  );
}

// ── EffectControls ──
interface EffectControlsProps {
  clip: Clip | undefined;
  playheadUnits: number;
  onChange: (id: number, changes: Partial<Clip>) => void;
  onToggleKeyframing: (id: number, prop: string) => void;
  onJumpToKeyframe: (id: number, prop: string, dir: 'prev'|'next') => void;
}

function EffectControls({ clip, onChange, playheadUnits, onToggleKeyframing, onJumpToKeyframe }: EffectControlsProps) {
  if (!clip) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',textAlign:'center'}}>
      <div>
        <div style={{fontSize:'28px',marginBottom:'10px',opacity:0.15}}>🎛</div>
        <div style={{fontSize:'11px',color:'var(--text-secondary)',lineHeight:1.6}}>Select a clip in the timeline<br/>to view its effect controls</div>
      </div>
    </div>
  );

  const cv = (prop: string) => getClipValue(clip, prop, playheadUnits);
  const isKfing = (prop: string) => !!(clip.keyframes?.[prop]);
  const hasKfAtPlayhead = (prop: string) => {
    const kfs = clip.keyframes?.[prop];
    if (!kfs) return false;
    const relTime = playheadUnits - clip.start;
    return kfs.some(k => Math.abs(k.time - relTime) < 0.1);
  };
  const updateProp = (key: keyof Clip, val: number) => onChange(clip.id, { [key]: val });

  const PropRow = ({ label, prop, min, max, step, unit, dial }: { label: string; prop: string; min?: number; max?: number; step?: number; unit?: string; dial?: boolean }) => (
    <div style={{display:'flex',alignItems:'center',gap:'4px',marginBottom:'5px'}}>
      <div style={{width:'75px',flexShrink:0,display:'flex',alignItems:'center',gap:'3px'}}>
        <button onClick={() => onToggleKeyframing(clip.id, prop)} title="Enable keyframing"
          style={{width:'14px',height:'14px',borderRadius:'50%',border:'1px solid var(--border)',background:isKfing(prop)?'var(--accent)':'var(--bg-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'8px',color:isKfing(prop)?'white':'var(--text-muted)',padding:0}}
        >⏱</button>
        <span style={{fontSize:'10px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>{label}</span>
      </div>
      {dial && <RotationDial value={cv(prop)} onChange={v => updateProp(prop as any, v)} />}
      <div style={{flex:1,background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'4px',padding:'3px 6px',display:'flex',alignItems:'center'}}>
        <NumberScrubber value={cv(prop)} onChange={v => updateProp(prop as any, v)} min={min} max={max} step={step} unit={unit} />
      </div>
      {isKfing(prop) && (
        <div style={{display:'flex',gap:'1px',flexShrink:0}}>
          <button onClick={() => onJumpToKeyframe(clip.id, prop, 'prev')} style={{width:'12px',height:'20px',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'8px',padding:0}}>◀</button>
          <button style={{width:'12px',height:'20px',background:hasKfAtPlayhead(prop)?'var(--accent-glow)':'transparent',border:`1px solid ${hasKfAtPlayhead(prop)?'var(--accent)':'var(--border)'}`,borderRadius:'2px',color:hasKfAtPlayhead(prop)?'var(--accent)':'var(--text-muted)',cursor:'pointer',fontSize:'7px',padding:0}}>◆</button>
          <button onClick={() => onJumpToKeyframe(clip.id, prop, 'next')} style={{width:'12px',height:'20px',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'8px',padding:0}}>▶</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
      <div style={{padding:'8px 10px',borderRadius:'7px',background:`${clip.color}12`,border:`1px solid ${clip.color}30`,marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:clip.color,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'11px',fontWeight:700,fontFamily:'Syne,sans-serif',color:clip.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{clip.label}</div>
          <div style={{fontSize:'9px',color:'var(--text-secondary)'}}>{clip.type} · Track {clip.trackId}</div>
        </div>
      </div>
      <div style={{marginBottom:'10px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',marginBottom:'6px'}}>
          <span style={{fontSize:'10px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:700}}>▶ Motion</span>
          <div style={{display:'flex',gap:'4px'}}>
            <button onClick={() => onChange(clip.id, {x:0,y:0,scale:100,rotation:0,anchorX:960,anchorY:540,keyframes:undefined})} title="Reset" style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'11px'}}>↺</button>
            <button title="Toggle" style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px'}}>👁</button>
          </div>
        </div>
        <PropRow label="Position X" prop="x" />
        <PropRow label="Position Y" prop="y" />
        <PropRow label="Scale"      prop="scale"    min={0}    max={500} unit="%" />
        <PropRow label="Rotation"   prop="rotation" min={-360} max={360} unit="°" dial />
        <PropRow label="Anchor X"   prop="anchorX" />
        <PropRow label="Anchor Y"   prop="anchorY" />
      </div>
      <div style={{marginBottom:'10px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',marginBottom:'6px'}}>
          <span style={{fontSize:'10px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:700}}>▶ Opacity</span>
          <button style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px'}}>👁</button>
        </div>
        <PropRow label="Opacity" prop="opacity" min={0} max={100} unit="%" />
      </div>
      <div style={{marginBottom:'10px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',marginBottom:'6px'}}>
          <span style={{fontSize:'10px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:700}}>▶ Time Remapping</span>
          <button style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px'}}>👁</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
          <button style={{width:'14px',height:'14px',borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg-secondary)',cursor:'pointer',fontSize:'8px',color:'var(--text-muted)',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>⏱</button>
          <span style={{fontSize:'10px',color:'var(--text-secondary)'}}>Speed</span>
          <div style={{flex:1,background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'4px',padding:'3px 6px',display:'flex',justifyContent:'space-between',cursor:'ew-resize'}}>
            <span style={{fontSize:'10px',fontFamily:'monospace',color:clip.speed?'#FFD60A':'var(--text-primary)'}}>{clip.speed||100}%</span>
          </div>
        </div>
      </div>
      <button style={{width:'100%',padding:'7px',borderRadius:'7px',background:'transparent',border:'1px dashed var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:600,marginBottom:'10px',transition:'all 0.2s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)';}}
      >+ Add Effect</button>
      <div style={{padding:'8px',borderRadius:'7px',background:'var(--bg-secondary)',border:'1px solid var(--border)',marginBottom:'8px'}}>
        <div style={{fontSize:'10px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'6px'}}>MASKING</div>
        <div style={{display:'flex',gap:'4px'}}>
          {['⭕ Ellipse','▭ Rectangle','✒ Pen'].map(m=>(
            <button key={m} style={{flex:1,padding:'4px 2px',borderRadius:'5px',border:'1px solid var(--border)',background:'var(--bg-card)',color:'var(--text-secondary)',fontSize:'9px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)';}}
            >{m}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Right Panel ──
type RightTab = 'effectcontrols' | 'info';

export default function RightPanel() {
  const [rightTab, setRightTab] = useState<RightTab>('effectcontrols');
  const clips          = useEditorStore(selectClips);
  const selectedClipIds= useEditorStore(s => s.selectedClipIds);
  const playheadPos    = useEditorStore(s => s.playheadPos);
  const zoom           = useEditorStore(s => s.zoom);
  const setClips       = useEditorStore(s => s.setClips);
  const setSelectedKeyframe = useEditorStore(s => s.setSelectedKeyframe);
  const setPlayheadPos = useEditorStore(s => s.setPlayheadPos);

  const selectedClipObj = clips.find(c => selectedClipIds.includes(c.id));
  const playheadUnits   = playheadPos / (zoom * 0.14);

  const handleChange = (id: number, changes: Partial<Clip>) => {
    setClips(prev => prev.map(c => {
      if (c.id !== id) return c;
      const pu = playheadPos / (zoom * 0.14);
      const relTime = pu - c.start;
      let nextChanges = { ...changes };
      if (c.keyframes) {
        const updatedKfs = { ...c.keyframes };
        Object.keys(changes).forEach(prop => {
          if (updatedKfs[prop]) {
            const existingIdx = updatedKfs[prop].findIndex(k => Math.abs(k.time - relTime) < 0.1);
            const newVal = (changes as any)[prop];
            if (existingIdx !== -1) {
              updatedKfs[prop][existingIdx] = { ...updatedKfs[prop][existingIdx], value: newVal };
            } else {
              updatedKfs[prop] = [...updatedKfs[prop], { id: Date.now(), time: relTime, value: newVal, interpolation: 'linear' as const }].sort((a,b) => a.time - b.time);
            }
            delete (nextChanges as any)[prop];
          }
        });
        nextChanges = { ...nextChanges, keyframes: updatedKfs } as any;
      }
      return { ...c, ...nextChanges };
    }));
  };

  const handleToggleKeyframing = (id: number, prop: string) => {
    setClips(prev => prev.map(c => {
      if (c.id !== id) return c;
      const kfs = c.keyframes || {};
      if (kfs[prop]) {
        const nextKfs = { ...kfs }; delete nextKfs[prop];
        return { ...c, keyframes: Object.keys(nextKfs).length > 0 ? nextKfs : undefined };
      } else {
        const pu = playheadPos / (zoom * 0.14);
        const relTime = pu - c.start;
        const currentVal = getClipValue(c, prop, pu);
        return { ...c, keyframes: { ...kfs, [prop]: [{ id: Date.now(), time: relTime, value: currentVal, interpolation: 'linear' as const }] } };
      }
    }));
  };

  const handleJumpToKeyframe = (id: number, prop: string, dir: 'prev'|'next') => {
    const clip = clips.find(c => c.id === id);
    if (!clip || !clip.keyframes?.[prop]) return;
    const pu = playheadPos / (zoom * 0.14);
    const relTime = pu - clip.start;
    const sorted = [...clip.keyframes[prop]].sort((a,b) => a.time - b.time);
    const target = dir === 'prev'
      ? [...sorted].reverse().find(k => k.time < relTime - 0.1)
      : sorted.find(k => k.time > relTime + 0.1);
    if (target) setPlayheadPos((clip.start + target.time) * (zoom * 0.14));
  };

  return (
    <div style={{width:'240px',flexShrink:0,background:'var(--bg-secondary)',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',zIndex:30}}>
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
        {([{id:'effectcontrols' as RightTab,label:'Effect Controls'},{id:'info' as RightTab,label:'Info'}]).map(t=>(
          <button key={t.id} onClick={()=>setRightTab(t.id)} style={{flex:1,padding:'7px 4px',border:'none',background:'transparent',borderBottom:`2px solid ${rightTab===t.id?'var(--accent)':'transparent'}`,color:rightTab===t.id?'var(--accent)':'var(--text-muted)',fontSize:'10px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,transition:'all 0.15s'}}>{t.label}</button>
        ))}
      </div>

      {rightTab === 'effectcontrols' && (
        <EffectControls
          clip={selectedClipObj}
          playheadUnits={playheadUnits}
          onChange={handleChange}
          onToggleKeyframing={handleToggleKeyframing}
          onJumpToKeyframe={handleJumpToKeyframe}
        />
      )}

      {rightTab === 'info' && (
        <div style={{flex:1,padding:'12px',overflowY:'auto'}}>
          <div style={{fontSize:'10px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:'10px'}}>SEQUENCE INFO</div>
          {[
            {l:'Sequence',v:'Strike_the_Heavens'},{l:'Duration',v:'00;02;01;22'},
            {l:'Start TC',v:'00;00;00;00'},{l:'Resolution',v:'1920 × 1080'},
            {l:'Frame Rate',v:'29.97 fps'},{l:'Audio',v:'48000 Hz Stereo'},
            {l:'Editing Mode',v:'Desktop'},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',marginBottom:'7px'}}>
              <span style={{fontSize:'10px',color:'var(--text-secondary)'}}>{r.l}</span>
              <span style={{fontSize:'10px',color:'var(--text-primary)',fontFamily:'monospace',textAlign:'right',maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis'}}>{r.v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}><span style={{color:'var(--accent)',fontWeight:700}}>ECLIPSO</span> v1.0 Beta</span>
        <span style={{fontSize:'8px',color:'var(--text-muted)',fontFamily:'monospace'}}>30 fps</span>
      </div>
    </div>
  );
}
