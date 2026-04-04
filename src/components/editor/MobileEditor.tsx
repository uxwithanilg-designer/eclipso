'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useEditorStore, selectClips } from '@/store/editorStore';
import { MobileTab, CLIP_WAVE, MUSIC_TRACKS_DATA } from '@/types/editor';
import ExportModal from './ExportModal';

interface Props {
  onImportMedia: (label: string) => void;
  onImportTrack: (t: typeof MUSIC_TRACKS_DATA[0]) => void;
}

export default function MobileEditor({ onImportMedia, onImportTrack }: Props) {
  const clips          = useEditorStore(selectClips);
  const isPlaying      = useEditorStore(s => s.isPlaying);
  const setIsPlaying   = useEditorStore(s => s.setIsPlaying);
  const playheadPos    = useEditorStore(s => s.playheadPos);
  const setPlayheadPos = useEditorStore(s => s.setPlayheadPos);
  const zoom           = useEditorStore(s => s.zoom);
  const showExport     = useEditorStore(s => s.showExport);
  const setShowExport  = useEditorStore(s => s.setShowExport);
  const notification   = useEditorStore(s => s.notification);

  const [activeTab, setActiveTab] = useState<MobileTab>(null);

  const videoClips = clips.filter(c => c.type === 'video' && c.trackId === 3);
  const audioClips = clips.filter(c => c.type === 'audio' && c.trackId === 5);

  // Convert playheadPos (0-100%) to a percentage within the timeline view
  const playheadPct = playheadPos;

  const TABS = [
    {id:'videos' as MobileTab, icon:'📹', label:'Videos and images'},
    {id:'music'  as MobileTab, icon:'🎵', label:'Music and audio'},
    {id:'titles' as MobileTab, icon:'T',  label:'Titles and captions'},
  ];

  // Timecode from playhead
  const playheadUnits = playheadPos / (zoom * 0.14);
  const totalFrames = Math.round(playheadUnits / 15 * 30);
  const ss = Math.floor(totalFrames / 30);
  const ff = totalFrames % 30;
  const mm = Math.floor(ss / 60);
  const hh = Math.floor(mm / 60);
  const timecode = `${String(hh).padStart(2,'0')}:${String(mm%60).padStart(2,'0')}:${String(ss%60).padStart(2,'0')};${String(ff).padStart(2,'0')}`;

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#0A0A0C',overflow:'hidden',WebkitUserSelect:'none',userSelect:'none'}}>

      {/* Top bar */}
      <div style={{height:'52px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',background:'#0A0A0C'}}>
        <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
          <Link href="/" style={{color:'var(--text-secondary)',display:'flex',textDecoration:'none'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </Link>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',display:'flex',padding:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',display:'flex',padding:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </button>
        </div>
        <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'14px',color:'var(--text-primary)',letterSpacing:'0.5px'}}>Strike_the_Heavens</span>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#FFD60A,#FF8C00)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 3h14v2H5v-2z"/></svg>
          </div>
          <button onClick={() => setShowExport(true)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',display:'flex',padding:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        </div>
      </div>

      {/* Monitor */}
      <div style={{flex:1,minHeight:0,background:'#000',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0a0020,#000510,#050005)'}}/>
        <div style={{position:'relative',zIndex:1,fontSize:'10px',color:'rgba(255,255,255,0.08)',fontFamily:'Syne,sans-serif',letterSpacing:'3px',fontWeight:700}}>STRIKE THE HEAVENS</div>
        <div style={{position:'absolute',bottom:'10px',left:'12px',fontFamily:'monospace',fontSize:'11px',color:'rgba(255,214,10,0.8)',fontWeight:700}}>{timecode}</div>
      </div>

      {/* Transport */}
      <div style={{height:'56px',flexShrink:0,background:'#0D0D10',display:'flex',alignItems:'center',padding:'0 20px',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',gap:'16px',flex:1}}>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0,fontSize:'18px'}}>≡</button>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0,fontSize:'16px'}}>◆</button>
        </div>
        <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-primary)',padding:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8v16zM5 4h2v16H5z"/></svg>
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)}
            style={{width:'48px',height:'48px',borderRadius:'50%',background:isPlaying?'var(--accent)':'white',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isPlaying?'0 0 20px var(--accent-glow)':'0 4px 16px rgba(0,0,0,0.4)',transition:'all 0.2s',flexShrink:0}}>
            {isPlaying
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A0A0C" style={{marginLeft:'2px'}}><polygon points="5 3 19 12 5 21 5 3"/></svg>
            }
          </button>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-primary)',padding:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4zM19 4h2v16h-2z"/></svg>
          </button>
        </div>
        <div style={{display:'flex',gap:'16px',flex:1,justifyContent:'flex-end'}}>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1021 12"/></svg>
          </button>
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:0}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 7v6h-6"/><path d="M21 13A9 9 0 113 12"/></svg>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{background:'#0A0A0C',flexShrink:0,borderBottom:'1px solid var(--border)',height:activeTab?'130px':'150px',transition:'height 0.3s cubic-bezier(0.16,1,0.3,1)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div
          style={{height:'26px',flexShrink:0,overflowX:'auto',background:'#0D0D10',borderBottom:'1px solid var(--border)',position:'relative',cursor:'pointer'}}
          onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setPlayheadPos(Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100)));}}
        >
          <div style={{minWidth:'800px',width:'100%',height:'100%',position:'relative'}}>
            {[8,10,12,14,16,18,20,22,24].map(s=>(
              <div key={s} style={{position:'absolute',left:`${(s/32)*100}%`,bottom:'4px',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'monospace',whiteSpace:'nowrap'}}>0:{String(s).padStart(2,'0')}</span>
              </div>
            ))}
            <div style={{position:'absolute',left:`${playheadPct}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',zIndex:10,boxShadow:'0 0 8px rgba(255,214,10,0.6)'}}>
              <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'7px solid var(--yellow)'}}/>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowX:'auto',position:'relative'}}>
          <div style={{minWidth:'800px',height:'100%',position:'relative'}}>
            <div style={{height:'60%',borderBottom:'1px solid var(--border)',position:'relative',background:'rgba(124,92,255,0.03)'}}>
              {videoClips.map(c=>(
                <div key={c.id} style={{position:'absolute',left:`${c.start*0.15}%`,width:`${c.width*0.15}%`,top:'5px',bottom:'5px',background:`${c.color}22`,border:`1.5px solid ${c.color}55`,borderRadius:'5px',overflow:'hidden'}}>
                  <div style={{position:'absolute',bottom:'2px',left:'4px',fontSize:'8px',color:c.color,fontFamily:'Syne,sans-serif',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'90%'}}>{c.label.replace('.mp4','')}</div>
                </div>
              ))}
              <div style={{position:'absolute',left:`${playheadPct}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',opacity:0.9,zIndex:5,pointerEvents:'none'}}/>
            </div>
            <div style={{height:'40%',position:'relative',background:'rgba(0,229,255,0.03)'}}>
              {audioClips.map(c=>(
                <div key={c.id} style={{position:'absolute',left:`${c.start*0.15}%`,width:`${c.width*0.15}%`,top:'3px',bottom:'3px',background:`${c.color}18`,border:`1px solid ${c.color}40`,borderRadius:'4px',overflow:'hidden'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'1px',height:'100%',overflow:'hidden',padding:'3px 0'}}>
                    {Array.from({length:Math.min(Math.floor(c.width*0.18),60)},(_,i)=>(
                      <div key={i} style={{width:'2px',flexShrink:0,height:`${CLIP_WAVE[i%CLIP_WAVE.length]}%`,background:c.color,opacity:0.6,borderRadius:'1px'}}/>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{position:'absolute',left:`${playheadPct}%`,top:0,bottom:0,width:'1.5px',background:'var(--yellow)',opacity:0.9,zIndex:5,pointerEvents:'none'}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{height:activeTab?'240px':0,overflow:'hidden',transition:'height 0.3s cubic-bezier(0.16,1,0.3,1)',background:'#0D0D10',borderTop:activeTab?'1px solid var(--border)':'none',overflowY:activeTab?'auto':'hidden'}}>
        {activeTab==='videos' && (
          <div style={{padding:'14px'}}>
            <div style={{fontSize:'10px',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px'}}>MEDIA FILES</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              <button style={{aspectRatio:'1',borderRadius:'10px',border:'2px dashed var(--border)',background:'var(--bg-card)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',cursor:'pointer'}}>
                <span style={{fontSize:'22px',color:'var(--accent)'}}>+</span>
                <span style={{fontSize:'10px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>Add</span>
              </button>
              {['Strike_the_H','Thunder_Ben','Thunder_at','Overlay'].map((n,i)=>(
                <button key={i} onClick={()=>onImportMedia(`${n}.mp4`)}
                  style={{aspectRatio:'1',borderRadius:'10px',border:'1px solid var(--border)',background:'rgba(124,92,255,0.1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',cursor:'pointer'}}>
                  <span style={{fontSize:'20px'}}>🎬</span>
                  <span style={{fontSize:'8px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:600,textAlign:'center',padding:'0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab==='music' && (
          <div style={{padding:'14px'}}>
            <div style={{fontSize:'10px',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px'}}>MUSIC LIBRARY</div>
            <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
              {MUSIC_TRACKS_DATA.map(t=>(
                <div key={t.id} onClick={()=>onImportTrack(t)}
                  style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px',borderRadius:'10px',background:`${t.accent}0d`,border:`1px solid ${t.accent}25`,cursor:'pointer'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'8px',background:`${t.accent}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:'16px'}}>🎵</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'12px',fontWeight:700,fontFamily:'Syne,sans-serif',color:'var(--text-primary)'}}>{t.title}</div>
                    <div style={{fontSize:'10px',color:'var(--text-secondary)'}}>{t.artist} · {t.bpm} BPM</div>
                  </div>
                  <button style={{width:'28px',height:'28px',borderRadius:'50%',background:t.accent,border:'none',color:'white',fontSize:'12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab==='titles' && (
          <div style={{padding:'14px'}}>
            <div style={{fontSize:'10px',letterSpacing:'1.5px',fontFamily:'Syne,sans-serif',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px'}}>TEXT & TITLES</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {[{n:'Lower Third',i:'▬',c:'#7C5CFF'},{n:'Title Card',i:'≡',c:'#00E5FF'},{n:'Subtitle',i:'—',c:'#FF3B82'},{n:'End Screen',i:'⏹',c:'#00FF94'},{n:'Name Tag',i:'👤',c:'#FF8C00'},{n:'Animated',i:'✨',c:'#FFD60A'}].map((p,i)=>(
                <button key={i} style={{padding:'12px 6px',borderRadius:'10px',border:`1px solid ${p.c}28`,background:`${p.c}0d`,display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',cursor:'pointer'}}>
                  <span style={{fontSize:'18px'}}>{p.i}</span>
                  <span style={{fontSize:'9px',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',fontWeight:600,textAlign:'center'}}>{p.n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom tabs */}
      <div style={{flexShrink:0,background:'#0A0A0C',borderTop:'1px solid var(--border)',display:'flex',paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
        {TABS.map(tab=>{
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(p => p === tab.id ? null : tab.id)}
              style={{flex:1,border:'none',cursor:'pointer',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',padding:'10px 4px 12px',color:active?'var(--accent)':'var(--text-secondary)',transition:'color 0.2s',position:'relative'}}>
              {active && <div style={{position:'absolute',top:0,left:'15%',right:'15%',height:'2px',background:'var(--accent)',borderRadius:'0 0 2px 2px'}}/>}
              <span style={{fontSize:'20px'}}>{tab.icon}</span>
              <span style={{fontSize:'9px',fontFamily:'Syne,sans-serif',fontWeight:600,textAlign:'center',lineHeight:1.2}}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)}/>}
      {notification && (
        <div style={{position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',zIndex:2000,padding:'9px 18px',borderRadius:'9px',background:'var(--bg-card)',border:'1px solid var(--accent)',fontSize:'12px',fontFamily:'Syne,sans-serif',fontWeight:600,color:'var(--accent)',boxShadow:'0 8px 30px rgba(0,0,0,0.5)',whiteSpace:'nowrap',animation:'fadeInUp 0.3s ease'}}>
          ✓ {notification}
        </div>
      )}
    </div>
  );
}
