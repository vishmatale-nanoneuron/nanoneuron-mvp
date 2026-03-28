"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch, API_BASE } from "../../lib/api";

// ─── Design Tokens ────────────────────────────────────────────────
var T = {
  bg:"#07090F", surface:"#0F1120", surfaceHover:"#141728", sidebar:"#0B0D17",
  border:"rgba(255,255,255,0.06)", borderHover:"rgba(255,255,255,0.12)",
  blue:"#4F8EF7", teal:"#00D4AA", purple:"#A855F7", orange:"#FF8C42",
  green:"#00D97E", red:"#FF3B5C", yellow:"#FFD60A",
  textPrimary:"#E2E8F0", textMuted:"rgba(226,232,240,0.45)", textFaint:"rgba(226,232,240,0.18)",
};

// ─── Score Badge ──────────────────────────────────────────────────
function ScoreBadge({ score, label }) {
  var color = label === "HOT" ? T.red : label === "WARM" ? T.orange : T.textMuted;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:color+"18",
      border:`1px solid ${color}40`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,color}}>
      {label === "HOT" && "🔥"}{label === "WARM" && "🟡"}{label === "COLD" && "❄️"} {score}
    </span>
  );
}

// ─── Intent Pill ──────────────────────────────────────────────────
function IntentPill({ signal }) {
  var label = signal.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase());
  var color = signal.includes("funded") || signal.includes("ipo") ? T.teal
    : signal.includes("hiring") ? T.blue
    : signal.includes("digital") || signal.includes("cloud") ? T.purple
    : signal.includes("compliance") || signal.includes("ciso") ? T.orange
    : T.textMuted;
  return (
    <span style={{display:"inline-block",background:color+"18",border:`1px solid ${color}35`,
      borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600,color,whiteSpace:"nowrap"}}>
      {label}
    </span>
  );
}

