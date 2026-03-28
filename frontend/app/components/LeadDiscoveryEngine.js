"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { apiFetch, API_BASE } from "../../lib/api";

// ─── Design Tokens ────────────────────────────────────────────────
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

// ─── AI Email Generator (template-based, instant) ─────────────────
function generateEmail(comp, ct) {
  const signals = comp.intent || [];
  const culture = (comp.business_culture || "").toLowerCase();
  const ctFirst = ct.first || (ct.name||"").split(" ")[0] || "there";
  const isFormal = culture.includes("formal") || culture.includes("hierarchical");

  const hooks = {
    series_a_funded:`Congratulations on your Series A — it's clear ${comp.company} is in serious scale mode.`,
    series_b_funded:`Your Series B signals aggressive growth — and with that comes the need for the right operational infrastructure.`,
    recent_ipo:`Your recent IPO places ${comp.company} on a new playing field with heightened compliance and tooling expectations.`,
    hiring_engineers:`I noticed ${comp.company} is actively scaling its engineering org — a strong signal you're investing in platform.`,
    hiring_sales:`With ${comp.company} building out its sales team, the CRM and enablement stack becomes mission-critical.`,
    expanding_globally:`Expanding into new markets is exciting — and the vendors that support you there make all the difference.`,
    new_product_launch:`Launching a new product is a pivotal window. The right data and workflow tools can 10x the go-to-market speed.`,
    acquisitions:`Post-acquisition integration is one of the most complex — and high-budget — tech challenges a team faces.`,
    tech_refresh:`Replacing legacy systems is a rare window. Getting the vendor selection right here compounds for years.`,
    ciso_hired:`A new CISO typically triggers a full security stack review within the first 90 days — perfect timing to have a conversation.`,
    digital_transformation:`Digital transformation initiatives tend to be multi-year, multi-million dollar programs. Vendor selection is everything.`,
    cloud_migration:`Cloud migrations are where architecture decisions become irreversible. We help teams get this right the first time.`,
    compliance_audit:`Compliance audits create urgent, well-scoped needs. Our platform was built to accelerate exactly this.`,
    entering_new_market:`New market entry brings regulatory and data complexity most teams underestimate. Happy to share what we've seen.`,
    recent_rebrand:`A rebrand is often the right moment to re-evaluate the entire vendor stack — new direction, new requirements.`,
  };
  const hook = hooks[signals[0]] || `I've been following ${comp.company}'s growth closely and wanted to reach out.`;
  const greeting = isFormal ? `Dear ${ct.name || ctFirst},` : `Hi ${ctFirst},`;
  const topSignals = signals.slice(0,2).map(s=>s.replace(/_/g," ")).join(" and ");
  const subject = `${comp.company} — quick question about ${signals[0]?.replace(/_/g," ")||"your growth"}`;

  const body = `${greeting}

${hook}

As ${ct.title} at ${comp.company}, you're right in the middle of ${topSignals || "rapid growth"} — exactly where our platform delivers the most impact for ${comp.industry} companies.

We help teams like yours [specific value prop — edit this] so that [outcome]. Three ${comp.industry} companies in your space achieved [result] within 90 days of deployment.

Worth a 20-minute call this week? I can show you exactly how this applies to ${comp.company}'s current situation.

Best,
[Your Name]
[Your Company]
[Phone/Cal link]

---
P.S. Noticed you're on ${(comp.tech||[]).slice(0,2).join(" and ")||"cutting-edge infrastructure"} — we integrate natively, zero migration pain.`;

  return { subject, body };
}

// ─── Hooks ────────────────────────────────────────────────────────
function useDebouncedValue(v, ms) {
  const [d, setD] = useState(v);
  useEffect(()=>{ const t=setTimeout(()=>setD(v),ms); return()=>clearTimeout(t); },[v,ms]);
  return d;
}
function useLocalStorage(key, init) {
  const [val, setVal] = useState(()=>{ try{ const s=localStorage.getItem(key); return s?JSON.parse(s):init; }catch(e){ return init; } });
  const set = useCallback(v=>{ setVal(v); try{ localStorage.setItem(key,JSON.stringify(v)); }catch(e){} },[key]);
  return [val, set];
}

