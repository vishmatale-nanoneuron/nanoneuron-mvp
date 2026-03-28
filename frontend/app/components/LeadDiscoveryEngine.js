"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { apiFetch, API_BASE } from "../../lib/api";

// ─── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:"#07090F", surface:"#0F1120", surfaceHover:"#141728", sidebar:"#0B0D17",
  border:"rgba(255,255,255,0.06)", borderHover:"rgba(255,255,255,0.12)",
  blue:"#4F8EF7", teal:"#00D4AA", purple:"#A855F7", orange:"#FF8C42",
  green:"#00D97E", red:"#FF3B5C", yellow:"#FFD60A", pink:"#F472B6",
  textPrimary:"#E2E8F0", textMuted:"rgba(226,232,240,0.45)", textFaint:"rgba(226,232,240,0.18)",
};
const INDUSTRY_COLORS = {
  saas:T.blue, fintech:T.teal, ecommerce:T.orange, healthcare:T.green,
  cybersecurity:T.red, manufacturing:T.purple, legal:T.yellow,
  realestate:T.pink, logistics:"#60A5FA", education:"#34D399",
};
const INDUSTRY_ICONS = {
  saas:"☁️", fintech:"💳", ecommerce:"🛒", healthcare:"🏥",
  cybersecurity:"🛡️", manufacturing:"🏭", legal:"⚖️",
  realestate:"🏢", logistics:"🚚", education:"🎓",
};
const SIGNAL_COLORS = {
  series_a_funded:T.teal, series_b_funded:T.teal, recent_ipo:T.green,
  hiring_engineers:T.blue, hiring_sales:T.blue, expanding_globally:T.purple,
  new_product_launch:T.orange, acquisitions:T.yellow, tech_refresh:T.purple,
  digital_transformation:T.purple, cloud_migration:T.blue,
  ciso_hired:T.red, compliance_audit:T.orange, entering_new_market:T.teal,
  recent_rebrand:T.pink,
};

// ─── Debounce hook ─────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(()=>{ const t=setTimeout(()=>setDv(value),delay); return()=>clearTimeout(t); },[value,delay]);
  return dv;
}