// ─── Tech Badge ───────────────────────────────────────────────────
function TechBadge({ tech }) {
  return (
    <span style={{display:"inline-block",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:4,padding:"1px 6px",fontSize:10,color:T.textMuted}}>
      {tech}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────
function RiskBadge({ risk, compliance }) {
  var c = risk === "high" ? T.red : risk === "medium" ? T.orange : T.green;
  return (
    <span title={compliance} style={{display:"inline-flex",alignItems:"center",gap:3,background:c+"15",
      border:`1px solid ${c}40`,borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:600,color:c}}>
      {risk === "high" ? "⚠️" : risk === "medium" ? "⬛" : "✓"} {compliance}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,
      padding:"14px 18px",flex:1,minWidth:0}}>
      <div style={{fontSize:11,color:T.textMuted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color:color||T.textPrimary}}>{value}</div>
      {sub && <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────
function FilterPanel({ filters, setFilters, onSearch, loading, signals, countries }) {
  var F = filters;
  var inp = {background:T.sidebar,border:`1px solid ${T.border}`,borderRadius:6,
    padding:"7px 10px",color:T.textPrimary,fontSize:13,width:"100%",outline:"none"};
  var label = {display:"block",fontSize:11,color:T.textMuted,marginBottom:4,
    textTransform:"uppercase",letterSpacing:"0.06em"};

  var INDUSTRIES = ["","saas","fintech","ecommerce","healthcare","cybersecurity","manufacturing","legal","realestate","logistics","education"];
  var FUNDINGS = [
    {v:"",l:"Any Funding"},{v:"seed",l:"Seed"},{v:"series_a",l:"Series A"},
    {v:"series_b",l:"Series B"},{v:"series_c",l:"Series C+"},{v:"ipo",l:"IPO/Public"},{v:"pe",l:"PE-backed"}
  ];
  var SENIORITIES = ["","C-Suite","VP","Director","Manager"];
  var DEPTS = ["","Executive","Engineering","Sales","Product","Finance","Security","Compliance","Operations","Marketing"];

  return (
    <div style={{width:220,flexShrink:0,background:T.sidebar,borderRight:`1px solid ${T.border}`,
      overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontWeight:700,fontSize:13,color:T.blue,marginBottom:4}}>⚡ Smart Filters</div>

      {/* Free text */}
      <div>
        <div style={label}>Search</div>
        <input style={inp} placeholder="Company, city, keyword…"
          value={F.q||""} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}/>
      </div>

      {/* Industry */}
      <div>
        <div style={label}>Industry</div>
        <select style={inp} value={F.industry||""} onChange={e=>setFilters(f=>({...f,industry:e.target.value}))}>
          {INDUSTRIES.map(i=><option key={i} value={i}>{i||"All Industries"}</option>)}
        </select>
      </div>

      {/* Country */}
      <div>
        <div style={label}>Country</div>
        <select style={inp} value={F.country||""} onChange={e=>setFilters(f=>({...f,country:e.target.value}))}>
          <option value="">All Countries</option>
          {(countries||[]).map(c=>(
            <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.company_count})</option>
          ))}
        </select>
      </div>

      {/* Funding */}
      <div>
        <div style={label}>Funding Stage</div>
        <select style={inp} value={F.funding||""} onChange={e=>setFilters(f=>({...f,funding:e.target.value}))}>
          {FUNDINGS.map(f=><option key={f.v} value={f.v}>{f.l}</option>)}
        </select>
      </div>

      {/* Seniority */}
      <div>
        <div style={label}>Seniority</div>
        <select style={inp} value={F.seniority||""} onChange={e=>setFilters(f=>({...f,seniority:e.target.value}))}>
          {SENIORITIES.map(s=><option key={s} value={s}>{s||"All Levels"}</option>)}
        </select>
      </div>

      {/* Department */}
      <div>
        <div style={label}>Department</div>
        <select style={inp} value={F.dept||""} onChange={e=>setFilters(f=>({...f,dept:e.target.value}))}>
          {DEPTS.map(d=><option key={d} value={d}>{d||"All Departments"}</option>)}
        </select>
      </div>

      {/* Min Score */}
      <div>
        <div style={label}>Min Score: <span style={{color:T.blue}}>{F.min_score||0}</span></div>
        <input type="range" min={0} max={90} step={5}
          value={F.min_score||0} onChange={e=>setFilters(f=>({...f,min_score:parseInt(e.target.value)}))}
          style={{width:"100%",accentColor:T.blue}}/>
      </div>

      {/* Intent Signals */}
      <div>
        <div style={label}>Intent Signals</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {(signals||[]).slice(0,8).map(s=>{
            var active = (F.intent||"").split(",").filter(Boolean).includes(s.signal);
            return (
              <button key={s.signal} onClick={()=>{
                var cur = (F.intent||"").split(",").filter(Boolean);
                var next = active ? cur.filter(x=>x!==s.signal) : [...cur, s.signal];
                setFilters(f=>({...f,intent:next.join(",")}));
              }} style={{background:active?T.teal+"25":"rgba(255,255,255,0.03)",
                border:`1px solid ${active?T.teal:T.border}`,borderRadius:12,padding:"3px 8px",
                fontSize:10,color:active?T.teal:T.textMuted,cursor:"pointer",transition:"all 0.15s"}}>
                {s.signal.replace(/_/g," ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search btn */}
      <button onClick={onSearch} disabled={loading} style={{background:T.blue,color:"#fff",border:"none",
        borderRadius:7,padding:"10px 0",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4}}>
        {loading ? "Searching…" : "🔍 Discover Leads"}
      </button>

      {/* Reset */}
      <button onClick={()=>setFilters({})} style={{background:"transparent",color:T.textMuted,
        border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer"}}>
        Reset Filters
      </button>
    </div>
  );
}

// ─── Company Card ─────────────────────────────────────────────────
function CompanyCard({ comp, onUnlock, onPipeline, expanded, setExpanded }) {
  var isOpen = expanded === comp.id;
  return (
    <div style={{background:T.surface,border:`1px solid ${isOpen?T.blue+"60":T.border}`,
      borderRadius:10,overflow:"hidden",transition:"border-color 0.2s"}}>

      {/* Header */}
      <div onClick={()=>setExpanded(isOpen?null:comp.id)}
        style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:12}}>

        {/* Flag + Avatar */}
        <div style={{flexShrink:0,textAlign:"center"}}>
          <div style={{fontSize:22}}>{comp.flag}</div>
          <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{comp.country}</div>
        </div>

        {/* Company info */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:14,color:T.textPrimary}}>{comp.company}</span>
            <span style={{fontSize:11,color:T.textMuted}}>{comp.domain}</span>
            <span style={{fontSize:11,color:T.teal,background:T.teal+"15",borderRadius:4,
              padding:"1px 6px",textTransform:"capitalize"}}>{comp.industry}</span>
          </div>
          <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap",fontSize:12,color:T.textMuted}}>
            <span>📍 {comp.city}</span>
            <span>👥 {comp.employees}</span>
            <span>💰 {comp.revenue}</span>
            <span>📈 {comp.growth}</span>
            <span style={{color:T.teal}}>🏦 {comp.funding}</span>
          </div>
          <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
            {comp.intent.slice(0,3).map(s=><IntentPill key={s} signal={s}/>)}
            {comp.intent.length > 3 && <span style={{fontSize:10,color:T.textMuted}}>+{comp.intent.length-3} more</span>}
          </div>
        </div>

        {/* Right: stats */}
        <div style={{flexShrink:0,textAlign:"right"}}>
          <div style={{fontSize:11,color:T.textMuted}}>Top Score</div>
          <ScoreBadge score={comp.top_score} label={comp.top_score>=80?"HOT":comp.top_score>=60?"WARM":"COLD"}/>
          <div style={{fontSize:11,color:T.textMuted,marginTop:4}}>{comp.contact_count} contacts</div>
          <RiskBadge risk={comp.compliance_risk} compliance={comp.compliance||"General"}/>
        </div>

        <div style={{color:T.textMuted,fontSize:16}}>{isOpen?"▲":"▼"}</div>
      </div>

      {/* Expanded contacts */}
      {isOpen && (
        <div style={{borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
          {/* Tech stack */}
          <div style={{padding:"10px 16px",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:11,color:T.textMuted,marginRight:4}}>Tech:</span>
            {comp.tech.map(t=><TechBadge key={t} tech={t}/>)}
          </div>

          {/* Culture tip */}
          {comp.business_culture && (
            <div style={{padding:"4px 16px 10px",fontSize:11,color:T.textMuted,fontStyle:"italic"}}>
              💡 {comp.business_culture}
            </div>
          )}

          {/* Contacts table */}
          {comp.contacts.map((c,i)=>(
            <div key={i} style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`,
              display:"flex",alignItems:"center",gap:12,background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:T.blue+"20",
                border:`1px solid ${T.blue}40`,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:13,fontWeight:700,color:T.blue,flexShrink:0}}>
                {c.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,color:T.textPrimary}}>{c.name}</div>
                <div style={{fontSize:11,color:T.textMuted}}>{c.title} · {c.dept}</div>
                <div style={{fontSize:11,color:T.textFaint,marginTop:1,fontFamily:"monospace"}}>{c.email_masked}</div>
              </div>
              <div style={{textAlign:"center",flexShrink:0}}>
                <ScoreBadge score={c.score} label={c.score_label}/>
                <div style={{fontSize:10,color:T.teal,marginTop:3}}>₹{c.potential_inr.toLocaleString()}</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>onUnlock(comp,c)} style={{background:T.teal+"20",color:T.teal,
                  border:`1px solid ${T.teal}50`,borderRadius:6,padding:"5px 10px",fontSize:11,
                  fontWeight:600,cursor:"pointer"}}>
                  🔓 Unlock
                </button>
                <button onClick={()=>onPipeline(comp,c)} style={{background:T.blue+"20",color:T.blue,
                  border:`1px solid ${T.blue}50`,borderRadius:6,padding:"5px 10px",fontSize:11,
                  fontWeight:600,cursor:"pointer"}}>
                  + Pipeline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────
export default function LeadDiscoveryEngine() {
  var [filters, setFilters] = useState({});
  var [results, setResults] = useState([]);
  var [summary, setSummary] = useState(null);
  var [loading, setLoading] = useState(false);
  var [expanded, setExpanded] = useState(null);
  var [signals, setSignals] = useState([]);
  var [countries, setCountries] = useState([]);
  var [stats, setStats] = useState(null);
  var [msg, setMsg] = useState("");
  var [view, setView] = useState("table"); // table | map
  var [sortBy, setSortBy] = useState("score"); // score | potential | contacts
  var didMount = useRef(false);

  // Load meta on mount
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

  async function doSearch() {
    setLoading(true); setMsg("");
    try {
      var params = new URLSearchParams();
      if(filters.q) params.set("q",filters.q);
      if(filters.industry) params.set("industry",filters.industry);
      if(filters.country) params.set("country",filters.country);
      if(filters.funding) params.set("funding",filters.funding);
      if(filters.seniority) params.set("seniority",filters.seniority);
      if(filters.dept) params.set("dept",filters.dept);
      if(filters.intent) params.set("intent",filters.intent);
      if(filters.min_score) params.set("min_score",filters.min_score);
      params.set("limit","100");
      var data = await apiFetch("/discovery/leads?"+params.toString());
      setResults(data.data||[]);
      setSummary(data.summary||null);
    } catch(e) { setMsg("Error loading leads. Check backend connection."); }
    setLoading(false);
  }

  async function handleUnlock(comp, contact) {
    try {
      var email = contact.first.toLowerCase() + "." + contact.last.toLowerCase() + "@" + comp.domain;
      var r = await apiFetch("/search/unlock", {method:"POST",body:JSON.stringify({
        company_domain: comp.domain, contact_name: contact.name,
      })});
      if(r.success) setMsg(`✅ Unlocked ${contact.name} — ${r.lead?.email||email}`);
      else setMsg("⚠️ "+r.detail);
    } catch(e) { setMsg("Need credits to unlock."); }
  }

  async function handlePipeline(comp, contact) {
    try {
      var r = await apiFetch("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
        company_name: comp.company, contact_name: contact.name,
        contact_email: contact.first.toLowerCase()+"."+contact.last.toLowerCase()+"@"+comp.domain,
        contact_title: contact.title, country: comp.country, deal_value: 0,
      })});
      if(r.success) setMsg(`📋 ${contact.name} added to pipeline!`);
    } catch(e) { setMsg("Error adding to pipeline."); }
  }

  var sorted = [...results].sort((a,b)=>{
    if(sortBy==="potential") return b.total_potential_inr - a.total_potential_inr;
    if(sortBy==="contacts") return b.contact_count - a.contact_count;
    return b.top_score - a.top_score;
  });

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg}}>

      {/* Header bar */}
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,
        display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
        <div>
          <div style={{fontWeight:700,fontSize:16,color:T.textPrimary}}>⚡ Lead Discovery Engine</div>
          <div style={{fontSize:11,color:T.textMuted}}>
            {stats ? `${stats.total_companies} companies · ${stats.total_contacts} contacts · ${stats.total_countries} countries` : "Loading…"}
          </div>
        </div>
        <div style={{flex:1}}/>
        {/* Sort */}
        <div style={{display:"flex",gap:4}}>
          {[["score","Top Score"],["potential","₹ Potential"],["contacts","Contacts"]].map(([v,l])=>(
            <button key={v} onClick={()=>setSortBy(v)} style={{background:sortBy===v?T.blue:"rgba(255,255,255,0.04)",
              color:sortBy===v?"#fff":T.textMuted,border:`1px solid ${sortBy===v?T.blue:T.border}`,
              borderRadius:5,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>
              {l}
            </button>
          ))}
        </div>
        {/* Export */}
        <a href={`${API_BASE}/api/search/export-csv`} target="_blank" rel="noreferrer"
          style={{background:"rgba(255,255,255,0.04)",color:T.textMuted,border:`1px solid ${T.border}`,
            borderRadius:5,padding:"5px 10px",fontSize:11,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
          ⬇️ CSV
        </a>
      </div>

      {/* Summary stats */}
      {summary && (
        <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,
          display:"flex",gap:10,flexShrink:0,overflowX:"auto"}}>
          <StatCard label="Companies" value={results.length} sub="found"/>
          <StatCard label="Contacts" value={summary.contacts} sub="total"/>
          <StatCard label="Hot Leads" value={summary.hot_leads} color={T.red}/>
          <StatCard label="Countries" value={summary.countries} sub="regions"/>
          <StatCard label="Industries" value={summary.industries} sub="sectors"/>
          <StatCard label="INR Potential" value={`₹${(summary.total_potential_inr||0).toLocaleString()}`} color={T.teal}/>
        </div>
      )}

      {/* Message flash */}
      {msg && (
        <div style={{padding:"8px 20px",background:msg.startsWith("✅")?T.teal+"18":T.red+"18",
          borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.textPrimary,flexShrink:0,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {msg}
          <button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer"}}>✕</button>
        </div>
      )}

      {/* Body: filter + results */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <FilterPanel filters={filters} setFilters={setFilters}
          onSearch={doSearch} loading={loading}
          signals={signals} countries={countries}/>

        {/* Results */}
        <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8}}>
          {loading && (
            <div style={{textAlign:"center",padding:60,color:T.textMuted,fontSize:14}}>
              <div style={{fontSize:32,marginBottom:12}}>🔍</div>
              Discovering leads across 50+ countries…
            </div>
          )}
          {!loading && sorted.length === 0 && (
            <div style={{textAlign:"center",padding:60,color:T.textMuted}}>
              <div style={{fontSize:32,marginBottom:12}}>🌍</div>
              No leads match your filters. Try relaxing the criteria.
            </div>
          )}
          {!loading && sorted.map(comp=>(
            <CompanyCard key={comp.id} comp={comp}
              onUnlock={handleUnlock} onPipeline={handlePipeline}
              expanded={expanded} setExpanded={setExpanded}/>
          ))}
          {!loading && sorted.length > 0 && (
            <div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:T.textFaint}}>
              Showing {sorted.length} companies · {summary?.contacts||0} contacts · Click any row to expand contacts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
