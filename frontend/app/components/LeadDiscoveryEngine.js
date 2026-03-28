"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { apiFetch, API_BASE } from "../../lib/api";

// ─── Tokens ───────────────────────────────────────────────────────
const T = {
  bg:"#07090F", surface:"#0D0F1A", card:"#111422", sidebar:"#0A0C14",
  border:"rgba(255,255,255,0.07)", borderFocus:"rgba(79,142,247,0.5)",
  blue:"#4F8EF7", teal:"#00D4AA", purple:"#A855F7", orange:"#F97316",
  green:"#10B981", red:"#EF4444", yellow:"#EAB308", pink:"#EC4899",
  text:"#E2E8F0", muted:"rgba(226,232,240,0.5)", faint:"rgba(226,232,240,0.2)",
};

const IND_COLOR = {
  saas:T.blue, fintech:T.teal, ecommerce:T.orange, healthcare:T.green,
  cybersecurity:T.red, manufacturing:T.purple, legal:T.yellow,
  realestate:T.pink, logistics:"#60A5FA", education:"#34D399",
};
const IND_ICON = {
  saas:"☁️", fintech:"💳", ecommerce:"🛒", healthcare:"🏥",
  cybersecurity:"🛡️", manufacturing:"⚙️", legal:"⚖️",
  realestate:"🏢", logistics:"🚚", education:"🎓",
};
const SIG_COLOR = {
  series_a_funded:T.teal, series_b_funded:T.teal, recent_ipo:T.green,
  hiring_engineers:T.blue, hiring_sales:T.blue, expanding_globally:T.purple,
  new_product_launch:T.orange, acquisitions:T.yellow, tech_refresh:T.purple,
  digital_transformation:T.purple, cloud_migration:T.blue,
  ciso_hired:T.red, compliance_audit:T.orange, entering_new_market:T.teal,
  recent_rebrand:T.pink,
};
const SIG_WHY = {
  hiring_engineers:"Scaling engineering team — high tech budget right now",
  series_a_funded:"Fresh capital deployed — tools budget is active",
  series_b_funded:"Series B raised — aggressively building operations",
  expanding_globally:"Entering new markets — needs global-ready vendors",
  new_product_launch:"Active launch cycle — buying window is open",
  recent_ipo:"Post-IPO compliance & tooling needs are spiking",
  acquisitions:"M&A integration creates new software requirements",
  tech_refresh:"Legacy replacement underway — evaluating new vendors",
  hiring_sales:"Growing revenue team — CRM & enablement in demand",
  entering_new_market:"New market entry — compliance & localisation needed",
  ciso_hired:"New CISO = full security stack review in 90 days",
  digital_transformation:"Large DX budget — multi-year initiative",
  cloud_migration:"Cloud move underway — security & monitoring needed",
  compliance_audit:"Compliance project active — GRC tools in demand",
  recent_rebrand:"Rebrand signals leadership change — new vendor decisions",
};

// ─── Debounce ─────────────────────────────────────────────────────
function useDebouncedValue(v, ms) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

// ─── Tooltip ──────────────────────────────────────────────────────
function Tip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative",display:"inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && text && (
        <span style={{ position:"absolute",bottom:"calc(100% + 6px)",left:"50%",
          transform:"translateX(-50%)",background:"#1a1d2e",border:`1px solid ${T.border}`,
          borderRadius:6,padding:"5px 9px",fontSize:10,color:T.text,whiteSpace:"nowrap",
          zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,0.4)",pointerEvents:"none" }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────
function ScoreBadge({ score, size="md" }) {
  const color = score >= 80 ? T.red : score >= 65 ? T.orange : T.muted;
  const label = score >= 80 ? "HOT" : score >= 65 ? "WARM" : "COLD";
  const icon  = score >= 80 ? "🔥" : score >= 65 ? "⚡" : "❄️";
  const sz = size === "lg" ? { outer:52, fs:15, fs2:9 } : { outer:40, fs:13, fs2:8 };
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
      <div style={{ width:sz.outer,height:sz.outer,borderRadius:"50%",
        background:`conic-gradient(${color} ${score}%, rgba(255,255,255,0.05) 0)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 0 10px ${color}40`,position:"relative" }}>
        <div style={{ width:sz.outer-8,height:sz.outer-8,borderRadius:"50%",
          background:T.card,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:1 }}>
          <span style={{ fontSize:sz.fs2+1 }}>{icon}</span>
          <span style={{ fontSize:sz.fs-1,fontWeight:800,color,lineHeight:1 }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize:sz.fs2,fontWeight:700,color,letterSpacing:"0.06em" }}>{label}</span>
    </div>
  );
}

