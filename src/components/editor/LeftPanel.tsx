'use client';
import { memo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { LEFT_TABS, ProjectFile } from '@/types/editor';
import PanelMedia from './panels/PanelMedia';
import PanelLibrary from './panels/PanelLibrary';
import PanelEffects from './panels/PanelEffects';
import PanelTransitions from './panels/PanelTransitions';
import PanelColor from './panels/PanelColor';
import PanelSound from './panels/PanelSound';
import PanelMixer from './panels/PanelMixer';
import PanelCaptions from './panels/PanelCaptions';
import PanelAI from './panels/PanelAI';
import PanelMarkers, { HistoryPanel } from './panels/PanelMarkers';

interface Props {
  onUploadClick: () => void;
  onDragStartItem: (e: React.DragEvent, item: any) => void;
  onDoubleClickItem: (item: any) => void;
  onImportMedia: (f: ProjectFile | string) => void;
  onImportTrack: (t: any) => void;
}

function LeftPanel({ onUploadClick, onDragStartItem, onDoubleClickItem, onImportMedia, onImportTrack }: Props) {
  const leftTab        = useEditorStore(s => s.leftTab);
  const setLeftTab     = useEditorStore(s => s.setLeftTab);
  const projectFiles   = useEditorStore(s => s.projectFiles);
  const markers        = useEditorStore(s => s.markers);
  const past           = useEditorStore(s => s.past);
  const present        = useEditorStore(s => s.present);
  const future         = useEditorStore(s => s.future);
  const setPlayheadPos = useEditorStore(s => s.setPlayheadPos);
  const jumpToHistory  = useEditorStore(s => s.jumpToHistory);

  return (
    <div style={{width:'260px',flexShrink:0,background:'var(--bg-secondary)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',zIndex:30}}>
      {/* Tab icons */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',overflowX:'auto',background:'var(--bg-tertiary)',flexShrink:0}}>
        {LEFT_TABS.map(tab => (
          <button key={tab.id} onClick={() => setLeftTab(tab.id)} title={tab.label}
            style={{flexShrink:0,width:'42px',padding:'7px 0',border:'none',background:'transparent',
              borderBottom:`2px solid ${leftTab===tab.id?'var(--accent)':'transparent'}`,cursor:'pointer',
              transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',gap:'1px',position:'relative'}}
            onMouseEnter={e=>{if(leftTab!==tab.id)e.currentTarget.style.background='var(--bg-hover)';}}
            onMouseLeave={e=>{if(leftTab!==tab.id)e.currentTarget.style.background='transparent';}}
          >
            <span style={{fontSize:'14px'}}>{tab.icon}</span>
            {tab.badge && (
              <div style={{position:'absolute',top:'3px',right:'3px',background:'var(--accent)',color:'white',
                fontSize:'7px',borderRadius:'4px',padding:'0 3px',fontFamily:'Syne,sans-serif',fontWeight:700,
                lineHeight:'12px',minWidth:'12px',textAlign:'center'}}>
                {tab.badge}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tab label */}
      <div style={{padding:'7px 12px',borderBottom:'1px solid var(--border)',background:'var(--bg-tertiary)',flexShrink:0}}>
        <span style={{fontSize:'9px',letterSpacing:'2px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>
          {LEFT_TABS.find(t => t.id === leftTab)?.label.toUpperCase()}
        </span>
      </div>

      {/* Panel content */}
      <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
        {leftTab==='media'       && <PanelMedia files={projectFiles} onUploadClick={onUploadClick} onImport={onImportMedia} onDragStartItem={onDragStartItem} onDoubleClickItem={onDoubleClickItem}/>}
        {leftTab==='library'     && <PanelLibrary onImport={onImportTrack} onDragStartItem={onDragStartItem}/>}
        {leftTab==='effects'     && <PanelEffects/>}
        {leftTab==='transitions' && <PanelTransitions/>}
        {leftTab==='color'       && <PanelColor/>}
        {leftTab==='sound'       && <PanelSound/>}
        {leftTab==='mixer'       && <PanelMixer/>}
        {leftTab==='captions'    && <PanelCaptions/>}
        {leftTab==='ai'          && <PanelAI/>}
        {leftTab==='markers'     && <PanelMarkers markers={markers} past={past} present={present} future={future} onJump={t=>setPlayheadPos(t/120*100)} onJumpToHistory={jumpToHistory}/>}
        {leftTab==='history'     && <HistoryPanel past={past} present={present} future={future} onJumpTo={jumpToHistory}/>}
      </div>
    </div>
  );
}

export default memo(LeftPanel);