// ─── Avatar ────────────────────────────────────────────────────────
function Avatar({ name, size=34, color=T.blue }) {
  const initials = name.split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",
      border:`1.5px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.38,fontWeight:700,color,flexShrink:0,letterSpacing:-0.5}}>
      {initials}
    </div>
  );
}

// ─── Score Ring ────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color = score>=80?T.red:score>=60?T.orange:T.textMuted;
  const label = score>=80?"HOT":score>=60?"WARM":"COLD";
  const icon = score>=80?"🔥":score>=60?"⚡":"❄️";
  return (
    <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:1}}>
      <div style={{width:42,height:42,borderRadius:"50%",background:color+"18",
        border:`2px solid ${color}60`,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",position:"relative"}}>
        <div style={{fontSize:9,fontWeight:700,color,lineHeight:1}}>{icon}</div>
        <div style={{fontSize:12,fontWeight:800,color,lineHeight:1.1}}>{score}</div>
      </div>
      <div style={{fontSize:8,fontWeight:700,color,letterSpacing:"0.05em"}}>{label}</div>
    </div>
  );
}

// ─── Intent Chip ──────────────────────────────────────────────────
function IntentChip({ signal, active, onClick }) {
  const label = signal.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const color = SIGNAL_COLORS[signal]||T.textMuted;
  return (
    <button onClick={onClick} style={{
      background:active?color+"25":"rgba(255,255,255,0.03)",
      border:`1px solid ${active?color:T.border}`,borderRadius:20,
      padding:"3px 8px",fontSize:10,fontWeight:600,color:active?color:T.textMuted,
      cursor:onClick?"pointer":"default",transition:"all 0.15s",whiteSpace:"nowrap",
    }}>
      {label}
    </button>
  );
}

// ─── Tech Badge ───────────────────────────────────────────────────
function TechBadge({ tech }) {
  return (
    <span style={{display:"inline-block",background:"rgba(255,255,255,0.04)",
      border:"1px solid rgba(255,255,255,0.08)",borderRadius:4,
      padding:"2px 7px",fontSize:10,color:T.textMuted,whiteSpace:"nowrap"}}>
      {tech}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const cfg = {high:{c:T.orange,l:"⚠️ GDPR High"},medium:{c:T.yellow,l:"🟡 Medium"},low:{c:T.green,l:"✅ Low"}};
  const {c,l} = cfg[risk]||cfg.medium;
  return <span style={{fontSize:9,color:c,background:c+"15",border:`1px solid ${c}30`,
    borderRadius:3,padding:"1px 5px",fontWeight:600}}>{l}</span>;
}

// ─── Skeleton Card ────────────────────────────────────────────────
function SkeletonCard() {
  const pulse = {background:"rgba(255,255,255,0.04)",borderRadius:4,animation:"pulse 1.5s ease-in-out infinite"};
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{...pulse,width:36,height:36,borderRadius:"50%"}}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{...pulse,height:14,width:"40%"}}/>
          <div style={{...pulse,height:11,width:"60%"}}/>
          <div style={{display:"flex",gap:6}}>{[1,2,3].map(i=><div key={i} style={{...pulse,height:18,width:70,borderRadius:20}}/>)}</div>
        </div>
        <div style={{...pulse,width:42,height:42,borderRadius:"50%"}}/>
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────
function FilterPanel({ filters, setFilters, onSearch, loading, signals, countries, resultCount, mobile, onClose }) {
  const inp = {background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:7,
    padding:"8px 10px",color:T.textPrimary,fontSize:12,width:"100%",outline:"none",transition:"border-color 0.15s"};
  const lbl = {display:"block",fontSize:10,color:T.textMuted,marginBottom:4,
    textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600};
  const F = filters;

  const INDUSTRIES = [
    {v:"",l:"All Industries"},
    {v:"saas",l:"☁️ SaaS"},{v:"fintech",l:"💳 Fintech"},{v:"ecommerce",l:"🛒 E-Commerce"},
    {v:"healthcare",l:"🏥 Healthcare"},{v:"cybersecurity",l:"🛡️ Cybersecurity"},
    {v:"manufacturing",l:"🏭 Manufacturing"},{v:"legal",l:"⚖️ Legal Tech"},
    {v:"realestate",l:"🏢 Real Estate"},{v:"logistics",l:"🚚 Logistics"},
    {v:"education",l:"🎓 EdTech"},
  ];
  const FUNDINGS = [
    {v:"",l:"Any Stage"},{v:"seed",l:"🌱 Seed"},{v:"series_a",l:"Series A"},
    {v:"series_b",l:"Series B+"},{v:"ipo",l:"📈 IPO/Public"},{v:"pe",l:"PE-backed"},
  ];
  const SENIORITIES = [{v:"",l:"All Levels"},{v:"C-Suite",l:"👑 C-Suite"},{v:"VP",l:"VP"},{v:"Director",l:"Director"},{v:"Manager",l:"Manager"}];
  const DEPTS = [{v:"",l:"All Departments"},{v:"Executive",l:"Executive"},{v:"Engineering",l:"Engineering"},
    {v:"Sales",l:"Sales"},{v:"Product",l:"Product"},{v:"Finance",l:"Finance"},
    {v:"Security",l:"Security"},{v:"Marketing",l:"Marketing"},{v:"Operations",l:"Operations"}];

  const TOP_SIGNALS = (signals||[]).slice(0,12);
  const activeIntents = (F.intent||"").split(",").filter(Boolean);

  return (
    <div style={{width:mobile?"100%":230,flexShrink:0,background:T.sidebar,
      borderRight:mobile?"none":`1px solid ${T.border}`,
      overflowY:"auto",padding:"16px 14px",display:"flex",flexDirection:"column",gap:12,
      ...(mobile?{height:"100%"}:{})}}>

      {mobile && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontWeight:700,fontSize:14,color:T.blue}}>⚡ Filters</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18}}>✕</button>
        </div>
      )}

      {/* Search */}
      <div>
        <div style={lbl}>🔍 Search</div>
        <input style={inp} placeholder="Company, city, tech…"
          value={F.q||""} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}
          onKeyDown={e=>e.key==="Enter"&&onSearch()}/>
      </div>

      {/* Industry */}
      <div>
        <div style={lbl}>Industry</div>
        <select style={inp} value={F.industry||""} onChange={e=>setFilters(f=>({...f,industry:e.target.value}))}>
          {INDUSTRIES.map(i=><option key={i.v} value={i.v}>{i.l}</option>)}
        </select>
      </div>

      {/* Country */}
      <div>
        <div style={lbl}>Country</div>
        <select style={inp} value={F.country||""} onChange={e=>setFilters(f=>({...f,country:e.target.value}))}>
          <option value="">🌍 All Countries</option>
          {(countries||[]).map(c=><option key={c.code} value={c.code}>{c.flag} {c.name} ({c.company_count})</option>)}
        </select>
      </div>

      {/* Funding */}
      <div>
        <div style={lbl}>Funding Stage</div>
        <select style={inp} value={F.funding||""} onChange={e=>setFilters(f=>({...f,funding:e.target.value}))}>
          {FUNDINGS.map(f=><option key={f.v} value={f.v}>{f.l}</option>)}
        </select>
      </div>

      {/* Tech */}
      <div>
        <div style={lbl}>Tech Stack</div>
        <input style={inp} placeholder="e.g. Salesforce, AWS…"
          value={F.tech||""} onChange={e=>setFilters(f=>({...f,tech:e.target.value}))}/>
      </div>

      {/* Seniority */}
      <div>
        <div style={lbl}>Seniority</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {SENIORITIES.map(s=>(
            <button key={s.v} onClick={()=>setFilters(f=>({...f,seniority:s.v}))}
              style={{flex:"1 0 auto",background:F.seniority===s.v?T.blue+"25":"rgba(255,255,255,0.03)",
                border:`1px solid ${F.seniority===s.v?T.blue:T.border}`,borderRadius:5,
                padding:"5px 4px",fontSize:10,color:F.seniority===s.v?T.blue:T.textMuted,cursor:"pointer"}}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* Department */}
      <div>
        <div style={lbl}>Department</div>
        <select style={inp} value={F.dept||""} onChange={e=>setFilters(f=>({...f,dept:e.target.value}))}>
          {DEPTS.map(d=><option key={d.v} value={d.v}>{d.l}</option>)}
        </select>
      </div>

      {/* Min Score */}
      <div>
        <div style={lbl}>Min Score: <span style={{color:T.blue,fontWeight:700}}>{F.min_score||0}</span></div>
        <input type="range" min={0} max={90} step={5}
          value={F.min_score||0} onChange={e=>setFilters(f=>({...f,min_score:parseInt(e.target.value)}))}
          style={{width:"100%",accentColor:T.blue}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.textFaint,marginTop:2}}>
          <span>0</span><span>45</span><span>90</span>
        </div>
      </div>

      {/* Intent Signals */}
      <div>
        <div style={lbl}>Intent Signals</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {TOP_SIGNALS.map(s=>{
            const active = activeIntents.includes(s.signal);
            return <IntentChip key={s.signal} signal={s.signal} active={active} onClick={()=>{
              const next = active ? activeIntents.filter(x=>x!==s.signal) : [...activeIntents,s.signal];
              setFilters(f=>({...f,intent:next.join(",")}));
            }}/>;
          })}
        </div>
      </div>

      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:4,display:"flex",flexDirection:"column",gap:6}}>
        <button onClick={onSearch} disabled={loading}
          style={{background:loading?"rgba(79,142,247,0.3)":T.blue,color:"#fff",border:"none",
            borderRadius:8,padding:"11px 0",fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer",
            transition:"all 0.15s",letterSpacing:"0.02em"}}>
          {loading?"⏳ Discovering…":"🔍 Discover Leads"}
        </button>
        {resultCount !== null && (
          <div style={{textAlign:"center",fontSize:11,color:T.teal,fontWeight:600}}>
            {resultCount} companies matched
          </div>
        )}
        <button onClick={()=>setFilters({})}
          style={{background:"transparent",color:T.textMuted,border:`1px solid ${T.border}`,
            borderRadius:7,padding:"8px 0",fontSize:11,cursor:"pointer"}}>
          ✕ Clear All Filters
        </button>
      </div>
    </div>
  );
}

// ─── Company Intelligence Drawer ───────────────────────────────────
function CompanyDrawer({ comp, onClose, onUnlock, onPipeline, selected, toggleSelect }) {
  const [detail, setDetail] = useState(null);
  const indColor = INDUSTRY_COLORS[comp.industry]||T.blue;

  useEffect(()=>{
    apiFetch(`/discovery/company/${comp.id}`).then(r=>setDetail(r.company)).catch(()=>{});
  },[comp.id]);

  const intel = detail?.intelligence||{};
  const contacts = detail?.contacts||comp.contacts||[];

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:420,
      background:T.surface,borderLeft:`1px solid ${T.border}`,
      zIndex:1000,display:"flex",flexDirection:"column",
      boxShadow:"-8px 0 32px rgba(0,0,0,0.5)",overflowY:"auto",
      animation:"slideInRight 0.25s ease-out"}}>

      {/* Drawer Header */}
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,
        background:T.sidebar,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Avatar name={comp.company} size={40} color={indColor}/>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:T.textPrimary}}>{comp.company}</div>
              <div style={{fontSize:11,color:T.textMuted}}>{comp.flag} {comp.city}, {comp.country_name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border}`,
            borderRadius:6,padding:"6px 10px",color:T.textMuted,cursor:"pointer",fontSize:12}}>✕ Close</button>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <span style={{background:indColor+"20",border:`1px solid ${indColor}40`,borderRadius:20,
            padding:"3px 10px",fontSize:11,color:indColor,fontWeight:600,textTransform:"capitalize"}}>
            {INDUSTRY_ICONS[comp.industry]} {comp.industry}
          </span>
          <RiskBadge risk={comp.compliance_risk}/>
        </div>
      </div>

      {/* Company Facts */}
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
        display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          ["👥 Employees",comp.employees],
          ["💰 Revenue",comp.revenue],
          ["🏦 Funding",comp.funding],
          ["📈 Growth",comp.growth],
          ["📅 Founded",comp.founded],
          ["🌐 Domain",comp.domain],
        ].map(([k,v])=>(
          <div key={k} style={{background:"rgba(255,255,255,0.02)",borderRadius:6,padding:"8px 10px"}}>
            <div style={{fontSize:9,color:T.textMuted,marginBottom:2}}>{k}</div>
            <div style={{fontSize:11,color:T.textPrimary,fontWeight:600}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Why Now Intelligence */}
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontWeight:700,fontSize:11,color:T.orange,marginBottom:8,
          textTransform:"uppercase",letterSpacing:"0.08em"}}>⚡ Why Reach Out Now</div>
        {(intel.why_now_detail||comp.intent?.map(i=>({signal:i,label:i.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()),reason:""}))||[]).map(w=>(
          <div key={w.signal} style={{marginBottom:8,padding:"8px 10px",
            background:"rgba(255,255,255,0.02)",borderRadius:6,
            borderLeft:`2px solid ${SIGNAL_COLORS[w.signal]||T.teal}`}}>
            <div style={{fontSize:11,fontWeight:600,color:SIGNAL_COLORS[w.signal]||T.teal}}>{w.label}</div>
            {w.reason && <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{w.reason}</div>}
          </div>
        ))}
        {intel.pitch_angle && (
          <div style={{marginTop:10,padding:"10px 12px",background:T.teal+"10",
            border:`1px solid ${T.teal}30`,borderRadius:8}}>
            <div style={{fontSize:9,color:T.teal,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>💡 Pitch Angle</div>
            <div style={{fontSize:11,color:T.textPrimary,lineHeight:1.5}}>{intel.pitch_angle}</div>
          </div>
        )}
      </div>

      {/* Tech Stack */}
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontWeight:700,fontSize:11,color:T.blue,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>🛠️ Tech Stack</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {comp.tech.map(t=><TechBadge key={t} tech={t}/>)}
        </div>
        {intel.outreach_tip && (
          <div style={{marginTop:10,padding:"8px 10px",background:"rgba(255,255,255,0.02)",
            borderRadius:6,fontSize:10,color:T.textMuted,fontStyle:"italic",lineHeight:1.5}}>
            💼 {intel.outreach_tip}
          </div>
        )}
      </div>

      {/* Contacts */}
      <div style={{padding:"14px 20px",flex:1}}>
        <div style={{fontWeight:700,fontSize:11,color:T.purple,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>
          👤 Contacts ({contacts.length})
        </div>
        {contacts.map((c,i)=>(
          <div key={i} style={{marginBottom:8,background:"rgba(255,255,255,0.02)",
            border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <Avatar name={c.name} size={32} color={c.score>=80?T.red:c.score>=60?T.orange:T.blue}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:12,color:T.textPrimary}}>{c.name}</div>
                <div style={{fontSize:10,color:T.textMuted}}>{c.title} · {c.dept}</div>
              </div>
              <ScoreRing score={c.score}/>
            </div>
            <div style={{fontSize:10,color:T.textFaint,fontFamily:"monospace",marginBottom:6}}>{c.email_masked}</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:10,color:T.teal}}>₹{c.potential_inr?.toLocaleString()}</span>
              <div style={{flex:1}}/>
              <button onClick={()=>onUnlock(comp,c)}
                style={{background:T.teal+"20",color:T.teal,border:`1px solid ${T.teal}50`,
                  borderRadius:6,padding:"4px 9px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                🔓 Unlock
              </button>
              <button onClick={()=>onPipeline(comp,c)}
                style={{background:T.blue+"20",color:T.blue,border:`1px solid ${T.blue}50`,
                  borderRadius:6,padding:"4px 9px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                + Pipeline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Market Map View ──────────────────────────────────────────────
function MarketMapView({ mapData, onCountryClick, selectedCountry }) {
  if(!mapData||!mapData.countries) return <div style={{padding:40,color:T.textMuted,textAlign:"center"}}>Loading map…</div>;
  const maxCount = Math.max(...mapData.countries.map(c=>c.total));

  return (
    <div style={{padding:"20px",overflowY:"auto",flex:1}}>
      <div style={{marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:16,color:T.textPrimary,marginBottom:4}}>🌍 Global Company Distribution</div>
        <div style={{fontSize:12,color:T.textMuted}}>{mapData.total_companies} companies across {mapData.countries.length} countries</div>
      </div>

      {/* Country Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
        {mapData.countries.map(c=>{
          const intensity = c.total/maxCount;
          const isSelected = selectedCountry===c.country;
          const meta = c.meta||{};
          return (
            <div key={c.country} onClick={()=>onCountryClick(c.country===selectedCountry?"":c.country)}
              style={{background:isSelected?T.blue+"20":T.surface,
                border:`1px solid ${isSelected?T.blue:T.border}`,
                borderRadius:10,padding:"12px 14px",cursor:"pointer",
                transition:"all 0.2s",
                boxShadow:isSelected?`0 0 12px ${T.blue}30`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontSize:22}}>{meta.flag||"🌐"}</span>
                <span style={{fontSize:11,fontWeight:700,color:T.teal}}>{c.total}</span>
              </div>
              <div style={{fontWeight:600,fontSize:11,color:T.textPrimary,marginBottom:2}}>{meta.name||c.country}</div>
              <div style={{fontSize:9,color:T.textMuted,marginBottom:6}}>{c.hot_leads} hot leads</div>
              {/* Industry mini-bars */}
              <div style={{display:"flex",gap:2,height:4,borderRadius:2,overflow:"hidden"}}>
                {Object.entries(c.by_industry||{}).slice(0,6).map(([ind,cnt])=>(
                  <div key={ind} style={{flex:cnt,background:INDUSTRY_COLORS[ind]||T.textFaint,
                    opacity:0.7+(cnt/c.total)*0.3}}/>
                ))}
              </div>
              {/* Intensity bar */}
              <div style={{marginTop:6,height:2,background:`rgba(255,255,255,0.05)`,borderRadius:1}}>
                <div style={{height:"100%",borderRadius:1,width:`${intensity*100}%`,
                  background:`linear-gradient(90deg,${T.blue},${T.teal})`}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Industry Legend */}
      <div style={{marginTop:24,borderTop:`1px solid ${T.border}`,paddingTop:16}}>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>Industry Color Map</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {Object.entries(INDUSTRY_COLORS).map(([ind,color])=>(
            <span key={ind} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:T.textMuted}}>
              <span style={{width:10,height:10,borderRadius:2,background:color,display:"inline-block"}}/>
              {INDUSTRY_ICONS[ind]} {ind}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────
function SummaryBar({ summary, results, sortBy, setSortBy }) {
  if(!summary) return null;
  const cards = [
    {l:"Companies",v:results.length,c:T.textPrimary},
    {l:"Contacts",v:summary.contacts,c:T.blue},
    {l:"🔥 Hot",v:summary.hot_leads,c:T.red},
    {l:"Countries",v:summary.countries,c:T.purple},
    {l:"Industries",v:summary.industries,c:T.teal},
    {l:"₹ Potential",v:`₹${((summary.total_potential_inr||0)/100000).toFixed(1)}L`,c:T.teal},
  ];
  return (
    <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,
      display:"flex",alignItems:"center",gap:8,flexShrink:0,overflowX:"auto"}}>
      {cards.map(c=>(
        <div key={c.l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,
          padding:"6px 12px",flexShrink:0,textAlign:"center",minWidth:70}}>
          <div style={{fontSize:14,fontWeight:700,color:c.c}}>{c.v}</div>
          <div style={{fontSize:9,color:T.textMuted,marginTop:1,textTransform:"uppercase",letterSpacing:"0.05em"}}>{c.l}</div>
        </div>
      ))}
      <div style={{flex:1}}/>
      <div style={{display:"flex",gap:4,flexShrink:0}}>
        {[["score","⚡ Score"],["potential","₹ Potential"],["contacts","👥 Contacts"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSortBy(v)}
            style={{background:sortBy===v?T.blue+"25":"rgba(255,255,255,0.03)",
              color:sortBy===v?T.blue:T.textMuted,border:`1px solid ${sortBy===v?T.blue:T.border}`,
              borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Company Row (compact list view) ─────────────────────────────
function CompanyRow({ comp, onSelect, isSelected, onOpen, onPipeline, onUnlock }) {
  const indColor = INDUSTRY_COLORS[comp.industry]||T.blue;
  return (
    <div onClick={()=>onOpen(comp)}
      style={{background:isSelected?T.blue+"08":T.surface,
        border:`1px solid ${isSelected?T.blue+"50":T.border}`,
        borderRadius:10,padding:"12px 14px",cursor:"pointer",
        transition:"all 0.15s",display:"flex",gap:12,alignItems:"center",
        ":hover":{background:T.surfaceHover}}}>

      {/* Select checkbox */}
      <div onClick={e=>{e.stopPropagation();onSelect(comp.id);}}
        style={{width:16,height:16,borderRadius:4,flexShrink:0,
          background:isSelected?T.blue:"rgba(255,255,255,0.04)",
          border:`1.5px solid ${isSelected?T.blue:T.border}`,
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        {isSelected && <div style={{width:8,height:8,background:"#fff",borderRadius:1}}/>}
      </div>

      {/* Flag */}
      <div style={{flexShrink:0,textAlign:"center",width:32}}>
        <div style={{fontSize:20}}>{comp.flag}</div>
        <div style={{fontSize:8,color:T.textMuted}}>{comp.country}</div>
      </div>

      {/* Company info */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
          <span style={{fontWeight:700,fontSize:13,color:T.textPrimary}}>{comp.company}</span>
          <span style={{fontSize:10,color:T.textMuted}}>{comp.domain}</span>
          <span style={{background:indColor+"20",color:indColor,border:`1px solid ${indColor}40`,
            borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700,textTransform:"capitalize"}}>
            {INDUSTRY_ICONS[comp.industry]} {comp.industry}
          </span>
        </div>
        <div style={{display:"flex",gap:12,fontSize:11,color:T.textMuted,marginBottom:4,flexWrap:"wrap"}}>
          <span>📍 {comp.city}</span>
          <span>👥 {comp.employees}</span>
          <span>💰 {comp.revenue}</span>
          <span style={{color:T.teal}}>🏦 {comp.funding?.split(" — ")[0]}</span>
          <span style={{color:T.green}}>📈 {comp.growth}</span>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {comp.intent.slice(0,3).map(s=><IntentChip key={s} signal={s}/>)}
          {comp.intent.length>3&&<span style={{fontSize:10,color:T.textFaint}}>+{comp.intent.length-3}</span>}
        </div>
      </div>

      {/* Right panel */}
      <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
        <ScoreRing score={comp.top_score}/>
        <div style={{fontSize:10,color:T.textMuted}}>{comp.contact_count} contacts</div>
        <RiskBadge risk={comp.compliance_risk}/>
      </div>

      {/* Action buttons */}
      <div style={{flexShrink:0,display:"flex",flexDirection:"column",gap:4}} onClick={e=>e.stopPropagation()}>
        <button onClick={()=>onOpen(comp)}
          style={{background:T.blue+"20",color:T.blue,border:`1px solid ${T.blue}40`,
            borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
          View →
        </button>
        <button onClick={()=>{
          if(comp.contacts[0]) onPipeline(comp, comp.contacts[0]);
        }} style={{background:"rgba(255,255,255,0.04)",color:T.textMuted,border:`1px solid ${T.border}`,
          borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
          + Pipeline
        </button>
      </div>
    </div>
  );
}

// ─── Company Grid Card ────────────────────────────────────────────
function CompanyGrid({ comp, onOpen, isSelected, onSelect }) {
  const indColor = INDUSTRY_COLORS[comp.industry]||T.blue;
  return (
    <div onClick={()=>onOpen(comp)}
      style={{background:T.surface,border:`1px solid ${isSelected?T.blue+"60":T.border}`,
        borderRadius:12,padding:"16px",cursor:"pointer",transition:"all 0.2s",
        display:"flex",flexDirection:"column",gap:10,
        boxShadow:isSelected?`0 0 16px ${T.blue}20`:"none"}}>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:26}}>{comp.flag}</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.textPrimary,lineHeight:1.3}}>{comp.company}</div>
            <div style={{fontSize:10,color:T.textMuted}}>{comp.city}</div>
          </div>
        </div>
        <div onClick={e=>{e.stopPropagation();onSelect(comp.id);}}
          style={{width:14,height:14,borderRadius:3,
            background:isSelected?T.blue:"rgba(255,255,255,0.04)",
            border:`1.5px solid ${isSelected?T.blue:T.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
          {isSelected&&<div style={{width:7,height:7,background:"#fff",borderRadius:1}}/>}
        </div>
      </div>

      <div style={{background:indColor+"15",border:`1px solid ${indColor}30`,borderRadius:6,
        padding:"4px 8px",fontSize:10,color:indColor,fontWeight:700,textTransform:"capitalize",
        alignSelf:"flex-start"}}>
        {INDUSTRY_ICONS[comp.industry]} {comp.industry}
      </div>

      <div style={{fontSize:10,color:T.textMuted,lineHeight:1.6}}>
        <div>💰 {comp.revenue} · 👥 {comp.employees}</div>
        <div style={{color:T.teal}}>🏦 {comp.funding?.split(" — ")[0]}</div>
        <div style={{color:T.green}}>📈 {comp.growth}</div>
      </div>

      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
        {comp.intent.slice(0,2).map(s=><IntentChip key={s} signal={s}/>)}
      </div>

      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {comp.tech.slice(0,3).map(t=><TechBadge key={t} tech={t}/>)}
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        borderTop:`1px solid ${T.border}`,paddingTop:8,marginTop:2}}>
        <div>
          <span style={{fontSize:9,color:T.textMuted}}>TOP SCORE</span>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <ScoreRing score={comp.top_score}/>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:T.teal,fontWeight:600}}>₹{(comp.total_potential_inr||0).toLocaleString()}</div>
          <div style={{fontSize:9,color:T.textMuted}}>{comp.contact_count} contacts</div>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────
function BulkBar({ selected, results, onClearSelect, onBulkPipeline }) {
  if(selected.size===0) return null;
  const companies = results.filter(r=>selected.has(r.id));
  const totalContacts = companies.reduce((s,c)=>s+c.contact_count,0);
  return (
    <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",
      background:T.surface,border:`1px solid ${T.blue}60`,borderRadius:12,
      padding:"12px 20px",display:"flex",alignItems:"center",gap:12,
      boxShadow:`0 4px 24px rgba(79,142,247,0.25)`,zIndex:500,
      animation:"slideUpFade 0.2s ease-out"}}>
      <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>
        {selected.size} companies selected · {totalContacts} contacts
      </div>
      <button onClick={onBulkPipeline}
        style={{background:T.blue,color:"#fff",border:"none",borderRadius:7,
          padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
        + Add All to Pipeline
      </button>
      <button onClick={onClearSelect}
        style={{background:"rgba(255,255,255,0.06)",color:T.textMuted,border:`1px solid ${T.border}`,
          borderRadius:7,padding:"7px 10px",fontSize:12,cursor:"pointer"}}>
        ✕ Deselect
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function LeadDiscoveryEngine() {
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState([]);
  const [countries, setCountries] = useState([]);
  const [stats, setStats] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [view, setView] = useState("list"); // list | grid | map
  const [sortBy, setSortBy] = useState("score");
  const [drawerComp, setDrawerComp] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false); // mobile toggle
  const [page, setPage] = useState(0);
  const didMount = useRef(false);
  const debouncedQ = useDebounce(filters.q||"", 400);
  const PAGE_SIZE = 30;

  // Auto-search on debounced text
  useEffect(()=>{
    if(!didMount.current) return;
    doSearch();
  },[debouncedQ]);

  // Mount: load meta + initial search
  useEffect(()=>{
    if(didMount.current) return; didMount.current=true;
    Promise.all([
      apiFetch("/discovery/intent-signals"),
      apiFetch("/discovery/countries"),
      apiFetch("/discovery/stats"),
      apiFetch("/discovery/market-map"),
    ]).then(([s,c,st,mm])=>{
      setSignals(s.signals||[]);
      setCountries(c.countries||[]);
      setStats(st);
      setMapData(mm);
    }).catch(()=>{});
    doSearch();
  },[]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handler = (e)=>{
      if(e.key==="Escape") { setDrawerComp(null); setSelected(new Set()); }
      if(e.key==="/" && e.target.tagName!=="INPUT") {
        e.preventDefault();
        document.querySelector("input[placeholder*='Company']")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  },[]);

  async function doSearch() {
    setLoading(true); setMsg(""); setPage(0);
    try {
      const params = new URLSearchParams();
      if(filters.q) params.set("q",filters.q);
      if(filters.industry) params.set("industry",filters.industry);
      if(filters.country) params.set("country",filters.country);
      if(filters.funding) params.set("funding",filters.funding);
      if(filters.seniority) params.set("seniority",filters.seniority);
      if(filters.dept) params.set("dept",filters.dept);
      if(filters.intent) params.set("intent",filters.intent);
      if(filters.tech) params.set("tech",filters.tech);
      if(filters.min_score) params.set("min_score",filters.min_score);
      params.set("limit","200");
      const data = await apiFetch("/discovery/leads?"+params.toString());
      setResults(data.data||[]);
      setSummary(data.summary||null);
    } catch(e) { showMsg("Failed to load leads. Check backend.", "error"); }
    setLoading(false);
  }

  function showMsg(text, type="success") {
    setMsg(text); setMsgType(type);
    setTimeout(()=>setMsg(""), 4000);
  }

  async function handleUnlock(comp, contact) {
    try {
      const r = await apiFetch("/search/unlock",{method:"POST",body:JSON.stringify({
        company_domain:comp.domain, contact_name:contact.name,
      })});
      if(r.success) showMsg(`✅ Unlocked ${contact.name} — ${r.lead?.email||"Email sent to your inbox"}`);
      else showMsg("⚠️ "+r.detail, "error");
    } catch(e) { showMsg("⚠️ Need credits to unlock email.", "error"); }
  }

  async function handlePipeline(comp, contact) {
    try {
      const r = await apiFetch("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
        company_name:comp.company, contact_name:contact.name,
        contact_email:contact.first?.toLowerCase()+"."+contact.last?.toLowerCase()+"@"+comp.domain,
        contact_title:contact.title, country:comp.country, deal_value:0,
      })});
      if(r.success) showMsg(`📋 ${contact.name} added to pipeline!`);
    } catch(e) { showMsg("Error adding to pipeline.", "error"); }
  }

  async function handleBulkPipeline() {
    const selComps = results.filter(r=>selected.has(r.id));
    let count=0;
    for(const comp of selComps) {
      const c = comp.contacts[0];
      if(c) {
        try {
          await apiFetch("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
            company_name:comp.company, contact_name:c.name,
            contact_email:c.first?.toLowerCase()+"."+c.last?.toLowerCase()+"@"+comp.domain,
            contact_title:c.title, country:comp.country, deal_value:0,
          })});
          count++;
        } catch(e){}
      }
    }
    setSelected(new Set());
    showMsg(`📋 Added ${count} leads to pipeline!`);
  }

  function toggleSelect(id) {
    setSelected(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  const sorted = useMemo(()=>[...results].sort((a,b)=>{
    if(sortBy==="potential") return b.total_potential_inr-a.total_potential_inr;
    if(sortBy==="contacts") return b.contact_count-a.contact_count;
    return b.top_score-a.top_score;
  }),[results,sortBy]);

  const paginated = sorted.slice(0, (page+1)*PAGE_SIZE);
  const hasMore = paginated.length < sorted.length;

  const exportUrl = useMemo(()=>{
    const p = new URLSearchParams();
    if(filters.industry) p.set("industry",filters.industry);
    if(filters.country) p.set("country",filters.country);
    if(filters.intent) p.set("intent",filters.intent);
    if(filters.min_score) p.set("min_score",filters.min_score);
    return `${API_BASE}/api/discovery/export-csv?${p.toString()}`;
  },[filters]);

  const activeFilterCount = [filters.industry,filters.country,filters.funding,filters.seniority,
    filters.dept,filters.intent,filters.tech,filters.min_score].filter(Boolean).length;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg,position:"relative"}}>

      {/* CSS animations */}
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes slideUpFade{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .discovery-row:hover{background:#141728!important;}
        .action-btn:hover{opacity:0.85;}
      `}</style>

      {/* ── Header ── */}
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,
        display:"flex",alignItems:"center",gap:12,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${T.blue},${T.teal})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:T.textPrimary,letterSpacing:"-0.02em"}}>
              Global Lead Discovery
            </div>
            <div style={{fontSize:10,color:T.textMuted}}>
              {stats?`${stats.total_companies} companies · ${stats.total_contacts} contacts · ${stats.total_countries} countries`:"Loading…"}
            </div>
          </div>
        </div>

        <div style={{flex:1}}/>

        {/* View toggle */}
        <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:2,gap:2}}>
          {[["list","☰ List"],["grid","⊞ Grid"],["map","🌍 Map"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{background:view===v?T.blue:"transparent",color:view===v?"#fff":T.textMuted,
                border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",
                transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Mobile filter toggle */}
        <button onClick={()=>setShowFilters(true)}
          style={{display:"none",background:"rgba(255,255,255,0.06)",color:T.textMuted,
            border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 10px",fontSize:12,cursor:"pointer",
            position:"relative"}}
          className="mobile-filter-btn">
          ⚙️ Filters{activeFilterCount>0&&<span style={{position:"absolute",top:-4,right:-4,
            background:T.red,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,
            display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{activeFilterCount}</span>}
        </button>

        {/* Export CSV */}
        <a href={exportUrl} target="_blank" rel="noreferrer"
          style={{background:"rgba(255,255,255,0.04)",color:T.textMuted,border:`1px solid ${T.border}`,
            borderRadius:7,padding:"6px 11px",fontSize:11,textDecoration:"none",
            display:"inline-flex",alignItems:"center",gap:4,fontWeight:600,whiteSpace:"nowrap"}}>
          ⬇️ Export CSV
        </a>

        {/* Keyboard hint */}
        <span style={{fontSize:10,color:T.textFaint,background:"rgba(255,255,255,0.03)",
          border:`1px solid ${T.border}`,borderRadius:4,padding:"3px 7px"}}>
          / to search · Esc to close
        </span>
      </div>

      {/* ── Message Flash ── */}
      {msg && (
        <div style={{padding:"8px 20px",background:msgType==="error"?T.red+"18":T.teal+"18",
          borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.textPrimary,flexShrink:0,
          display:"flex",justifyContent:"space-between",alignItems:"center",animation:"fadeIn 0.2s"}}>
          {msg}
          <button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer"}}>✕</button>
        </div>
      )}

      {/* ── Summary Bar ── */}
      {view!=="map" && <SummaryBar summary={summary} results={results} sortBy={sortBy} setSortBy={setSortBy}/>}

      {/* ── Body ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Filter Sidebar (desktop always visible, mobile drawer) */}
        {view!=="map" && (
          <div style={{display:"flex",flexShrink:0}}>
            <FilterPanel
              filters={filters} setFilters={setFilters}
              onSearch={doSearch} loading={loading}
              signals={signals} countries={countries}
              resultCount={results.length!==0?results.length:null}
            />
          </div>
        )}

        {/* Main area */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

          {/* Map View */}
          {view==="map" && (
            <MarketMapView mapData={mapData} selectedCountry={filters.country||""}
              onCountryClick={cc=>{ setFilters(f=>({...f,country:cc})); if(cc) { setTimeout(()=>{ setView("list"); doSearch(); },100); } }}/>
          )}

          {/* List / Grid View */}
          {view!=="map" && (
            <div style={{flex:1,overflowY:"auto",padding:12}}>

              {/* Loading skeletons */}
              {loading && (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[1,2,3,4,5].map(i=><SkeletonCard key={i}/>)}
                </div>
              )}

              {/* Empty state */}
              {!loading && results.length===0 && (
                <div style={{textAlign:"center",padding:"60px 20px",color:T.textMuted}}>
                  <div style={{fontSize:48,marginBottom:16}}>🌍</div>
                  <div style={{fontSize:16,fontWeight:600,marginBottom:8,color:T.textPrimary}}>No leads found</div>
                  <div style={{fontSize:13}}>Try relaxing your filters or search a different industry.</div>
                </div>
              )}

              {/* Grid layout */}
              {!loading && view==="grid" && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
                  {paginated.map(comp=>(
                    <CompanyGrid key={comp.id} comp={comp}
                      isSelected={selected.has(comp.id)}
                      onSelect={toggleSelect}
                      onOpen={c=>setDrawerComp(c)}/>
                  ))}
                </div>
              )}

              {/* List layout */}
              {!loading && view==="list" && (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {paginated.map(comp=>(
                    <CompanyRow key={comp.id} comp={comp}
                      isSelected={selected.has(comp.id)}
                      onSelect={toggleSelect}
                      onOpen={c=>setDrawerComp(c)}
                      onPipeline={handlePipeline}
                      onUnlock={handleUnlock}/>
                  ))}
                </div>
              )}

              {/* Load more */}
              {!loading && hasMore && (
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <button onClick={()=>setPage(p=>p+1)}
                    style={{background:T.surface,color:T.blue,border:`1px solid ${T.blue}40`,
                      borderRadius:8,padding:"10px 24px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    Load more ({sorted.length-paginated.length} remaining)
                  </button>
                </div>
              )}

              {/* Footer */}
              {!loading && results.length>0 && (
                <div style={{textAlign:"center",padding:"16px 0 32px",fontSize:10,color:T.textFaint}}>
                  Showing {paginated.length} of {results.length} companies · {summary?.contacts||0} contacts
                  {selected.size>0 && ` · ${selected.size} selected`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Company Intelligence Drawer ── */}
      {drawerComp && (
        <>
          <div onClick={()=>setDrawerComp(null)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999}}/>
          <CompanyDrawer
            comp={drawerComp}
            onClose={()=>setDrawerComp(null)}
            onUnlock={handleUnlock}
            onPipeline={handlePipeline}
            selected={selected}
            toggleSelect={toggleSelect}
          />
        </>
      )}

      {/* ── Bulk Action Bar ── */}
      <BulkBar
        selected={selected}
        results={results}
        onClearSelect={()=>setSelected(new Set())}
        onBulkPipeline={handleBulkPipeline}
      />
    </div>
  );
}