// ─── Intent Pill ──────────────────────────────────────────────────
function IntentPill({ signal, active, onClick }) {
  const c = SIG_COLOR[signal] || T.muted;
  const lbl = signal.replace(/_/g," ").replace(/\b\w/g, x => x.toUpperCase());
  return (
    <Tip text={SIG_WHY[signal]}>
      <button onClick={onClick} style={{
        background: active ? c+"28" : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? c+"80" : T.border}`,
        borderRadius: 20, padding:"3px 9px", fontSize:10, fontWeight:600,
        color: active ? c : T.muted, cursor: onClick ? "pointer" : "default",
        transition:"all 0.15s", whiteSpace:"nowrap",
      }}>{lbl}</button>
    </Tip>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({ name, size=36, color=T.blue, shape="circle" }) {
  const init = (name||"").split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size,height:size,borderRadius:shape==="circle"?"50%":8,
      background:`linear-gradient(135deg,${color}30,${color}15)`,
      border:`1.5px solid ${color}50`,display:"flex",alignItems:"center",
      justifyContent:"center",fontSize:size*0.37,fontWeight:700,color,flexShrink:0 }}>
      {init}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
function Skel({ w="100%", h=12, r=4 }) {
  return <div style={{ width:w,height:h,borderRadius:r,
    background:"rgba(255,255,255,0.05)",animation:"pulse 1.4s ease-in-out infinite" }}/>;
}
function SkeletonRow() {
  return (
    <div style={{ padding:"14px 16px",borderBottom:`1px solid ${T.border}` }}>
      <div style={{ display:"flex",gap:10,alignItems:"center" }}>
        <Skel w={34} h={34} r={6}/>
        <div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}>
          <Skel w="50%" h={12}/><Skel w="70%" h={10}/>
          <div style={{ display:"flex",gap:5 }}><Skel w={55} h={18} r={20}/><Skel w={55} h={18} r={20}/></div>
        </div>
        <Skel w={40} h={40} r={20}/>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────
function FilterBar({ filters, setFilters, onSearch, loading, signals, countries }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchRef = useRef();
  const F = filters;
  const activeIntents = (F.intent||"").split(",").filter(Boolean);

  const INDS = [
    {v:"saas",l:"☁️ SaaS"},{v:"fintech",l:"💳 Fintech"},{v:"ecommerce",l:"🛒 E-Commerce"},
    {v:"healthcare",l:"🏥 Healthcare"},{v:"cybersecurity",l:"🛡️ Cyber"},
    {v:"manufacturing",l:"⚙️ Manufacturing"},{v:"legal",l:"⚖️ Legal"},
    {v:"realestate",l:"🏢 Real Estate"},{v:"logistics",l:"🚚 Logistics"},
    {v:"education",l:"🎓 EdTech"},
  ];
  const FUNDS = [
    {v:"seed",l:"🌱 Seed"},{v:"series_a",l:"Series A"},{v:"series_b",l:"Series B+"},
    {v:"ipo",l:"📈 IPO/Public"},{v:"pe",l:"🏦 PE-backed"},
  ];

  const activeCount = [F.industry,F.country,F.funding,F.seniority,F.tech,F.intent,F.min_score&&F.min_score>0?F.min_score:null].filter(Boolean).length;

  return (
    <div style={{ background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"12px 16px",flexShrink:0 }}>
      {/* Row 1: Search + advanced toggle */}
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <div style={{ flex:1,position:"relative" }}>
          <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none",opacity:0.4 }}>🔍</span>
          <input ref={searchRef} value={F.q||""} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}
            onKeyDown={e=>e.key==="Enter"&&onSearch()}
            placeholder="Search companies, city, tech stack…"
            style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
              borderRadius:8,padding:"9px 12px 9px 34px",color:T.text,fontSize:13,outline:"none",
              transition:"border-color 0.15s",boxSizing:"border-box" }}/>
        </div>
        <button onClick={()=>setShowAdvanced(v=>!v)} style={{
          background: showAdvanced ? T.blue+"25" : "rgba(255,255,255,0.05)",
          border:`1px solid ${showAdvanced ? T.blue+"80" : T.border}`,
          borderRadius:8,padding:"9px 14px",color: showAdvanced ? T.blue : T.muted,
          fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5 }}>
          ⚙ Filters {activeCount>0&&<span style={{ background:T.red,color:"#fff",borderRadius:"50%",
            width:16,height:16,fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{activeCount}</span>}
        </button>
        <button onClick={onSearch} disabled={loading} style={{
          background: loading ? T.blue+"40" : `linear-gradient(135deg,${T.blue},${T.teal})`,
          border:"none",borderRadius:8,padding:"9px 18px",color:"#fff",
          fontSize:12,fontWeight:700,cursor:loading?"not-allowed":"pointer",whiteSpace:"nowrap" }}>
          {loading?"Searching…":"Discover"}
        </button>
      </div>

      {/* Industry quick chips */}
      <div style={{ display:"flex",gap:5,marginTop:9,flexWrap:"wrap" }}>
        {INDS.map(ind=>(
          <button key={ind.v} onClick={()=>{setFilters(f=>({...f,industry:f.industry===ind.v?"":ind.v}));}}
            style={{ background:F.industry===ind.v?IND_COLOR[ind.v]+"25":"rgba(255,255,255,0.03)",
              border:`1px solid ${F.industry===ind.v?IND_COLOR[ind.v]+"70":T.border}`,
              borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600,
              color:F.industry===ind.v?IND_COLOR[ind.v]:T.muted,cursor:"pointer",transition:"all 0.15s" }}>
            {ind.l}
          </button>
        ))}
        {(F.country||F.funding||F.seniority||F.tech||F.intent) && (
          <button onClick={()=>setFilters({})} style={{ background:"rgba(239,68,68,0.1)",
            border:`1px solid ${T.red}50`,borderRadius:20,padding:"4px 10px",
            fontSize:11,fontWeight:600,color:T.red,cursor:"pointer" }}>✕ Clear</button>
        )}
      </div>

      {/* Advanced panel */}
      {showAdvanced && (
        <div style={{ marginTop:12,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,
          borderTop:`1px solid ${T.border}`,paddingTop:12 }}>
          {/* Country */}
          <div>
            <div style={{ fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>Country</div>
            <select value={F.country||""} onChange={e=>setFilters(f=>({...f,country:e.target.value}))}
              style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,
                borderRadius:6,padding:"7px 8px",color:T.text,fontSize:12,outline:"none" }}>
              <option value="">🌍 All Countries</option>
              {(countries||[]).map(c=><option key={c.code} value={c.code}>{c.flag} {c.name} ({c.company_count})</option>)}
            </select>
          </div>
          {/* Funding */}
          <div>
            <div style={{ fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>Funding Stage</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
              {FUNDS.map(f=>(
                <button key={f.v} onClick={()=>setFilters(fp=>({...fp,funding:fp.funding===f.v?"":f.v}))}
                  style={{ background:F.funding===f.v?T.teal+"25":"rgba(255,255,255,0.03)",
                    border:`1px solid ${F.funding===f.v?T.teal+"70":T.border}`,
                    borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:600,
                    color:F.funding===f.v?T.teal:T.muted,cursor:"pointer" }}>{f.l}</button>
              ))}
            </div>
          </div>
          {/* Seniority */}
          <div>
            <div style={{ fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>Seniority</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
              {["C-Suite","VP","Director"].map(s=>(
                <button key={s} onClick={()=>setFilters(f=>({...f,seniority:f.seniority===s?"":s}))}
                  style={{ background:F.seniority===s?T.purple+"25":"rgba(255,255,255,0.03)",
                    border:`1px solid ${F.seniority===s?T.purple+"70":T.border}`,
                    borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:600,
                    color:F.seniority===s?T.purple:T.muted,cursor:"pointer" }}>{s}</button>
              ))}
            </div>
          </div>
          {/* Tech */}
          <div>
            <div style={{ fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>Tech Stack</div>
            <input value={F.tech||""} onChange={e=>setFilters(f=>({...f,tech:e.target.value}))}
              placeholder="e.g. Salesforce, AWS…"
              style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,
                borderRadius:6,padding:"7px 8px",color:T.text,fontSize:12,outline:"none",boxSizing:"border-box" }}/>
          </div>
          {/* Min Score */}
          <div>
            <div style={{ fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em" }}>
              Min Score: <span style={{ color:T.blue,fontWeight:700 }}>{F.min_score||0}</span>
            </div>
            <input type="range" min={0} max={90} step={5} value={F.min_score||0}
              onChange={e=>setFilters(f=>({...f,min_score:parseInt(e.target.value)}))}
              style={{ width:"100%",accentColor:T.blue }}/>
          </div>
          {/* Intent signals */}
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ fontSize:10,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em" }}>Intent Signals (hover for why it matters)</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
              {(signals||[]).slice(0,14).map(s=>(
                <IntentPill key={s.signal} signal={s.signal}
                  active={activeIntents.includes(s.signal)}
                  onClick={()=>{
                    const next = activeIntents.includes(s.signal)
                      ? activeIntents.filter(x=>x!==s.signal)
                      : [...activeIntents,s.signal];
                    setFilters(f=>({...f,intent:next.join(",")}));
                  }}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Company List Row ─────────────────────────────────────────────
function CompanyRow({ comp, isActive, onClick, isSelected, onToggleSelect }) {
  const c = IND_COLOR[comp.industry] || T.blue;
  return (
    <div onClick={onClick} style={{
      padding:"12px 14px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start",
      borderBottom:`1px solid ${T.border}`,
      background: isActive ? T.blue+"12" : "transparent",
      borderLeft: `3px solid ${isActive ? T.blue : "transparent"}`,
      transition:"background 0.12s,border-color 0.12s",
    }}>
      {/* Checkbox */}
      <div onClick={e=>{e.stopPropagation();onToggleSelect();}}
        style={{ width:15,height:15,marginTop:2,borderRadius:4,flexShrink:0,
          background:isSelected?T.blue:"transparent",border:`1.5px solid ${isSelected?T.blue:T.border}`,
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
        {isSelected&&<span style={{ color:"#fff",fontSize:9,fontWeight:900 }}>✓</span>}
      </div>
      {/* Flag */}
      <span style={{ fontSize:18,flexShrink:0,marginTop:1 }}>{comp.flag||"🌐"}</span>
      {/* Info */}
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
          <span style={{ fontWeight:700,fontSize:13,color:T.text,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{comp.company}</span>
          <span style={{ background:c+"20",color:c,border:`1px solid ${c}40`,
            borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:700,
            textTransform:"capitalize",flexShrink:0 }}>
            {IND_ICON[comp.industry]}{comp.industry}
          </span>
        </div>
        <div style={{ fontSize:11,color:T.muted,marginBottom:4 }}>
          {comp.city} · {comp.employees} · {comp.revenue}
        </div>
        <div style={{ display:"flex",gap:3,flexWrap:"nowrap",overflow:"hidden" }}>
          {comp.intent.slice(0,2).map(s=>(
            <span key={s} style={{ background:(SIG_COLOR[s]||T.muted)+"18",
              border:`1px solid ${(SIG_COLOR[s]||T.muted)+"40"}`,borderRadius:20,
              padding:"2px 6px",fontSize:9,fontWeight:600,color:SIG_COLOR[s]||T.muted,whiteSpace:"nowrap" }}>
              {s.replace(/_/g," ")}
            </span>
          ))}
          {comp.intent.length>2&&<span style={{ fontSize:9,color:T.faint }}>+{comp.intent.length-2}</span>}
        </div>
      </div>
      {/* Score */}
      <ScoreBadge score={comp.top_score}/>
    </div>
  );
}

// ─── Company Detail Panel ─────────────────────────────────────────
function CompanyDetail({ comp, onUnlock, onPipeline, onMsg }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const c = IND_COLOR[comp.industry] || T.blue;

  useEffect(()=>{
    setDetail(null); setLoading(true);
    apiFetch(`/discovery/company/${comp.id}`)
      .then(r=>{ setDetail(r.company); setLoading(false); })
      .catch(()=>setLoading(false));
  },[comp.id]);

  const intel = detail?.intelligence || {};
  const contacts = detail?.contacts || comp.contacts || [];
  const countryMeta = detail?.country_meta || {};

  return (
    <div style={{ flex:1,overflowY:"auto",background:T.bg }}>
      {/* Hero */}
      <div style={{ padding:"20px 24px",borderBottom:`1px solid ${T.border}`,
        background:`linear-gradient(135deg,${c}08 0%,transparent 60%)` }}>
        <div style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
          <Avatar name={comp.company} size={52} color={c} shape="rounded"/>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontWeight:800,fontSize:20,color:T.text,marginBottom:2 }}>{comp.company}</div>
            <div style={{ fontSize:12,color:T.muted,marginBottom:6 }}>
              {comp.flag} {comp.city}, {comp.country_name} · {comp.domain}
            </div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              <span style={{ background:c+"20",color:c,border:`1px solid ${c}50`,borderRadius:20,
                padding:"3px 10px",fontSize:11,fontWeight:700,textTransform:"capitalize" }}>
                {IND_ICON[comp.industry]} {comp.industry}
              </span>
              <span style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,
                padding:"3px 10px",fontSize:11,color:T.muted }}>
                📅 Founded {comp.founded}
              </span>
              <span style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,
                padding:"3px 10px",fontSize:11,color:T.muted }}>
                👥 {comp.employees}
              </span>
            </div>
          </div>
          <ScoreBadge score={comp.top_score} size="lg"/>
        </div>

        {/* KPI row */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:14 }}>
          {[
            ["💰 Revenue",comp.revenue,T.teal],
            ["🏦 Funding",comp.funding?.split("—")[0]?.trim(),T.blue],
            ["📈 Growth",comp.growth,T.green],
          ].map(([k,v,col])=>(
            <div key={k} style={{ background:T.surface,border:`1px solid ${T.border}`,
              borderRadius:8,padding:"8px 10px" }}>
              <div style={{ fontSize:9,color:T.muted,marginBottom:2 }}>{k}</div>
              <div style={{ fontSize:12,fontWeight:700,color:col||T.text }}>{v||"—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Now */}
      <div style={{ padding:"16px 24px",borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.orange,textTransform:"uppercase",
          letterSpacing:"0.1em",marginBottom:10 }}>⚡ Why Reach Out Now</div>
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          {(intel.why_now_detail || comp.intent.map(i=>({signal:i,label:i.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase()),reason:SIG_WHY[i]||""}))).map(w=>(
            <div key={w.signal} style={{ display:"flex",gap:10,alignItems:"flex-start",
              padding:"8px 10px",background:T.surface,borderRadius:8,
              borderLeft:`3px solid ${SIG_COLOR[w.signal]||T.teal}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11,fontWeight:700,color:SIG_COLOR[w.signal]||T.teal,marginBottom:2 }}>{w.label}</div>
                {w.reason&&<div style={{ fontSize:10,color:T.muted,lineHeight:1.5 }}>{w.reason}</div>}
              </div>
            </div>
          ))}
        </div>
        {intel.pitch_angle&&(
          <div style={{ marginTop:10,padding:"10px 12px",background:T.teal+"10",
            border:`1px solid ${T.teal}30`,borderRadius:8 }}>
            <div style={{ fontSize:9,color:T.teal,fontWeight:700,marginBottom:4,textTransform:"uppercase" }}>💡 Suggested Pitch</div>
            <div style={{ fontSize:11,color:T.text,lineHeight:1.6 }}>{intel.pitch_angle}</div>
          </div>
        )}
      </div>

      {/* Tech Stack */}
      <div style={{ padding:"14px 24px",borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.blue,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>🛠️ Tech Stack</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
          {comp.tech.map(t=>(
            <span key={t} style={{ background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
              borderRadius:5,padding:"3px 9px",fontSize:11,color:T.muted }}>{t}</span>
          ))}
        </div>
        {intel.outreach_tip&&(
          <div style={{ marginTop:8,padding:"8px 10px",background:"rgba(255,255,255,0.02)",
            borderRadius:6,fontSize:10,color:T.muted,fontStyle:"italic",lineHeight:1.5,
            borderLeft:`2px solid ${T.border}` }}>
            💼 {intel.outreach_tip}
          </div>
        )}
      </div>

      {/* Contacts */}
      <div style={{ padding:"14px 24px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <div style={{ fontSize:10,fontWeight:700,color:T.purple,textTransform:"uppercase",letterSpacing:"0.1em" }}>
            👤 Key Contacts ({contacts.length})
          </div>
          <div style={{ fontSize:11,color:T.teal,fontWeight:600 }}>
            ₹{((detail?.total_potential_inr||comp.total_potential_inr||0)/1000).toFixed(0)}K potential
          </div>
        </div>
        {loading ? (
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {[1,2,3].map(i=><div key={i} style={{ height:70,borderRadius:8,
              background:"rgba(255,255,255,0.04)",animation:"pulse 1.4s ease-in-out infinite" }}/>)}
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {contacts.map((ct,i)=>{
              const sc = ct.score||ct.score_base||75;
              const cc = sc>=80?T.red:sc>=65?T.orange:T.muted;
              const lbl = sc>=80?"HOT":sc>=65?"WARM":"COLD";
              return (
                <div key={i} style={{ background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center" }}>
                  <Avatar name={ct.name} size={36} color={cc}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:13,color:T.text }}>{ct.name}</div>
                    <div style={{ fontSize:11,color:T.muted }}>{ct.title} · {ct.dept}</div>
                    <div style={{ fontSize:10,color:T.faint,fontFamily:"monospace",marginTop:2 }}>{ct.email_masked}</div>
                  </div>
                  <div style={{ textAlign:"center",flexShrink:0 }}>
                    <div style={{ fontSize:16,fontWeight:800,color:cc }}>{sc}</div>
                    <div style={{ fontSize:9,fontWeight:700,color:cc }}>{lbl}</div>
                    <div style={{ fontSize:9,color:T.teal,marginTop:1 }}>₹{((ct.potential_inr||0)/1000).toFixed(0)}K</div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                    <button onClick={()=>onUnlock(comp,ct)}
                      style={{ background:T.teal+"20",color:T.teal,border:`1px solid ${T.teal}50`,
                        borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                      🔓 Unlock
                    </button>
                    <button onClick={()=>onPipeline(comp,ct)}
                      style={{ background:T.blue+"20",color:T.blue,border:`1px solid ${T.blue}50`,
                        borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                      + Pipeline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compliance footer */}
      {(countryMeta.compliance||comp.compliance) && (
        <div style={{ margin:"0 24px 24px",padding:"10px 12px",
          background:"rgba(255,255,255,0.02)",border:`1px solid ${T.border}`,borderRadius:8 }}>
          <div style={{ fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>
            📋 Compliance Note
          </div>
          <div style={{ fontSize:11,color:T.muted }}>
            <strong style={{ color:T.text }}>{countryMeta.compliance||comp.compliance}</strong>
            {" — "}{countryMeta.risk==="high"?"High GDPR risk region. Obtain explicit consent before cold outreach.":"Standard compliance rules apply."}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats Header ─────────────────────────────────────────────────
function StatsHeader({ stats, results, summary, sortBy, setSortBy, viewMode, setViewMode, exportUrl }) {
  return (
    <div style={{ padding:"8px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,
      display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
      {/* Live counts */}
      <div style={{ display:"flex",gap:10,fontSize:12 }}>
        <span style={{ color:T.text,fontWeight:700 }}>{results.length}</span>
        <span style={{ color:T.muted }}>companies</span>
        {summary&&<><span style={{ color:T.blue,fontWeight:700 }}>{summary.contacts}</span><span style={{ color:T.muted }}>contacts</span></>}
        {summary&&summary.hot_leads>0&&<><span style={{ color:T.red,fontWeight:700 }}>🔥 {summary.hot_leads}</span><span style={{ color:T.muted }}>hot</span></>}
        {summary&&<><span style={{ color:T.teal,fontWeight:600 }}>₹{((summary.total_potential_inr||0)/100000).toFixed(1)}L</span><span style={{ color:T.muted }}>potential</span></>}
      </div>
      <div style={{ flex:1 }}/>
      {/* Sort */}
      <div style={{ display:"flex",gap:3 }}>
        {[["score","⚡ Score"],["potential","₹ Value"],["contacts","👥 Size"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSortBy(v)} style={{
            background:sortBy===v?T.blue+"25":"rgba(255,255,255,0.03)",
            color:sortBy===v?T.blue:T.muted,border:`1px solid ${sortBy===v?T.blue+"60":T.border}`,
            borderRadius:6,padding:"4px 9px",fontSize:10,fontWeight:600,cursor:"pointer" }}>{l}</button>
        ))}
      </div>
      {/* View */}
      <div style={{ display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:6,padding:2,gap:1 }}>
        {[["split","⫿"],["list","☰"],["grid","⊞"]].map(([v,l])=>(
          <button key={v} onClick={()=>setViewMode(v)} style={{
            background:viewMode===v?T.blue:"transparent",color:viewMode===v?"#fff":T.muted,
            border:"none",borderRadius:4,padding:"4px 8px",fontSize:12,cursor:"pointer",transition:"all 0.15s" }}>{l}</button>
        ))}
      </div>
      {/* Export */}
      <a href={exportUrl} target="_blank" rel="noreferrer" style={{
        background:"rgba(255,255,255,0.04)",color:T.muted,border:`1px solid ${T.border}`,
        borderRadius:6,padding:"5px 10px",fontSize:10,fontWeight:600,textDecoration:"none",
        display:"inline-flex",alignItems:"center",gap:3 }}>⬇️ CSV</a>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────
function GridCard({ comp, isActive, onClick, isSelected, onToggleSelect }) {
  const c = IND_COLOR[comp.industry]||T.blue;
  return (
    <div onClick={onClick} style={{ background:isActive?T.blue+"10":T.card,
      border:`1px solid ${isActive?T.blue+"60":T.border}`,borderRadius:12,padding:"14px",
      cursor:"pointer",transition:"all 0.18s",display:"flex",flexDirection:"column",gap:8,
      boxShadow:isActive?`0 0 0 2px ${T.blue}40`:"none" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <span style={{ fontSize:24 }}>{comp.flag||"🌐"}</span>
          <div>
            <div style={{ fontWeight:700,fontSize:12,color:T.text,lineHeight:1.3 }}>{comp.company}</div>
            <div style={{ fontSize:10,color:T.muted }}>{comp.city}</div>
          </div>
        </div>
        <div onClick={e=>{e.stopPropagation();onToggleSelect();}}
          style={{ width:14,height:14,borderRadius:3,flexShrink:0,
            background:isSelected?T.blue:"transparent",border:`1.5px solid ${isSelected?T.blue:T.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
          {isSelected&&<span style={{ color:"#fff",fontSize:8,fontWeight:900 }}>✓</span>}
        </div>
      </div>
      <div style={{ background:c+"18",border:`1px solid ${c}35`,borderRadius:20,
        padding:"3px 8px",fontSize:9,fontWeight:700,color:c,textTransform:"capitalize",alignSelf:"flex-start" }}>
        {IND_ICON[comp.industry]} {comp.industry}
      </div>
      <div style={{ fontSize:10,color:T.muted,lineHeight:1.7 }}>
        <div>💰 {comp.revenue}</div>
        <div style={{ color:T.teal }}>🏦 {comp.funding?.split("—")[0]?.trim()}</div>
        <div style={{ color:T.green }}>📈 {comp.growth}</div>
      </div>
      <div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>
        {comp.intent.slice(0,2).map(s=><IntentPill key={s} signal={s}/>)}
      </div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
        borderTop:`1px solid ${T.border}`,paddingTop:8,marginTop:2 }}>
        <ScoreBadge score={comp.top_score}/>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11,color:T.teal,fontWeight:600 }}>
            ₹{((comp.total_potential_inr||0)/1000).toFixed(0)}K
          </div>
          <div style={{ fontSize:9,color:T.muted }}>{comp.contact_count} contacts</div>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Bar ─────────────────────────────────────────────────────
function BulkBar({ count, total, onPipeline, onClear }) {
  if(!count) return null;
  return (
    <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:T.surface,border:`1px solid ${T.blue}60`,borderRadius:12,
      padding:"11px 20px",display:"flex",alignItems:"center",gap:12,
      boxShadow:`0 8px 32px rgba(0,0,0,0.6),0 0 0 1px ${T.blue}30`,zIndex:800 }}>
      <span style={{ fontSize:13,fontWeight:600,color:T.text }}>{count} selected</span>
      <button onClick={onPipeline} style={{ background:`linear-gradient(135deg,${T.blue},${T.teal})`,
        color:"#fff",border:"none",borderRadius:7,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer" }}>
        + Add All to Pipeline
      </button>
      <button onClick={onClear} style={{ background:"rgba(255,255,255,0.06)",color:T.muted,
        border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",fontSize:12,cursor:"pointer" }}>
        ✕
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyState({ hasFilters }) {
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:40,gap:12 }}>
      <div style={{ fontSize:56 }}>🌍</div>
      <div style={{ fontSize:16,fontWeight:700,color:T.text }}>
        {hasFilters?"No companies match your filters":"Start discovering leads"}
      </div>
      <div style={{ fontSize:13,color:T.muted,textAlign:"center",maxWidth:300 }}>
        {hasFilters?"Try relaxing your filters — remove the industry or country filter to see more results.":"Click Discover or select an industry to find your next customer."}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function LeadDiscoveryEngine() {
  const [filters, setFilters] = useState({});
  const [results, setResults]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [signals, setSignals]   = useState([]);
  const [countries, setCountries] = useState([]);
  const [stats, setStats]       = useState(null);
  const [active, setActive]     = useState(null); // selected company for detail
  const [selected, setSelected] = useState(new Set());
  const [sortBy, setSortBy]     = useState("score");
  const [viewMode, setViewMode] = useState("split"); // split | list | grid
  const [msg, setMsg]           = useState({ text:"", type:"ok" });
  const [page, setPage]         = useState(1);
  const debouncedQ = useDebouncedValue(filters.q||"", 380);
  const didMount = useRef(false);
  const PAGE = 40;

  // Mount
  useEffect(()=>{
    if(didMount.current) return; didMount.current=true;
    Promise.all([
      apiFetch("/discovery/intent-signals"),
      apiFetch("/discovery/countries"),
      apiFetch("/discovery/stats"),
    ]).then(([s,c,st])=>{
      setSignals(s.signals||[]);
      setCountries(c.countries||[]);
      setStats(st);
    }).catch(()=>{});
    doSearch();
  },[]);

  // Auto-search on debounced text
  useEffect(()=>{ if(didMount.current) doSearch(); },[debouncedQ]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h = e=>{
      if(e.key==="Escape") setActive(null);
      if(e.key==="/"&&document.activeElement.tagName!=="INPUT") {
        e.preventDefault();
        document.querySelector("input[placeholder*='Search']")?.focus();
      }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[]);

  async function doSearch() {
    setLoading(true); setPage(1);
    try {
      const p = new URLSearchParams({ limit:"200" });
      const F = filters;
      if(F.q) p.set("q",F.q);
      if(F.industry) p.set("industry",F.industry);
      if(F.country) p.set("country",F.country);
      if(F.funding) p.set("funding",F.funding);
      if(F.seniority) p.set("seniority",F.seniority);
      if(F.dept) p.set("dept",F.dept);
      if(F.intent) p.set("intent",F.intent);
      if(F.tech) p.set("tech",F.tech);
      if(F.min_score) p.set("min_score",F.min_score);
      const data = await apiFetch("/discovery/leads?"+p.toString());
      const rows = data.data||[];
      setResults(rows);
      setSummary(data.summary||null);
      if(rows.length>0 && (!active||!rows.find(r=>r.id===active?.id))) setActive(rows[0]);
    } catch(e) { flash("Failed to load leads. Check backend.","err"); }
    setLoading(false);
  }

  function flash(text, type="ok") {
    setMsg({text,type});
    setTimeout(()=>setMsg({text:"",type:"ok"}),4000);
  }

  async function handleUnlock(comp,ct) {
    try {
      const r = await apiFetch("/search/unlock",{method:"POST",body:JSON.stringify({
        company_domain:comp.domain, contact_name:ct.name,
      })});
      if(r.success) flash(`✅ Unlocked ${ct.name} — ${r.lead?.email||"Check inbox"}`);
      else flash("⚠️ "+r.detail,"err");
    } catch(e) { flash("⚠️ Need credits to unlock email.","err"); }
  }

  async function handlePipeline(comp,ct) {
    try {
      const r = await apiFetch("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
        company_name:comp.company, contact_name:ct.name||ct.first+" "+ct.last,
        contact_email:(ct.first||"").toLowerCase()+"."+(ct.last||"").toLowerCase()+"@"+comp.domain,
        contact_title:ct.title, country:comp.country, deal_value:0,
      })});
      if(r.success) flash(`📋 ${ct.name||ct.first+" "+ct.last} added to pipeline!`);
    } catch(e) { flash("Error adding to pipeline.","err"); }
  }

  async function bulkPipeline() {
    const sel = results.filter(r=>selected.has(r.id));
    let n=0;
    for(const comp of sel) {
      const ct=comp.contacts[0]; if(!ct) continue;
      try {
        await apiFetch("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
          company_name:comp.company, contact_name:ct.name||ct.first+" "+ct.last,
          contact_email:(ct.first||"").toLowerCase()+"."+(ct.last||"").toLowerCase()+"@"+comp.domain,
          contact_title:ct.title, country:comp.country, deal_value:0,
        })});
        n++;
      } catch(e){}
    }
    setSelected(new Set());
    flash(`📋 Added ${n} leads to pipeline!`);
  }

  const sorted = useMemo(()=>[...results].sort((a,b)=>{
    if(sortBy==="potential") return (b.total_potential_inr||0)-(a.total_potential_inr||0);
    if(sortBy==="contacts") return b.contact_count-a.contact_count;
    return b.top_score-a.top_score;
  }),[results,sortBy]);

  const paginated = sorted.slice(0,page*PAGE);
  const exportUrl = useMemo(()=>{
    const p = new URLSearchParams();
    if(filters.industry) p.set("industry",filters.industry);
    if(filters.country) p.set("country",filters.country);
    if(filters.intent) p.set("intent",filters.intent);
    if(filters.min_score) p.set("min_score",filters.min_score);
    return `${API_BASE}/api/discovery/export-csv?${p.toString()}`;
  },[filters]);

  const hasFilters = !!(filters.industry||filters.country||filters.funding||filters.seniority||filters.intent||filters.tech||filters.q);

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg,fontFamily:"inherit" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
      `}</style>

      {/* ── Top Header ── */}
      <div style={{ padding:"10px 18px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,
        display:"flex",alignItems:"center",gap:12,flexShrink:0 }}>
        <div style={{ width:28,height:28,borderRadius:7,
          background:`linear-gradient(135deg,${T.blue},${T.teal})`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>⚡</div>
        <div>
          <div style={{ fontWeight:800,fontSize:14,color:T.text,letterSpacing:"-0.02em" }}>Lead Discovery Engine</div>
          <div style={{ fontSize:10,color:T.muted }}>
            {stats?`${stats.total_companies} companies · ${stats.total_contacts} contacts · ${stats.total_countries} countries · 10 industries`:"Loading database…"}
          </div>
        </div>
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:10,color:T.faint,background:"rgba(255,255,255,0.03)",
          border:`1px solid ${T.border}`,borderRadius:4,padding:"2px 7px" }}>
          / search · Esc close
        </span>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar filters={filters} setFilters={setFilters}
        onSearch={doSearch} loading={loading}
        signals={signals} countries={countries}/>

      {/* ── Flash message ── */}
      {msg.text&&(
        <div style={{ padding:"7px 18px",flexShrink:0,fontSize:12,color:T.text,
          background:msg.type==="err"?T.red+"18":T.teal+"18",
          borderBottom:`1px solid ${msg.type==="err"?T.red+"40":T.teal+"40"}`,
          display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          {msg.text}
          <button onClick={()=>setMsg({text:"",type:"ok"})} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14 }}>✕</button>
        </div>
      )}

      {/* ── Stats + Sort ── */}
      <StatsHeader stats={stats} results={results} summary={summary}
        sortBy={sortBy} setSortBy={setSortBy}
        viewMode={viewMode} setViewMode={setViewMode}
        exportUrl={exportUrl}/>

      {/* ── Body ── */}
      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>

        {/* LEFT — Company list (split & list modes) */}
        {(viewMode==="split"||viewMode==="list")&&(
          <div style={{ width:viewMode==="split"?340:"100%",flexShrink:0,
            borderRight:viewMode==="split"?`1px solid ${T.border}`:"none",
            overflowY:"auto",display:"flex",flexDirection:"column" }}>
            {loading&&[1,2,3,4,5,6].map(i=><SkeletonRow key={i}/>)}
            {!loading&&results.length===0&&<EmptyState hasFilters={hasFilters}/>}
            {!loading&&paginated.map(comp=>(
              <CompanyRow key={comp.id} comp={comp}
                isActive={active?.id===comp.id}
                onClick={()=>{ setActive(comp); if(viewMode==="list")setTimeout(()=>{},0); }}
                isSelected={selected.has(comp.id)}
                onToggleSelect={()=>{
                  setSelected(s=>{ const n=new Set(s); n.has(comp.id)?n.delete(comp.id):n.add(comp.id); return n; });
                }}/>
            ))}
            {sorted.length>paginated.length&&(
              <button onClick={()=>setPage(p=>p+1)} style={{ margin:12,padding:"10px",background:T.surface,
                color:T.blue,border:`1px solid ${T.blue}40`,borderRadius:8,
                fontSize:12,fontWeight:600,cursor:"pointer" }}>
                Load {Math.min(PAGE,sorted.length-paginated.length)} more ({sorted.length-paginated.length} remaining)
              </button>
            )}
          </div>
        )}

        {/* RIGHT — Detail panel (split mode) OR Grid (grid mode) */}
        {viewMode==="split"&&(
          <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
            {!active&&<EmptyState hasFilters={false}/>}
            {active&&(
              <CompanyDetail comp={active}
                onUnlock={handleUnlock} onPipeline={handlePipeline} onMsg={flash}/>
            )}
          </div>
        )}

        {/* Grid view */}
        {viewMode==="grid"&&(
          <div style={{ flex:1,overflowY:"auto",padding:14 }}>
            {loading&&(
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10 }}>
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} style={{ height:220,borderRadius:12,background:"rgba(255,255,255,0.04)",
                    animation:"pulse 1.4s ease-in-out infinite" }}/>
                ))}
              </div>
            )}
            {!loading&&results.length===0&&<EmptyState hasFilters={hasFilters}/>}
            {!loading&&(
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10 }}>
                {paginated.map(comp=>(
                  <GridCard key={comp.id} comp={comp}
                    isActive={active?.id===comp.id}
                    onClick={()=>setActive(active?.id===comp.id?null:comp)}
                    isSelected={selected.has(comp.id)}
                    onToggleSelect={()=>{
                      setSelected(s=>{ const n=new Set(s); n.has(comp.id)?n.delete(comp.id):n.add(comp.id); return n; });
                    }}/>
                ))}
              </div>
            )}
            {sorted.length>paginated.length&&(
              <div style={{ textAlign:"center",padding:"20px 0" }}>
                <button onClick={()=>setPage(p=>p+1)} style={{ background:T.surface,color:T.blue,
                  border:`1px solid ${T.blue}40`,borderRadius:8,padding:"10px 24px",
                  fontSize:12,fontWeight:600,cursor:"pointer" }}>
                  Load more ({sorted.length-paginated.length} remaining)
                </button>
              </div>
            )}

            {/* Grid selected: detail below */}
            {active&&viewMode==="grid"&&(
              <div style={{ marginTop:16,background:T.card,border:`1px solid ${T.border}`,
                borderRadius:12,overflow:"hidden" }}>
                <div style={{ padding:"10px 16px",borderBottom:`1px solid ${T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"space-between",background:T.sidebar }}>
                  <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{active.company} — Full Profile</span>
                  <button onClick={()=>setActive(null)} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:16 }}>✕</button>
                </div>
                <CompanyDetail comp={active} onUnlock={handleUnlock} onPipeline={handlePipeline} onMsg={flash}/>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── List mode: detail drawer when company selected ── */}
      {viewMode==="list"&&active&&(
        <>
          <div onClick={()=>setActive(null)}
            style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:700 }}/>
          <div style={{ position:"fixed",top:0,right:0,bottom:0,width:460,
            background:T.surface,borderLeft:`1px solid ${T.border}`,
            zIndex:800,overflowY:"auto",
            animation:"slideInRight 0.22s ease-out",boxShadow:"-12px 0 40px rgba(0,0,0,0.5)" }}>
            <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            <div style={{ padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center",background:T.sidebar,flexShrink:0 }}>
              <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{active.company}</span>
              <button onClick={()=>setActive(null)} style={{ background:"rgba(255,255,255,0.06)",
                border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",color:T.muted,cursor:"pointer" }}>✕ Close</button>
            </div>
            <CompanyDetail comp={active} onUnlock={handleUnlock} onPipeline={handlePipeline} onMsg={flash}/>
          </div>
        </>
      )}

      {/* ── Bulk Action Bar ── */}
      <BulkBar count={selected.size} total={results.length}
        onPipeline={bulkPipeline} onClear={()=>setSelected(new Set())}/>
    </div>
  );
}