// ─── Tooltip ──────────────────────────────────────────────────────
function Tip({ text, children, placement="top" }) {
  const [show, setShow] = useState(false);
  const pos = placement==="bottom" ? { top:"calc(100% + 6px)", bottom:"auto" } : { bottom:"calc(100% + 6px)" };
  return (
    <span style={{ position:"relative",display:"inline-flex" }}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show && text && (
        <span style={{ position:"absolute",...pos,left:"50%",
          transform:"translateX(-50%)",background:"#1E2235",border:`1px solid ${T.border}`,
          borderRadius:7,padding:"6px 10px",fontSize:10,color:T.text,whiteSpace:"pre-wrap",
          maxWidth:220,lineHeight:1.5,zIndex:9999,boxShadow:"0 6px 20px rgba(0,0,0,0.5)",
          pointerEvents:"none",textAlign:"center" }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Score Badge with breakdown ───────────────────────────────────
function ScoreBadge({ score, size="md", breakdown }) {
  const color = score>=80?T.red:score>=65?T.orange:T.muted;
  const label = score>=80?"HOT":score>=65?"WARM":"COLD";
  const icon  = score>=80?"🔥":score>=65?"⚡":"❄️";
  const sz = size==="lg"?{outer:52,fs:15,fs2:9}:{outer:40,fs:13,fs2:8};
  const tip = breakdown ? `Score: ${score}\n${breakdown}` : null;
  return (
    <Tip text={tip}>
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
        <div style={{ width:sz.outer,height:sz.outer,borderRadius:"50%",
          background:`conic-gradient(${color} ${score}%, rgba(255,255,255,0.05) 0)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:`0 0 ${score>=80?14:8}px ${color}${score>=80?"60":"40"}`,cursor:breakdown?"help":"default" }}>
          <div style={{ width:sz.outer-8,height:sz.outer-8,borderRadius:"50%",
            background:T.card,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:1 }}>
            <span style={{ fontSize:sz.fs2+1 }}>{icon}</span>
            <span style={{ fontSize:sz.fs-1,fontWeight:800,color,lineHeight:1 }}>{score}</span>
          </div>
        </div>
        <span style={{ fontSize:sz.fs2,fontWeight:700,color,letterSpacing:"0.06em" }}>{label}</span>
      </div>
    </Tip>
  );
}

// ─── Intent Pill ──────────────────────────────────────────────────
function IntentPill({ signal, active, onClick }) {
  const c = SIG_COLOR[signal]||T.muted;
  const lbl = signal.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase());
  return (
    <Tip text={SIG_WHY[signal]}>
      <button onClick={onClick} style={{
        background:active?c+"28":"rgba(255,255,255,0.03)",
        border:`1px solid ${active?c+"80":T.border}`,
        borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:600,
        color:active?c:T.muted,cursor:onClick?"pointer":"default",
        transition:"all 0.15s",whiteSpace:"nowrap",
      }}>{lbl}</button>
    </Tip>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({ name, size=36, color=T.blue, shape="circle" }) {
  const init=(name||"").split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
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
  return <div style={{ width:w,height:h,borderRadius:r,background:"rgba(255,255,255,0.05)",animation:"pulse 1.4s ease-in-out infinite" }}/>;
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

// ─── Email Modal ──────────────────────────────────────────────────
function EmailModal({ comp, contact, onClose }) {
  const { subject, body } = useMemo(()=>generateEmail(comp, contact),[comp.id, contact.name]);
  const [editBody, setEditBody] = useState(body);
  const [editSubj, setEditSubj] = useState(subject);
  const [copied, setCopied] = useState(false);

  function copyAll() {
    const text = `Subject: ${editSubj}\n\n${editBody}`;
    navigator.clipboard?.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500); });
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"relative",width:"min(640px,95vw)",background:T.surface,
        border:`1px solid ${T.borderFocus}`,borderRadius:14,overflow:"hidden",
        boxShadow:"0 24px 80px rgba(0,0,0,0.7)",maxHeight:"88vh",display:"flex",flexDirection:"column" }}>
        {/* Header */}
        <div style={{ padding:"14px 18px",borderBottom:`1px solid ${T.border}`,
          background:T.sidebar,display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${T.blue},${T.teal})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>✉️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800,fontSize:13,color:T.text }}>AI Email Writer</div>
            <div style={{ fontSize:10,color:T.muted }}>Personalized cold email for {contact.name} · {comp.company}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border}`,
            borderRadius:6,padding:"5px 10px",color:T.muted,cursor:"pointer",fontSize:12 }}>✕ Close</button>
        </div>

        {/* Content */}
        <div style={{ padding:"16px 18px",display:"flex",flexDirection:"column",gap:12,overflowY:"auto",flex:1 }}>
          {/* Contact context bar */}
          <div style={{ display:"flex",gap:8,alignItems:"center",padding:"8px 12px",
            background:`${IND_COLOR[comp.industry]||T.blue}10`,border:`1px solid ${IND_COLOR[comp.industry]||T.blue}30`,
            borderRadius:8 }}>
            <Avatar name={contact.name} size={28} color={IND_COLOR[comp.industry]||T.blue}/>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:T.text }}>{contact.name}</div>
              <div style={{ fontSize:10,color:T.muted }}>{contact.title} · {comp.company} · {comp.flag} {comp.country}</div>
            </div>
            <div style={{ marginLeft:"auto",display:"flex",gap:4,flexWrap:"wrap" }}>
              {(comp.intent||[]).slice(0,2).map(s=>(
                <span key={s} style={{ background:(SIG_COLOR[s]||T.muted)+"18",border:`1px solid ${(SIG_COLOR[s]||T.muted)}40`,
                  borderRadius:20,padding:"2px 7px",fontSize:9,fontWeight:600,color:SIG_COLOR[s]||T.muted }}>
                  {s.replace(/_/g," ")}
                </span>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <div style={{ fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.07em" }}>Subject Line</div>
            <input value={editSubj} onChange={e=>setEditSubj(e.target.value)}
              style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
                borderRadius:7,padding:"9px 12px",color:T.text,fontSize:12,outline:"none",
                fontWeight:600,boxSizing:"border-box" }}/>
          </div>

          {/* Body */}
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
              <div style={{ fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em" }}>Email Body</div>
              <div style={{ fontSize:10,color:T.faint }}>Edit directly · Personalize [brackets]</div>
            </div>
            <textarea value={editBody} onChange={e=>setEditBody(e.target.value)}
              rows={14}
              style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,
                borderRadius:7,padding:"10px 12px",color:T.text,fontSize:12,outline:"none",
                lineHeight:1.7,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box" }}/>
          </div>

          {/* Signals used */}
          <div style={{ fontSize:10,color:T.faint,lineHeight:1.6 }}>
            💡 Email tuned for: {(comp.intent||[]).slice(0,3).map(s=>s.replace(/_/g," ")).join(" · ")}
            {comp.business_culture && <span> · {comp.business_culture.split(",")[0]} culture</span>}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding:"12px 18px",borderTop:`1px solid ${T.border}`,
          display:"flex",gap:8,background:T.sidebar }}>
          <button onClick={copyAll} style={{
            flex:1,background:copied?T.green+"25":`linear-gradient(135deg,${T.blue},${T.teal})`,
            border:copied?`1px solid ${T.green}60`:"none",
            borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,
            color:copied?T.green:"#fff",cursor:"pointer",transition:"all 0.2s" }}>
            {copied?"✅ Copied to clipboard!":"📋 Copy Full Email"}
          </button>
          <button onClick={()=>{ setEditSubj(subject); setEditBody(body); }}
            style={{ background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
              borderRadius:8,padding:"10px 14px",fontSize:11,color:T.muted,cursor:"pointer" }}>
            ↺ Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Market Map Panel ─────────────────────────────────────────────
function MarketMap({ data, onFilterCountry, activeCountry }) {
  if(!data||!data.length) return (
    <div style={{ padding:24,textAlign:"center",color:T.muted,fontSize:13 }}>Loading market map…</div>
  );
  const maxTotal = Math.max(...data.map(d=>d.total));
  return (
    <div style={{ overflowY:"auto",flex:1 }}>
      <div style={{ padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
        fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",
        display:"flex",gap:16 }}>
        <span style={{ flex:2 }}>Country</span>
        <span style={{ flex:1,textAlign:"center" }}>Companies</span>
        <span style={{ flex:1,textAlign:"center" }}>🔥 Hot</span>
        <span style={{ flex:3 }}>Top Industry</span>
      </div>
      {data.map(d=>{
        const topInd = Object.entries(d.by_industry||{}).sort((a,b)=>b[1]-a[1])[0];
        const barW = Math.round((d.total/maxTotal)*100);
        const isActive = activeCountry===d.country;
        return (
          <div key={d.country} onClick={()=>onFilterCountry(isActive?"":d.country)}
            style={{ padding:"9px 16px",borderBottom:`1px solid ${T.border}`,
              cursor:"pointer",display:"flex",gap:16,alignItems:"center",
              background:isActive?T.blue+"12":"transparent",
              borderLeft:`3px solid ${isActive?T.blue:"transparent"}`,
              transition:"all 0.12s" }}>
            <div style={{ flex:2,display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:18 }}>{d.meta?.flag||"🌐"}</span>
              <div>
                <div style={{ fontSize:11,fontWeight:600,color:T.text }}>{d.meta?.name||d.country}</div>
                <div style={{ height:3,marginTop:3,borderRadius:2,background:T.blue+"30",width:60 }}>
                  <div style={{ height:"100%",borderRadius:2,background:T.blue,width:`${barW}%` }}/>
                </div>
              </div>
            </div>
            <div style={{ flex:1,textAlign:"center",fontWeight:700,fontSize:13,color:T.text }}>{d.total}</div>
            <div style={{ flex:1,textAlign:"center",fontWeight:700,fontSize:12,color:T.red }}>
              {d.hot_leads>0?`🔥 ${d.hot_leads}`:<span style={{ color:T.faint }}>—</span>}
            </div>
            <div style={{ flex:3 }}>
              {topInd&&<span style={{ background:(IND_COLOR[topInd[0]]||T.blue)+"20",
                color:IND_COLOR[topInd[0]]||T.blue,border:`1px solid ${(IND_COLOR[topInd[0]]||T.blue)}40`,
                borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,textTransform:"capitalize" }}>
                {IND_ICON[topInd[0]]} {topInd[0]} ({topInd[1]})
              </span>}
            </div>
          </div>
        );
      })}
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
    {v:"manufacturing",l:"⚙️ Mfg"},{v:"legal",l:"⚖️ Legal"},
    {v:"realestate",l:"🏢 RE"},{v:"logistics",l:"🚚 Logistics"},
    {v:"education",l:"🎓 EdTech"},
  ];
  const FUNDS = [
    {v:"seed",l:"🌱 Seed"},{v:"series_a",l:"Series A"},{v:"series_b",l:"Series B+"},
    {v:"ipo",l:"📈 Public"},{v:"pe",l:"🏦 PE"},
  ];
  const activeCount = [F.industry,F.country,F.funding,F.seniority,F.tech,F.intent,F.min_score&&F.min_score>0?F.min_score:null].filter(Boolean).length;
  const isHotOnly = F.min_score>=80;

  return (
    <div style={{ background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"10px 14px",flexShrink:0 }}>
      {/* Row 1 */}
      <div style={{ display:"flex",gap:7,alignItems:"center" }}>
        <div style={{ flex:1,position:"relative" }}>
          <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none",opacity:0.35 }}>🔍</span>
          <input ref={searchRef} value={F.q||""} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}
            onKeyDown={e=>e.key==="Enter"&&onSearch()}
            placeholder="Search companies, city, tech stack… (/ to focus)"
            style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
              borderRadius:8,padding:"8px 10px 8px 32px",color:T.text,fontSize:12,outline:"none",
              transition:"border-color 0.15s",boxSizing:"border-box" }}/>
        </div>

        {/* Hot Leads quick-filter */}
        <Tip text="Show only HOT leads (score ≥ 80)" placement="bottom">
          <button onClick={()=>setFilters(f=>({...f,min_score:isHotOnly?0:80}))} style={{
            background:isHotOnly?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.04)",
            border:`1px solid ${isHotOnly?T.red+"70":T.border}`,
            borderRadius:8,padding:"8px 12px",color:isHotOnly?T.red:T.muted,
            fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>
            🔥 Hot
          </button>
        </Tip>

        <button onClick={()=>setShowAdvanced(v=>!v)} style={{
          background:showAdvanced?T.blue+"25":"rgba(255,255,255,0.04)",
          border:`1px solid ${showAdvanced?T.blue+"80":T.border}`,
          borderRadius:8,padding:"8px 12px",color:showAdvanced?T.blue:T.muted,
          fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
          ⚙ {activeCount>0&&<span style={{ background:T.red,color:"#fff",borderRadius:"50%",
            width:15,height:15,fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{activeCount}</span>}
        </button>
        <button onClick={onSearch} disabled={loading} style={{
          background:loading?T.blue+"40":`linear-gradient(135deg,${T.blue},${T.teal})`,
          border:"none",borderRadius:8,padding:"8px 16px",color:"#fff",
          fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",whiteSpace:"nowrap" }}>
          {loading?"…":"Discover"}
        </button>
      </div>

      {/* Industry chips */}
      <div style={{ display:"flex",gap:5,marginTop:8,flexWrap:"wrap" }}>
        {INDS.map(ind=>(
          <button key={ind.v} onClick={()=>setFilters(f=>({...f,industry:f.industry===ind.v?"":ind.v}))}
            style={{ background:F.industry===ind.v?IND_COLOR[ind.v]+"25":"rgba(255,255,255,0.03)",
              border:`1px solid ${F.industry===ind.v?IND_COLOR[ind.v]+"70":T.border}`,
              borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:600,
              color:F.industry===ind.v?IND_COLOR[ind.v]:T.muted,cursor:"pointer",transition:"all 0.15s" }}>
            {ind.l}
          </button>
        ))}
        {activeCount>0&&(
          <button onClick={()=>setFilters({})} style={{ background:"rgba(239,68,68,0.08)",
            border:`1px solid ${T.red}40`,borderRadius:20,padding:"3px 9px",
            fontSize:10,fontWeight:600,color:T.red,cursor:"pointer" }}>✕ Clear all</button>
        )}
      </div>

      {/* Advanced panel */}
      {showAdvanced&&(
        <div style={{ marginTop:10,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:9,
          borderTop:`1px solid ${T.border}`,paddingTop:10 }}>
          <div>
            <div style={{ fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.07em" }}>Country</div>
            <select value={F.country||""} onChange={e=>setFilters(f=>({...f,country:e.target.value}))}
              style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,
                borderRadius:6,padding:"6px 8px",color:T.text,fontSize:11,outline:"none" }}>
              <option value="">🌍 All Countries</option>
              {(countries||[]).map(c=><option key={c.code} value={c.code}>{c.flag} {c.name} ({c.company_count})</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.07em" }}>Funding Stage</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
              {FUNDS.map(f=>(
                <button key={f.v} onClick={()=>setFilters(fp=>({...fp,funding:fp.funding===f.v?"":f.v}))}
                  style={{ background:F.funding===f.v?T.teal+"25":"rgba(255,255,255,0.03)",
                    border:`1px solid ${F.funding===f.v?T.teal+"70":T.border}`,
                    borderRadius:6,padding:"3px 7px",fontSize:10,fontWeight:600,
                    color:F.funding===f.v?T.teal:T.muted,cursor:"pointer" }}>{f.l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.07em" }}>Contact Seniority</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
              {["C-Suite","VP","Director"].map(s=>(
                <button key={s} onClick={()=>setFilters(f=>({...f,seniority:f.seniority===s?"":s}))}
                  style={{ background:F.seniority===s?T.purple+"25":"rgba(255,255,255,0.03)",
                    border:`1px solid ${F.seniority===s?T.purple+"70":T.border}`,
                    borderRadius:6,padding:"3px 7px",fontSize:10,fontWeight:600,
                    color:F.seniority===s?T.purple:T.muted,cursor:"pointer" }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.07em" }}>Tech Stack</div>
            <input value={F.tech||""} onChange={e=>setFilters(f=>({...f,tech:e.target.value}))}
              placeholder="e.g. Salesforce, AWS…"
              style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,
                borderRadius:6,padding:"6px 8px",color:T.text,fontSize:11,outline:"none",boxSizing:"border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.07em" }}>
              Min Score: <span style={{ color:T.blue,fontWeight:700 }}>{F.min_score||0}</span>
            </div>
            <input type="range" min={0} max={90} step={5} value={F.min_score||0}
              onChange={e=>setFilters(f=>({...f,min_score:parseInt(e.target.value)}))}
              style={{ width:"100%",accentColor:T.blue }}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ fontSize:9,color:T.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em" }}>Intent Signals (hover for why)</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
              {(signals||[]).slice(0,15).map(s=>(
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
function CompanyRow({ comp, isActive, onClick, isSelected, onToggleSelect, isBookmarked, onBookmark, onQuickPipeline }) {
  const [hover, setHover] = useState(false);
  const c = IND_COLOR[comp.industry]||T.blue;
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        padding:"11px 12px 11px 10px",cursor:"pointer",display:"flex",gap:8,alignItems:"flex-start",
        borderBottom:`1px solid ${T.border}`,position:"relative",
        background:isActive?T.blue+"10":hover?"rgba(255,255,255,0.02)":"transparent",
        borderLeft:`3px solid ${isActive?T.blue:"transparent"}`,
        transition:"background 0.1s,border-color 0.1s",
      }}>
      {/* Checkbox */}
      <div onClick={e=>{e.stopPropagation();onToggleSelect();}}
        style={{ width:14,height:14,marginTop:3,borderRadius:3,flexShrink:0,
          background:isSelected?T.blue:"transparent",border:`1.5px solid ${isSelected?T.blue:T.border}`,
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
        {isSelected&&<span style={{ color:"#fff",fontSize:8,fontWeight:900 }}>✓</span>}
      </div>

      {/* Flag */}
      <span style={{ fontSize:16,flexShrink:0,marginTop:2 }}>{comp.flag||"🌐"}</span>

      {/* Info */}
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:1 }}>
          <span style={{ fontWeight:700,fontSize:12,color:T.text,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{comp.company}</span>
          <span style={{ background:c+"20",color:c,border:`1px solid ${c}40`,
            borderRadius:20,padding:"1px 5px",fontSize:8,fontWeight:700,
            textTransform:"capitalize",flexShrink:0 }}>
            {IND_ICON[comp.industry]}{comp.industry}
          </span>
        </div>
        <div style={{ fontSize:10,color:T.muted,marginBottom:3 }}>
          {comp.city} · {comp.employees} · <span style={{ color:T.teal }}>{comp.growth}</span>
        </div>
        <div style={{ display:"flex",gap:3,flexWrap:"nowrap",overflow:"hidden" }}>
          {comp.intent.slice(0,2).map(s=>(
            <span key={s} style={{ background:(SIG_COLOR[s]||T.muted)+"18",
              border:`1px solid ${(SIG_COLOR[s]||T.muted)+"40"}`,borderRadius:20,
              padding:"1px 5px",fontSize:8,fontWeight:600,color:SIG_COLOR[s]||T.muted,whiteSpace:"nowrap" }}>
              {s.replace(/_/g," ")}
            </span>
          ))}
          {comp.intent.length>2&&<span style={{ fontSize:8,color:T.faint }}>+{comp.intent.length-2}</span>}
        </div>
      </div>

      {/* Score */}
      <div style={{ flexShrink:0 }}>
        <ScoreBadge score={comp.top_score} size="md"/>
      </div>

      {/* Hover quick actions */}
      {hover&&(
        <div onClick={e=>e.stopPropagation()}
          style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
            display:"flex",gap:4,alignItems:"center",zIndex:10 }}>
          <Tip text="Bookmark">
            <button onClick={onBookmark}
              style={{ background:isBookmarked?T.yellow+"25":"rgba(255,255,255,0.07)",
                border:`1px solid ${isBookmarked?T.yellow+"60":T.border}`,
                borderRadius:5,padding:"3px 6px",fontSize:12,cursor:"pointer",
                color:isBookmarked?T.yellow:T.muted }}>
              {isBookmarked?"★":"☆"}
            </button>
          </Tip>
          <Tip text="Add CEO to pipeline">
            <button onClick={onQuickPipeline}
              style={{ background:T.blue+"20",border:`1px solid ${T.blue}50`,
                borderRadius:5,padding:"3px 7px",fontSize:10,fontWeight:700,
                cursor:"pointer",color:T.blue }}>+ Pipeline</button>
          </Tip>
        </div>
      )}
    </div>
  );
}

// ─── Company Detail Panel ─────────────────────────────────────────
function CompanyDetail({ comp, onUnlock, onPipeline, onMsg, onEmailModal, isBookmarked, onBookmark }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const c = IND_COLOR[comp.industry]||T.blue;

  useEffect(()=>{
    setDetail(null); setLoading(true);
    apiFetch(`/discovery/company/${comp.id}`)
      .then(r=>{ setDetail(r.company); setLoading(false); })
      .catch(()=>setLoading(false));
  },[comp.id]);

  const intel = detail?.intelligence||{};
  const contacts = detail?.contacts||comp.contacts||[];
  const countryMeta = detail?.country_meta||{};

  return (
    <div style={{ flex:1,overflowY:"auto",background:T.bg }}>
      {/* Hero */}
      <div style={{ padding:"18px 20px 14px",borderBottom:`1px solid ${T.border}`,
        background:`linear-gradient(135deg,${c}08 0%,transparent 60%)` }}>
        <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
          <Avatar name={comp.company} size={48} color={c} shape="rounded"/>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
              <div style={{ fontWeight:800,fontSize:18,color:T.text }}>{comp.company}</div>
              <button onClick={onBookmark} title="Bookmark"
                style={{ background:isBookmarked?T.yellow+"20":"transparent",
                  border:`1px solid ${isBookmarked?T.yellow+"60":"transparent"}`,
                  borderRadius:5,padding:"2px 6px",fontSize:14,cursor:"pointer",
                  color:isBookmarked?T.yellow:T.faint }}>
                {isBookmarked?"★":"☆"}
              </button>
            </div>
            <div style={{ fontSize:11,color:T.muted,marginBottom:6 }}>
              {comp.flag} {comp.city}, {comp.country_name} · <a href={`https://${comp.domain}`} target="_blank" rel="noreferrer"
                style={{ color:T.blue,textDecoration:"none" }}>{comp.domain}</a>
            </div>
            <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
              <span style={{ background:c+"20",color:c,border:`1px solid ${c}50`,borderRadius:20,
                padding:"2px 9px",fontSize:10,fontWeight:700,textTransform:"capitalize" }}>
                {IND_ICON[comp.industry]} {comp.industry}
              </span>
              <span style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,
                padding:"2px 9px",fontSize:10,color:T.muted }}>📅 {comp.founded}</span>
              <span style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,
                padding:"2px 9px",fontSize:10,color:T.muted }}>👥 {comp.employees}</span>
            </div>
          </div>
          <ScoreBadge score={comp.top_score} size="lg"/>
        </div>

        {/* KPI row */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginTop:12 }}>
          {[["💰 Revenue",comp.revenue,T.teal],
            ["🏦 Funding",comp.funding?.split("—")[0]?.trim(),T.blue],
            ["📈 Growth",comp.growth,T.green],
          ].map(([k,v,col])=>(
            <div key={k} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px" }}>
              <div style={{ fontSize:9,color:T.muted,marginBottom:2 }}>{k}</div>
              <div style={{ fontSize:12,fontWeight:700,color:col||T.text }}>{v||"—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Now */}
      <div style={{ padding:"14px 20px",borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:9,fontWeight:700,color:T.orange,textTransform:"uppercase",
          letterSpacing:"0.1em",marginBottom:8 }}>⚡ Why Reach Out Now</div>
        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
          {(intel.why_now_detail||comp.intent.map(i=>({signal:i,
            label:i.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase()),
            reason:SIG_WHY[i]||""
          }))).map(w=>(
            <div key={w.signal} style={{ display:"flex",gap:8,alignItems:"flex-start",
              padding:"7px 9px",background:T.surface,borderRadius:7,
              borderLeft:`3px solid ${SIG_COLOR[w.signal]||T.teal}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10,fontWeight:700,color:SIG_COLOR[w.signal]||T.teal,marginBottom:1 }}>{w.label}</div>
                {w.reason&&<div style={{ fontSize:10,color:T.muted,lineHeight:1.4 }}>{w.reason}</div>}
              </div>
            </div>
          ))}
        </div>
        {intel.pitch_angle&&(
          <div style={{ marginTop:9,padding:"9px 11px",background:T.teal+"10",
            border:`1px solid ${T.teal}30`,borderRadius:7 }}>
            <div style={{ fontSize:8,color:T.teal,fontWeight:700,marginBottom:3,textTransform:"uppercase" }}>💡 Suggested Pitch</div>
            <div style={{ fontSize:10,color:T.text,lineHeight:1.55 }}>{intel.pitch_angle}</div>
          </div>
        )}
      </div>

      {/* Tech Stack */}
      <div style={{ padding:"12px 20px",borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:9,fontWeight:700,color:T.blue,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7 }}>🛠️ Tech Stack</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
          {comp.tech.map(t=>(
            <span key={t} style={{ background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
              borderRadius:5,padding:"3px 8px",fontSize:10,color:T.muted }}>{t}</span>
          ))}
        </div>
        {intel.outreach_tip&&(
          <div style={{ marginTop:7,padding:"7px 9px",background:"rgba(255,255,255,0.02)",
            borderRadius:6,fontSize:10,color:T.muted,fontStyle:"italic",lineHeight:1.45,
            borderLeft:`2px solid ${T.border}` }}>
            💼 {intel.outreach_tip}
          </div>
        )}
      </div>

      {/* Contacts */}
      <div style={{ padding:"12px 20px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <div style={{ fontSize:9,fontWeight:700,color:T.purple,textTransform:"uppercase",letterSpacing:"0.1em" }}>
            👤 Key Contacts ({contacts.length})
          </div>
          <div style={{ fontSize:10,color:T.teal,fontWeight:600 }}>
            ₹{((detail?.total_potential_inr||comp.total_potential_inr||0)/1000).toFixed(0)}K potential
          </div>
        </div>
        {loading?(
          <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
            {[1,2,3].map(i=><div key={i} style={{ height:68,borderRadius:8,
              background:"rgba(255,255,255,0.04)",animation:"pulse 1.4s ease-in-out infinite" }}/>)}
          </div>
        ):(
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {contacts.map((ct,i)=>{
              const sc=ct.score||ct.score_base||75;
              const cc=sc>=80?T.red:sc>=65?T.orange:T.muted;
              const lbl=sc>=80?"HOT":sc>=65?"WARM":"COLD";
              return (
                <div key={i} style={{ background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:9,padding:"10px 12px",display:"flex",gap:8,alignItems:"center" }}>
                  <Avatar name={ct.name} size={34} color={cc}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:12,color:T.text }}>{ct.name}</div>
                    <div style={{ fontSize:10,color:T.muted }}>{ct.title} · {ct.dept}</div>
                    <div style={{ fontSize:10,color:T.faint,fontFamily:"monospace",marginTop:1 }}>{ct.email_masked}</div>
                  </div>
                  <div style={{ textAlign:"center",flexShrink:0 }}>
                    <div style={{ fontSize:15,fontWeight:800,color:cc }}>{sc}</div>
                    <div style={{ fontSize:8,fontWeight:700,color:cc }}>{lbl}</div>
                    <div style={{ fontSize:9,color:T.teal,marginTop:1 }}>₹{((ct.potential_inr||0)/1000).toFixed(0)}K</div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:4,flexShrink:0 }}>
                    <button onClick={()=>onEmailModal(comp,ct)}
                      style={{ background:T.purple+"20",color:T.purple,border:`1px solid ${T.purple}50`,
                        borderRadius:5,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer" }}>
                      ✉️ Email
                    </button>
                    <button onClick={()=>onUnlock(comp,ct)}
                      style={{ background:T.teal+"20",color:T.teal,border:`1px solid ${T.teal}50`,
                        borderRadius:5,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer" }}>
                      🔓 Unlock
                    </button>
                    <button onClick={()=>onPipeline(comp,ct)}
                      style={{ background:T.blue+"20",color:T.blue,border:`1px solid ${T.blue}50`,
                        borderRadius:5,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer" }}>
                      + Pipeline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compliance */}
      {(countryMeta.compliance||comp.compliance)&&(
        <div style={{ margin:"0 20px 20px",padding:"9px 11px",
          background:"rgba(255,255,255,0.02)",border:`1px solid ${T.border}`,borderRadius:7 }}>
          <div style={{ fontSize:8,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3 }}>📋 Compliance Note</div>
          <div style={{ fontSize:10,color:T.muted }}>
            <strong style={{ color:T.text }}>{countryMeta.compliance||comp.compliance}</strong>
            {" — "}{countryMeta.risk==="high"?"High GDPR-risk region. Obtain explicit consent before cold outreach.":"Standard compliance rules apply."}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats Header ─────────────────────────────────────────────────
function StatsHeader({ results, summary, sortBy, setSortBy, viewMode, setViewMode, exportUrl, credits, showMap, setShowMap }) {
  return (
    <div style={{ padding:"6px 14px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,
      display:"flex",alignItems:"center",gap:7,flexShrink:0,flexWrap:"wrap" }}>
      <div style={{ display:"flex",gap:8,fontSize:11 }}>
        <span><span style={{ color:T.text,fontWeight:700 }}>{results.length}</span> <span style={{ color:T.muted }}>cos</span></span>
        {summary&&<span><span style={{ color:T.blue,fontWeight:700 }}>{summary.contacts}</span> <span style={{ color:T.muted }}>contacts</span></span>}
        {summary&&summary.hot_leads>0&&<span style={{ color:T.red,fontWeight:700 }}>🔥 {summary.hot_leads} hot</span>}
        {summary&&<span style={{ color:T.teal,fontWeight:600 }}>₹{((summary.total_potential_inr||0)/100000).toFixed(1)}L</span>}
      </div>
      <div style={{ flex:1 }}/>
      {credits!=null&&(
        <Tip text="Lead unlock credits remaining">
          <span style={{ fontSize:10,color:T.faint,background:"rgba(255,255,255,0.03)",
            border:`1px solid ${T.border}`,borderRadius:4,padding:"2px 7px" }}>
            ⚡ {credits} credits
          </span>
        </Tip>
      )}
      <div style={{ display:"flex",gap:3 }}>
        {[["score","⚡ Score"],["potential","₹ Value"],["contacts","👥 Size"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSortBy(v)} style={{
            background:sortBy===v?T.blue+"25":"rgba(255,255,255,0.03)",
            color:sortBy===v?T.blue:T.muted,border:`1px solid ${sortBy===v?T.blue+"60":T.border}`,
            borderRadius:6,padding:"3px 8px",fontSize:9,fontWeight:600,cursor:"pointer" }}>{l}</button>
        ))}
      </div>
      {/* Map toggle */}
      <Tip text="Market Map — country heatmap">
        <button onClick={()=>setShowMap(v=>!v)} style={{
          background:showMap?T.purple+"25":"rgba(255,255,255,0.03)",
          border:`1px solid ${showMap?T.purple+"60":T.border}`,
          borderRadius:6,padding:"3px 8px",fontSize:10,color:showMap?T.purple:T.muted,cursor:"pointer" }}>
          🗺
        </button>
      </Tip>
      <div style={{ display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:5,padding:2,gap:1 }}>
        {[["split","⫿"],["list","☰"],["grid","⊞"]].map(([v,l])=>(
          <button key={v} onClick={()=>setViewMode(v)} style={{
            background:viewMode===v?T.blue:"transparent",color:viewMode===v?"#fff":T.muted,
            border:"none",borderRadius:3,padding:"3px 7px",fontSize:11,cursor:"pointer",transition:"all 0.12s" }}>{l}</button>
        ))}
      </div>
      <a href={exportUrl} target="_blank" rel="noreferrer" style={{
        background:"rgba(255,255,255,0.03)",color:T.muted,border:`1px solid ${T.border}`,
        borderRadius:5,padding:"4px 9px",fontSize:9,fontWeight:600,textDecoration:"none",
        display:"inline-flex",alignItems:"center",gap:2 }}>⬇ CSV</a>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────
function GridCard({ comp, isActive, onClick, isSelected, onToggleSelect, isBookmarked, onBookmark }) {
  const c = IND_COLOR[comp.industry]||T.blue;
  return (
    <div onClick={onClick} style={{ background:isActive?T.blue+"10":T.card,
      border:`1px solid ${isActive?T.blue+"60":T.border}`,borderRadius:11,padding:"13px",
      cursor:"pointer",transition:"all 0.15s",display:"flex",flexDirection:"column",gap:7,
      boxShadow:isActive?`0 0 0 2px ${T.blue}40`:"none" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div style={{ display:"flex",gap:7,alignItems:"center" }}>
          <span style={{ fontSize:22 }}>{comp.flag||"🌐"}</span>
          <div>
            <div style={{ fontWeight:700,fontSize:11,color:T.text,lineHeight:1.3 }}>{comp.company}</div>
            <div style={{ fontSize:9,color:T.muted }}>{comp.city}</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:4,alignItems:"center" }}>
          <button onClick={e=>{e.stopPropagation();onBookmark();}}
            style={{ background:"transparent",border:"none",cursor:"pointer",
              fontSize:13,color:isBookmarked?T.yellow:T.faint,padding:"0 2px" }}>
            {isBookmarked?"★":"☆"}
          </button>
          <div onClick={e=>{e.stopPropagation();onToggleSelect();}}
            style={{ width:13,height:13,borderRadius:3,
              background:isSelected?T.blue:"transparent",border:`1.5px solid ${isSelected?T.blue:T.border}`,
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
            {isSelected&&<span style={{ color:"#fff",fontSize:7,fontWeight:900 }}>✓</span>}
          </div>
        </div>
      </div>
      <div style={{ background:c+"18",border:`1px solid ${c}35`,borderRadius:20,
        padding:"2px 7px",fontSize:8,fontWeight:700,color:c,textTransform:"capitalize",alignSelf:"flex-start" }}>
        {IND_ICON[comp.industry]} {comp.industry}
      </div>
      <div style={{ fontSize:9,color:T.muted,lineHeight:1.7 }}>
        <div>💰 {comp.revenue}</div>
        <div style={{ color:T.teal }}>🏦 {comp.funding?.split("—")[0]?.trim()}</div>
        <div style={{ color:T.green }}>📈 {comp.growth}</div>
      </div>
      <div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>
        {comp.intent.slice(0,2).map(s=><IntentPill key={s} signal={s}/>)}
      </div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
        borderTop:`1px solid ${T.border}`,paddingTop:7,marginTop:2 }}>
        <ScoreBadge score={comp.top_score}/>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10,color:T.teal,fontWeight:600 }}>₹{((comp.total_potential_inr||0)/1000).toFixed(0)}K</div>
          <div style={{ fontSize:8,color:T.muted }}>{comp.contact_count} contacts</div>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Bar ─────────────────────────────────────────────────────
function BulkBar({ count, onPipeline, onEmail, onClear, onSelectHot, hotCount }) {
  if(!count&&!hotCount) return null;
  return (
    <div style={{ position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",
      background:T.surface,border:`1px solid ${T.blue}50`,borderRadius:11,
      padding:"10px 18px",display:"flex",alignItems:"center",gap:10,
      boxShadow:`0 8px 32px rgba(0,0,0,0.6),0 0 0 1px ${T.blue}25`,zIndex:800 }}>
      {hotCount>0&&!count&&(
        <button onClick={onSelectHot} style={{ background:T.red+"20",color:T.red,
          border:`1px solid ${T.red}50`,borderRadius:7,padding:"6px 12px",
          fontSize:11,fontWeight:700,cursor:"pointer" }}>
          🔥 Select {hotCount} Hot
        </button>
      )}
      {count>0&&<>
        <span style={{ fontSize:12,fontWeight:600,color:T.text }}>{count} selected</span>
        <button onClick={onPipeline} style={{ background:`linear-gradient(135deg,${T.blue},${T.teal})`,
          color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
          + Add All to Pipeline
        </button>
        <button onClick={onEmail} style={{ background:T.purple+"20",color:T.purple,
          border:`1px solid ${T.purple}50`,borderRadius:7,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
          ✉️ Batch Email
        </button>
        <button onClick={onClear} style={{ background:"rgba(255,255,255,0.05)",color:T.muted,
          border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 9px",fontSize:11,cursor:"pointer" }}>
          ✕
        </button>
      </>}
    </div>
  );
}

// ─── Bookmarks Panel ──────────────────────────────────────────────
function BookmarksPanel({ bookmarks, results, onSelect, onRemove }) {
  const saved = results.filter(r=>bookmarks.has(r.id));
  if(!saved.length) return (
    <div style={{ padding:20,textAlign:"center",color:T.muted,fontSize:12 }}>
      <div style={{ fontSize:32,marginBottom:8 }}>☆</div>
      No bookmarks yet. Star a company to save it here.
    </div>
  );
  return (
    <div style={{ overflowY:"auto",flex:1 }}>
      {saved.map(comp=>{
        const c=IND_COLOR[comp.industry]||T.blue;
        return (
          <div key={comp.id} style={{ padding:"10px 14px",borderBottom:`1px solid ${T.border}`,
            display:"flex",gap:8,alignItems:"center",cursor:"pointer" }}
            onClick={()=>onSelect(comp)}>
            <span style={{ fontSize:16 }}>{comp.flag||"🌐"}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600,fontSize:12,color:T.text }}>{comp.company}</div>
              <div style={{ fontSize:10,color:T.muted }}>{comp.city} · <span style={{ color:c }}>{comp.industry}</span></div>
            </div>
            <ScoreBadge score={comp.top_score}/>
            <button onClick={e=>{e.stopPropagation();onRemove(comp.id);}}
              style={{ background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,
                borderRadius:5,padding:"3px 7px",fontSize:10,color:T.muted,cursor:"pointer" }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyState({ hasFilters }) {
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:40,gap:10 }}>
      <div style={{ fontSize:48 }}>🌍</div>
      <div style={{ fontSize:15,fontWeight:700,color:T.text }}>
        {hasFilters?"No matches — try relaxing filters":"Discover your next customer"}
      </div>
      <div style={{ fontSize:12,color:T.muted,textAlign:"center",maxWidth:280,lineHeight:1.6 }}>
        {hasFilters?"Remove the industry or country filter to see more results.":"Click Discover or pick an industry chip above."}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function LeadDiscoveryEngine() {
  const [filters, setFilters]     = useState({});
  const [results, setResults]     = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [signals, setSignals]     = useState([]);
  const [countries, setCountries] = useState([]);
  const [stats, setStats]         = useState(null);
  const [credits, setCredits]     = useState(null);
  const [active, setActive]       = useState(null);
  const [selected, setSelected]   = useState(new Set());
  const [sortBy, setSortBy]       = useState("score");
  const [viewMode, setViewMode]   = useState("split");
  const [msg, setMsg]             = useState({ text:"", type:"ok" });
  const [page, setPage]           = useState(1);
  const [emailModal, setEmailModal] = useState(null); // {comp, contact}
  const [showMap, setShowMap]     = useState(false);
  const [mapData, setMapData]     = useState(null);
  const [leftPanel, setLeftPanel] = useState("list"); // list | bookmarks
  const [bookmarks, setBookmarks] = useLocalStorage("nn_bookmarks_v1", []);
  const bookmarkSet = useMemo(()=>new Set(bookmarks),[bookmarks]);

  const debouncedQ = useDebouncedValue(filters.q||"", 380);
  const didMount = useRef(false);
  const PAGE = 40;

  // Bootstrap
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

  // Load market map lazily
  useEffect(()=>{
    if(showMap&&!mapData) {
      apiFetch("/discovery/market-map").then(r=>setMapData(r.countries||[])).catch(()=>{});
    }
  },[showMap]);

  // Auto-search on debounced query
  useEffect(()=>{ if(didMount.current) doSearch(); },[debouncedQ]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h=e=>{
      if(e.key==="Escape"){ setActive(null); setEmailModal(null); }
      if(e.key==="/"&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="TEXTAREA"){
        e.preventDefault();
        document.querySelector("input[placeholder*='Search']")?.focus();
      }
      if((e.key==="ArrowDown"||e.key==="ArrowUp")&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="TEXTAREA"){
        e.preventDefault();
        setActive(prev=>{
          const idx=sorted.findIndex(r=>r.id===prev?.id);
          const next=e.key==="ArrowDown"?Math.min(idx+1,sorted.length-1):Math.max(idx-1,0);
          return sorted[next]||prev;
        });
      }
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);

  async function doSearch() {
    setLoading(true); setPage(1);
    try {
      const p=new URLSearchParams({limit:"200"});
      const F=filters;
      if(F.q) p.set("q",F.q);
      if(F.industry) p.set("industry",F.industry);
      if(F.country) p.set("country",F.country);
      if(F.funding) p.set("funding",F.funding);
      if(F.seniority) p.set("seniority",F.seniority);
      if(F.dept) p.set("dept",F.dept);
      if(F.intent) p.set("intent",F.intent);
      if(F.tech) p.set("tech",F.tech);
      if(F.min_score) p.set("min_score",F.min_score);
      const data=await apiFetch("/discovery/leads?"+p.toString());
      const rows=data.data||[];
      setResults(rows);
      setSummary(data.summary||null);
      setCredits(data.credits??null);
      if(rows.length>0&&(!active||!rows.find(r=>r.id===active?.id))) setActive(rows[0]);
    } catch(e){ flash("Failed to load leads. Is the backend running?","err"); }
    setLoading(false);
  }

  function flash(text, type="ok") {
    setMsg({text,type});
    setTimeout(()=>setMsg({text:"",type:"ok"}),4000);
  }

  async function handleUnlock(comp,ct) {
    try {
      const r=await apiFetch("/search/unlock",{method:"POST",body:JSON.stringify({
        company_domain:comp.domain, contact_name:ct.name,
      })});
      if(r.success) flash(`✅ Unlocked ${ct.name} — ${r.lead?.email||"Check inbox"}`);
      else flash("⚠️ "+r.detail,"err");
    } catch(e){ flash("⚠️ Need credits to unlock email.","err"); }
  }

  async function handlePipeline(comp,ct) {
    try {
      const r=await apiFetch("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
        company_name:comp.company, contact_name:ct.name||ct.first+" "+ct.last,
        contact_email:(ct.first||"").toLowerCase()+"."+(ct.last||"").toLowerCase()+"@"+comp.domain,
        contact_title:ct.title, country:comp.country, deal_value:0,
      })});
      if(r.success) flash(`📋 ${ct.name||ct.first+" "+ct.last} added to pipeline!`);
    } catch(e){ flash("Error adding to pipeline.","err"); }
  }

  async function quickPipeline(comp) {
    const ct=comp.contacts[0]; if(!ct) return;
    await handlePipeline(comp,ct);
  }

  async function bulkPipeline() {
    const sel=results.filter(r=>selected.has(r.id));
    let n=0;
    for(const comp of sel){
      const ct=comp.contacts[0]; if(!ct) continue;
      try{ await apiFetch("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
        company_name:comp.company, contact_name:ct.name||ct.first+" "+ct.last,
        contact_email:(ct.first||"").toLowerCase()+"."+(ct.last||"").toLowerCase()+"@"+comp.domain,
        contact_title:ct.title, country:comp.country, deal_value:0,
      })}); n++; }catch(e){}
    }
    setSelected(new Set());
    flash(`📋 Added ${n} leads to pipeline!`);
  }

  function toggleBookmark(id) {
    const next=bookmarkSet.has(id)?bookmarks.filter(x=>x!==id):[...bookmarks,id];
    setBookmarks(next);
  }

  function selectHotLeads() {
    const hot=new Set(results.filter(r=>r.top_score>=80).map(r=>r.id));
    setSelected(hot);
  }

  const sorted=useMemo(()=>[...results].sort((a,b)=>{
    if(sortBy==="potential") return (b.total_potential_inr||0)-(a.total_potential_inr||0);
    if(sortBy==="contacts") return b.contact_count-a.contact_count;
    return b.top_score-a.top_score;
  }),[results,sortBy]);

  const paginated=sorted.slice(0,page*PAGE);
  const exportUrl=useMemo(()=>{
    const p=new URLSearchParams();
    if(filters.industry) p.set("industry",filters.industry);
    if(filters.country) p.set("country",filters.country);
    if(filters.intent) p.set("intent",filters.intent);
    if(filters.min_score) p.set("min_score",filters.min_score);
    return `${API_BASE}/api/discovery/export-csv?${p.toString()}`;
  },[filters]);

  const hasFilters=!!(filters.industry||filters.country||filters.funding||filters.seniority||filters.intent||filters.tech||filters.q||filters.min_score>0);
  const hotCount=results.filter(r=>r.top_score>=80).length;

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg,fontFamily:"inherit" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
      `}</style>

      {/* ── Top Header ── */}
      <div style={{ padding:"9px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,
        display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
        <div style={{ width:28,height:28,borderRadius:7,
          background:`linear-gradient(135deg,${T.blue},${T.teal})`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>⚡</div>
        <div>
          <div style={{ fontWeight:800,fontSize:14,color:T.text,letterSpacing:"-0.02em" }}>Lead Discovery Engine</div>
          <div style={{ fontSize:10,color:T.muted }}>
            {stats?`${stats.total_companies} companies · ${stats.total_contacts} contacts · ${stats.total_countries} countries · 10 industries`:"Loading…"}
          </div>
        </div>
        <div style={{ flex:1 }}/>
        {hotCount>0&&!loading&&(
          <span style={{ background:T.red+"20",border:`1px solid ${T.red}40`,borderRadius:6,
            padding:"3px 9px",fontSize:11,fontWeight:700,color:T.red }}>
            🔥 {hotCount} hot leads
          </span>
        )}
        <span style={{ fontSize:10,color:T.faint,background:"rgba(255,255,255,0.03)",
          border:`1px solid ${T.border}`,borderRadius:4,padding:"2px 7px" }}>
          / search · ↑↓ navigate · Esc close
        </span>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar filters={filters} setFilters={setFilters}
        onSearch={doSearch} loading={loading}
        signals={signals} countries={countries}/>

      {/* ── Flash ── */}
      {msg.text&&(
        <div style={{ padding:"6px 16px",flexShrink:0,fontSize:12,color:T.text,
          background:msg.type==="err"?T.red+"18":T.teal+"18",
          borderBottom:`1px solid ${msg.type==="err"?T.red+"40":T.teal+"40"}`,
          display:"flex",justifyContent:"space-between",alignItems:"center",
          animation:"fadeIn 0.2s ease-out" }}>
          {msg.text}
          <button onClick={()=>setMsg({text:"",type:"ok"})}
            style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14 }}>✕</button>
        </div>
      )}

      {/* ── Stats + Sort ── */}
      <StatsHeader results={results} summary={summary}
        sortBy={sortBy} setSortBy={setSortBy}
        viewMode={viewMode} setViewMode={setViewMode}
        exportUrl={exportUrl} credits={credits}
        showMap={showMap} setShowMap={setShowMap}/>

      {/* ── Body ── */}
      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>

        {/* LEFT — List / Bookmarks (split & list modes) */}
        {(viewMode==="split"||viewMode==="list")&&(
          <div style={{ width:viewMode==="split"?320:"100%",flexShrink:0,
            borderRight:viewMode==="split"?`1px solid ${T.border}`:"none",
            display:"flex",flexDirection:"column",overflow:"hidden" }}>

            {/* Sub-tabs */}
            <div style={{ display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0 }}>
              {[["list","☰ Results"],["bookmarks",`★ Saved (${bookmarks.length})`]].map(([v,l])=>(
                <button key={v} onClick={()=>setLeftPanel(v)} style={{
                  flex:1,padding:"7px",fontSize:11,fontWeight:600,cursor:"pointer",
                  background:leftPanel===v?T.surface:"transparent",border:"none",
                  borderBottom:leftPanel===v?`2px solid ${T.blue}`:"2px solid transparent",
                  color:leftPanel===v?T.blue:T.muted,transition:"all 0.15s" }}>{l}</button>
              ))}
            </div>

            {leftPanel==="bookmarks"?(
              <BookmarksPanel bookmarks={bookmarkSet} results={results}
                onSelect={c=>{setActive(c);setLeftPanel("list");}}
                onRemove={id=>toggleBookmark(id)}/>
            ):(
              <div style={{ overflowY:"auto",flex:1 }}>
                {loading&&[1,2,3,4,5,6].map(i=><SkeletonRow key={i}/>)}
                {!loading&&results.length===0&&<EmptyState hasFilters={hasFilters}/>}
                {!loading&&paginated.map((comp,idx)=>(
                  <CompanyRow key={comp.id} comp={comp}
                    isActive={active?.id===comp.id}
                    onClick={()=>setActive(comp)}
                    isSelected={selected.has(comp.id)}
                    onToggleSelect={()=>{
                      setSelected(s=>{ const n=new Set(s); n.has(comp.id)?n.delete(comp.id):n.add(comp.id); return n; });
                    }}
                    isBookmarked={bookmarkSet.has(comp.id)}
                    onBookmark={()=>toggleBookmark(comp.id)}
                    onQuickPipeline={()=>quickPipeline(comp)}/>
                ))}
                {sorted.length>paginated.length&&(
                  <button onClick={()=>setPage(p=>p+1)}
                    style={{ margin:10,padding:"9px",width:"calc(100% - 20px)",background:T.surface,
                      color:T.blue,border:`1px solid ${T.blue}40`,borderRadius:7,
                      fontSize:11,fontWeight:600,cursor:"pointer" }}>
                    Load {Math.min(PAGE,sorted.length-paginated.length)} more ({sorted.length-paginated.length} left)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* RIGHT — Detail + Market Map (split) OR Grid */}
        {viewMode==="split"&&(
          <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
            {showMap?(
              <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
                <div style={{ padding:"10px 16px",borderBottom:`1px solid ${T.border}`,
                  background:T.sidebar,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontWeight:700,fontSize:13,color:T.text }}>🗺 Market Map</span>
                  <span style={{ fontSize:10,color:T.muted }}>Click a country to filter</span>
                  {filters.country&&<button onClick={()=>setFilters(f=>({...f,country:""}))}
                    style={{ background:T.red+"15",border:`1px solid ${T.red}40`,borderRadius:5,
                      padding:"2px 7px",fontSize:10,color:T.red,cursor:"pointer" }}>
                    ✕ {filters.country}
                  </button>}
                </div>
                <MarketMap data={mapData} activeCountry={filters.country}
                  onFilterCountry={cc=>{ setFilters(f=>({...f,country:cc})); doSearch(); }}/>
              </div>
            ) : active ? (
              <CompanyDetail comp={active} onUnlock={handleUnlock}
                onPipeline={handlePipeline} onMsg={flash}
                onEmailModal={(comp,ct)=>setEmailModal({comp,ct})}
                isBookmarked={bookmarkSet.has(active.id)}
                onBookmark={()=>toggleBookmark(active.id)}/>
            ) : (
              <EmptyState hasFilters={false}/>
            )}
          </div>
        )}

        {/* Grid view */}
        {viewMode==="grid"&&(
          <div style={{ flex:1,overflowY:"auto",padding:12 }}>
            {loading&&(
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:9 }}>
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} style={{ height:200,borderRadius:11,background:"rgba(255,255,255,0.04)",
                    animation:"pulse 1.4s ease-in-out infinite" }}/>
                ))}
              </div>
            )}
            {!loading&&results.length===0&&<EmptyState hasFilters={hasFilters}/>}
            {!loading&&(
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:9 }}>
                {paginated.map(comp=>(
                  <GridCard key={comp.id} comp={comp}
                    isActive={active?.id===comp.id}
                    onClick={()=>setActive(active?.id===comp.id?null:comp)}
                    isSelected={selected.has(comp.id)}
                    onToggleSelect={()=>{
                      setSelected(s=>{ const n=new Set(s); n.has(comp.id)?n.delete(comp.id):n.add(comp.id); return n; });
                    }}
                    isBookmarked={bookmarkSet.has(comp.id)}
                    onBookmark={()=>toggleBookmark(comp.id)}/>
                ))}
              </div>
            )}
            {sorted.length>paginated.length&&(
              <div style={{ textAlign:"center",padding:"18px 0" }}>
                <button onClick={()=>setPage(p=>p+1)} style={{ background:T.surface,color:T.blue,
                  border:`1px solid ${T.blue}40`,borderRadius:7,padding:"9px 22px",
                  fontSize:11,fontWeight:600,cursor:"pointer" }}>
                  Load more ({sorted.length-paginated.length} remaining)
                </button>
              </div>
            )}
            {active&&(
              <div style={{ marginTop:14,background:T.card,border:`1px solid ${T.border}`,
                borderRadius:11,overflow:"hidden" }}>
                <div style={{ padding:"9px 14px",borderBottom:`1px solid ${T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"space-between",background:T.sidebar }}>
                  <span style={{ fontWeight:700,fontSize:12,color:T.text }}>{active.company} — Full Profile</span>
                  <button onClick={()=>setActive(null)} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:16 }}>✕</button>
                </div>
                <CompanyDetail comp={active} onUnlock={handleUnlock}
                  onPipeline={handlePipeline} onMsg={flash}
                  onEmailModal={(comp,ct)=>setEmailModal({comp,ct})}
                  isBookmarked={bookmarkSet.has(active.id)}
                  onBookmark={()=>toggleBookmark(active.id)}/>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── List mode drawer ── */}
      {viewMode==="list"&&active&&(
        <>
          <div onClick={()=>setActive(null)}
            style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:700 }}/>
          <div style={{ position:"fixed",top:0,right:0,bottom:0,width:480,
            background:T.surface,borderLeft:`1px solid ${T.border}`,
            zIndex:800,overflowY:"auto",animation:"slideInRight 0.22s ease-out",
            boxShadow:"-12px 0 40px rgba(0,0,0,0.5)" }}>
            <div style={{ padding:"11px 14px",borderBottom:`1px solid ${T.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center",background:T.sidebar,flexShrink:0 }}>
              <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{active.company}</span>
              <button onClick={()=>setActive(null)} style={{ background:"rgba(255,255,255,0.06)",
                border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",color:T.muted,cursor:"pointer" }}>✕</button>
            </div>
            <CompanyDetail comp={active} onUnlock={handleUnlock}
              onPipeline={handlePipeline} onMsg={flash}
              onEmailModal={(comp,ct)=>setEmailModal({comp,ct})}
              isBookmarked={bookmarkSet.has(active.id)}
              onBookmark={()=>toggleBookmark(active.id)}/>
          </div>
        </>
      )}

      {/* ── Bulk Bar ── */}
      <BulkBar count={selected.size} hotCount={hotCount}
        onPipeline={bulkPipeline}
        onEmail={()=>{ const sel=results.filter(r=>selected.has(r.id)); if(sel[0]) setEmailModal({comp:sel[0],ct:sel[0].contacts[0]}); }}
        onClear={()=>setSelected(new Set())}
        onSelectHot={selectHotLeads}/>

      {/* ── Email Modal ── */}
      {emailModal&&<EmailModal comp={emailModal.comp} contact={emailModal.contact} onClose={()=>setEmailModal(null)}/>}
    </div>
  );
}
