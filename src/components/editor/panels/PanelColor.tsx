'use client';
import React, { memo, useState } from 'react';
import { COLOR_CONTROLS, LUT_PRESETS } from '@/types/editor';

function PanelColor() {
  const [section, setSection] = useState<string[]>(['basic']);
  const [lut, setLut] = useState('');
  const [vals, setVals] = useState(COLOR_CONTROLS.map(c => c.def));
  const toggle = (s: string) => setSection(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const SectionHeader = ({id, label}: {id: string; label: string}) => (
    <div onClick={()=>toggle(id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',cursor:'pointer',marginBottom:'6px'}}>
      <span style={{fontSize:'10px',letterSpacing:'2px',color:section.includes(id)?'var(--accent)':'var(--text-muted)',fontFamily:'Syne,sans-serif',fontWeight:700}}>{label}</span>
      <span style={{color:'var(--text-muted)',fontSize:'10px'}}>{section.includes(id)?'▲':'▼'}</span>
    </div>
  );

  return (
    <div>
      <SectionHeader id="basic" label="BASIC CORRECTION"/>
      {section.includes('basic')&&(
        <div style={{marginBottom:'12px'}}>
          {COLOR_CONTROLS.map((c,i)=>(
            <div key={c.label} style={{marginBottom:'9px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                <span style={{fontSize:'11px',color:'var(--text-secondary)',fontFamily:'Syne,sans-serif'}}>{c.label}</span>
                <span style={{fontSize:'11px',color:c.color,fontFamily:'monospace'}}>{vals[i]>0?'+':''}{vals[i]}</span>
              </div>
              <input type="range" min={c.min} max={c.max} step={c.step} value={vals[i]} onChange={e=>{const n=[...vals];n[i]=Number(e.target.value);setVals(n);}} style={{width:'100%',accentColor:c.color,height:'3px',cursor:'pointer'}}/>
            </div>
          ))}
        </div>
      )}

      <SectionHeader id="creative" label="CREATIVE (LUTs)"/>
      {section.includes('creative')&&(
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'8px'}}>
            {LUT_PRESETS.map(g=>(
              <button key={g} onClick={()=>setLut(p=>p===g?'':g)} style={{padding:'3px 8px',borderRadius:'5px',fontSize:'10px',fontFamily:'Syne,sans-serif',cursor:'pointer',background:lut===g?'var(--accent-dim)':'var(--bg-secondary)',border:`1px solid ${lut===g?'var(--accent)':'var(--border)'}`,color:lut===g?'var(--accent)':'var(--text-secondary)',transition:'all 0.15s'}}>{g}</button>
            ))}
          </div>
          <div style={{marginBottom:'6px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Intensity</span><span style={{fontSize:'11px',color:'var(--accent)',fontFamily:'monospace'}}>100%</span></div>
            <input type="range" min={0} max={100} defaultValue={100} style={{width:'100%',accentColor:'var(--accent)',height:'3px'}}/>
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'var(--text-secondary)'}}>Faded Film</span><span style={{fontSize:'11px',color:'#888899',fontFamily:'monospace'}}>0</span></div>
            <input type="range" min={0} max={100} defaultValue={0} style={{width:'100%',accentColor:'#888899',height:'3px'}}/>
          </div>
        </div>
      )}

      <SectionHeader id="curves" label="CURVES"/>
      {section.includes('curves')&&(
        <div style={{marginBottom:'12px'}}>
          <div style={{width:'100%',height:'120px',background:'#0A0A0E',border:'1px solid var(--border)',borderRadius:'8px',position:'relative',overflow:'hidden',cursor:'crosshair',marginBottom:'6px'}}>
            {[25,50,75].map(p=>(
              <div key={p}>
                <div style={{position:'absolute',left:`${p}%`,top:0,bottom:0,width:'1px',background:'rgba(255,255,255,0.04)'}}/>
                <div style={{position:'absolute',top:`${p}%`,left:0,right:0,height:'1px',background:'rgba(255,255,255,0.04)'}}/>
              </div>
            ))}
            <svg width="100%" height="100%" style={{position:'absolute',inset:0}}>
              <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            </svg>
            <div style={{position:'absolute',bottom:'6px',left:'50%',transform:'translateX(-50%)',fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>Click to add points</div>
          </div>
          <div style={{display:'flex',gap:'4px'}}>
            {['M','R','G','B'].map((ch,i)=>(<button key={ch} style={{flex:1,padding:'3px',borderRadius:'4px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:['var(--text-secondary)','#FF5555','#55FF55','#5599FF'][i],fontSize:'10px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700}}>{ch}</button>))}
          </div>
        </div>
      )}

      <SectionHeader id="wheels" label="COLOR WHEELS"/>
      {section.includes('wheels')&&(
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex',gap:'8px',justifyContent:'space-between'}}>
            {['Shadows','Midtones','Highlights'].map((w,i)=>(
              <div key={w} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'50%',border:'2px solid var(--border)',background:'conic-gradient(#FF3B82,#FFD60A,#00FF94,#00E5FF,#7C5CFF,#FF3B82)',position:'relative',cursor:'crosshair',overflow:'hidden'}}>
                  <div style={{position:'absolute',inset:0,background:'radial-gradient(circle,rgba(0,0,0,0.7),transparent)'}}/>
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'white',boxShadow:'0 0 4px rgba(0,0,0,0.8)'}}/>
                  </div>
                </div>
                <span style={{fontSize:'9px',color:'var(--text-muted)',fontFamily:'Syne,sans-serif'}}>{w}</span>
                <input type="range" min={-1} max={1} step={0.01} defaultValue={0} style={{width:'100%',accentColor:['#7C5CFF','#888899','#FFFFFF'][i],height:'3px'}}/>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionHeader id="vignette" label="VIGNETTE"/>
      {section.includes('vignette')&&(
        <div style={{marginBottom:'12px'}}>
          {[{l:'Amount',def:0},{l:'Midpoint',def:50},{l:'Feather',def:50}].map(c=>(
            <div key={c.l} style={{marginBottom:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'var(--text-secondary)'}}>{c.l}</span><span style={{fontSize:'11px',color:'var(--text-secondary)',fontFamily:'monospace'}}>{c.def}</span></div>
              <input type="range" min={-100} max={100} defaultValue={c.def} style={{width:'100%',accentColor:'var(--text-muted)',height:'3px'}}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(PanelColor);
