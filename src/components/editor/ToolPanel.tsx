'use client';
import { useEditorStore } from '@/store/editorStore';
import { TOOLS } from '@/types/editor';

export default function ToolPanel() {
  const activeTool    = useEditorStore(s => s.activeTool);
  const setActiveTool = useEditorStore(s => s.setActiveTool);

  return (
    <div style={{width:'42px',flexShrink:0,background:'var(--bg-secondary)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 0',gap:'1px',zIndex:40}}>
      {TOOLS.map((tool,idx)=>{
        const showDivider = idx > 0 && tool.group !== TOOLS[idx-1].group;
        return (
          <div key={tool.id} style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
            {showDivider && <div style={{width:'24px',height:'1px',background:'var(--border)',margin:'3px 0'}}/>}
            <button
              title={`${tool.label} (${tool.key})`}
              onClick={() => setActiveTool(tool.id)}
              style={{width:'32px',height:'32px',borderRadius:'6px',border:'none',background:activeTool===tool.id?'var(--accent)':'transparent',color:activeTool===tool.id?'white':'var(--text-secondary)',fontSize:'13px',cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',boxShadow:activeTool===tool.id?'0 0 10px var(--accent-glow)':'none'}}
              onMouseEnter={e=>{if(activeTool!==tool.id){e.currentTarget.style.background='var(--bg-hover)';e.currentTarget.style.color='var(--text-primary)';}}}
              onMouseLeave={e=>{if(activeTool!==tool.id){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-secondary)';}}}
            >{tool.icon}</button>
          </div>
        );
      })}
      <div style={{flex:1}}/>
      {(['📤','🔗','📝','?'] as const).map((ic,i)=>(
        <button key={i} title={['Send to Encoder','Link/Unlink','Notes','Help'][i]} style={{width:'32px',height:'32px',borderRadius:'6px',border:'none',background:'transparent',color:'var(--text-muted)',fontSize:'12px',cursor:'pointer',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.color='var(--text-secondary)';}}
          onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';}}
        >{ic}</button>
      ))}
    </div>
  );
}
