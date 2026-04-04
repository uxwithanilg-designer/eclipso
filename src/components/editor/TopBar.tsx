'use client';
import Link from 'next/link';
import { useEditorStore } from '@/store/editorStore';
import { WORKSPACES } from '@/types/editor';

export default function TopBar() {
  const workspace    = useEditorStore(s => s.workspace);
  const leftTab      = useEditorStore(s => s.leftTab);
  const setWorkspace = useEditorStore(s => s.setWorkspace);
  const setLeftTab   = useEditorStore(s => s.setLeftTab);
  const setShowExport= useEditorStore(s => s.setShowExport);

  return (
    <div style={{height:'38px',flexShrink:0,background:'var(--bg-tertiary)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 14px',gap:'0',zIndex:50}}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:'6px',textDecoration:'none',marginRight:'18px'}}>
        <div style={{width:'20px',height:'20px',borderRadius:'4px',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,fontFamily:'Syne,sans-serif',color:'white',boxShadow:'0 0 10px var(--accent-glow)'}}>E</div>
        <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'12px',letterSpacing:'1px',color:'var(--text-primary)'}}>ECLIPSO</span>
      </Link>
      {['File','Edit','Clip','Sequence','Markers','Graphics','View','Window','Help'].map(m=>{
        const isWindow = m === 'Window';
        return (
          <button key={m} onClick={isWindow ? () => setLeftTab('history') : undefined}
            style={{padding:'0 8px',height:'100%',background:'none',border:'none',color:isWindow&&leftTab==='history'?'var(--accent)':'var(--text-secondary)',fontSize:'11px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',transition:'all 0.15s',whiteSpace:'nowrap'}}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';e.currentTarget.style.color=isWindow&&leftTab==='history'?'var(--accent)':'var(--text-primary)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color=isWindow&&leftTab==='history'?'var(--accent)':'var(--text-secondary)';}}
          >{m}{isWindow&&leftTab==='history'?' ●':''}</button>
        );
      })}
      <div style={{flex:1,textAlign:'center'}}>
        <span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Strike_the_Heavens</span>
        <span style={{fontSize:'10px',color:'var(--accent)',marginLeft:'6px'}}>● Edited</span>
      </div>
      <div style={{display:'flex',gap:'2px',background:'var(--bg-secondary)',borderRadius:'6px',padding:'2px',border:'1px solid var(--border)',marginRight:'10px'}}>
        {WORKSPACES.map(w=>(
          <button key={w.id} onClick={()=>setWorkspace(w.id)} style={{padding:'3px 8px',borderRadius:'4px',border:'none',background:workspace===w.id?'var(--accent)':'transparent',color:workspace===w.id?'white':'var(--text-muted)',fontSize:'10px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,transition:'all 0.15s',whiteSpace:'nowrap'}}>{w.label}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
        <button style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'14px'}}>🔔</button>
        <button style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'13px'}}>⚙</button>
        <button onClick={()=>setShowExport(true)} style={{background:'var(--accent)',border:'none',color:'white',padding:'4px 12px',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontFamily:'Syne,sans-serif',fontWeight:700,boxShadow:'0 0 10px var(--accent-glow)'}}>Export</button>
      </div>
    </div>
  );
}
