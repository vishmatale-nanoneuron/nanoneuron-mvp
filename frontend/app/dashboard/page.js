"use client";
import { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE } from "../../lib/api";
import AIHub from "../components/AIHub";
import LeadDiscoveryEngine from "../components/LeadDiscoveryEngine";

// ─── Design Tokens ────────────────────────────────────────────────────────────
var T = {
  bg: "#07090F",
  sidebar: "#0B0D17",
  surface: "#0F1120",
  surfaceHover: "#141728",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.1)",
  blue: "#4F8EF7",
  teal: "#00D4AA",
  purple: "#A855F7",
  orange: "#FF8C42",
  green: "#00D97E",
  red: "#FF3B5C",
  textPrimary: "#E2E8F0",
  textMuted: "rgba(226,232,240,0.45)",
  textFaint: "rgba(226,232,240,0.2)",
};

var STAGE_COLORS = {
  lead: "#64748B", qualified: T.blue, proposal: T.purple,
  negotiation: T.orange, won: T.green, lost: T.red,
};

var NAV = [
  {id:"dashboard", icon:"⬛", label:"Dashboard"},
  {id:"discover",  icon:"🌍", label:"Discover Leads"},
  {id:"search",    icon:"🔍", label:"Search"},
  {id:"contacts",  icon:"👥", label:"Contacts"},
  {id:"pipeline",  icon:"📋", label:"Pipeline"},
  {id:"analytics", icon:"📊", label:"Analytics"},
  {id:"aihub",     icon:"⚡", label:"AI Hub"},
  {id:"notes",     icon:"📝", label:"Notes & Activity"},
  {id:"email",     icon:"✉", label:"AI Email"},
  {id:"invoices",  icon:"🧾", label:"Invoices"},
  {id:"earnings",  icon:"₹",  label:"Earnings"},
  {id:"payment",   icon:"💳", label:"Billing"},
];

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useWindow() {
  var [w, setW] = useState(0);
  useEffect(function(){
    function update(){ setW(window.innerWidth); }
    update();
    window.addEventListener("resize", update);
    return function(){ window.removeEventListener("resize", update); };
  }, []);
  return { isMobile: w > 0 && w < 768, isTablet: w > 0 && w < 1024, width: w };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function api(path, opts) { return apiFetch(path, opts); }

function Avatar({name, size=28}) {
  var initials = (name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  var colors = ["#4F8EF7","#A855F7","#00D4AA","#FF8C42","#00D97E","#FF3B5C"];
  var color = colors[(initials.charCodeAt(0)||0) % colors.length];
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:color+"20",border:"1px solid "+color+"40",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,fontWeight:700,color,flexShrink:0}}>
      {initials}
    </div>
  );
}

function ScorePill({score}) {
  var hot = score >= 75, warm = score >= 50;
  var color = hot ? T.red : warm ? T.orange : T.textFaint;
  var label = hot ? "HOT" : warm ? "WARM" : "COLD";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:20,
      fontSize:9,fontWeight:700,background:color+"18",color,letterSpacing:0.5}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color,flexShrink:0}}/>
      {score} {label}
    </span>
  );
}

function Pill({label, color}) {
  return (
    <span style={{padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:600,
      background:(color||T.blue)+"15",color:color||T.blue,whiteSpace:"nowrap"}}>
      {label}
    </span>
  );
}

function CompliancePill({status}) {
  var c = status === "action_needed" ? T.orange : status === "compliant" ? T.green : T.textMuted;
  var l = status === "action_needed" ? "Action Needed" : status === "compliant" ? "Compliant" : "Unchecked";
  return <Pill label={l} color={c}/>;
}

function Btn({children, onClick, variant="ghost", small, style}) {
  var bg = variant==="primary" ? `linear-gradient(135deg,${T.blue},${T.purple})`
         : variant==="teal"    ? T.teal+"20"
         : variant==="red"     ? T.red+"15"
         : "rgba(255,255,255,0.05)";
  var color = variant==="primary" ? "#07090F" : variant==="teal" ? T.teal : variant==="red" ? T.red : T.textPrimary;
  return (
    <button onClick={onClick} style={{
      padding: small ? "4px 10px" : "8px 16px",
      borderRadius: 7, border: "none", cursor: "pointer",
      fontSize: small ? 10 : 12, fontWeight: 600,
      background: bg, color, lineHeight: 1.4,
      transition: "opacity 0.15s", ...style
    }}>
      {children}
    </button>
  );
}

function SectionHeader({title, count, action}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:15,fontWeight:700,color:T.textPrimary}}>{title}</span>
        {count !== undefined && (
          <span style={{padding:"1px 8px",borderRadius:10,fontSize:10,fontWeight:600,
            background:T.blue+"20",color:T.blue}}>{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({label, value, sub, color, icon}) {
  return (
    <div style={{background:T.surface,borderRadius:10,border:"1px solid "+T.border,padding:16,position:"relative",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{label}</span>
        <span style={{fontSize:18,opacity:0.6}}>{icon}</span>
      </div>
      <div style={{fontSize:24,fontWeight:800,color:T.textPrimary,letterSpacing:-0.5}}>{value}</div>
      {sub && <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>{sub}</div>}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,${color||T.blue},transparent)`}}/>
    </div>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────
function FilterSidebar({industry, setIndustry, country, setCountry, empFilter, setEmpFilter,
  deptFilter, setDeptFilter, onSearch, loading}) {

  var inp = {width:"100%",background:T.surface,border:"1px solid "+T.border,borderRadius:7,
    padding:"8px 10px",color:T.textPrimary,fontSize:12,outline:"none"};

  return (
    <div style={{width:210,flexShrink:0,borderRight:"1px solid "+T.border,padding:"16px 14px",overflowY:"auto"}}>
      <div style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",
        letterSpacing:1,marginBottom:14}}>Filters</div>

      {[
        {label:"Industry", value:industry, set:setIndustry, opts:[
          {v:"",l:"All Industries"},{v:"saas",l:"SaaS / Software"},{v:"fintech",l:"Fintech"},
          {v:"ecommerce",l:"E-Commerce"},{v:"healthcare",l:"Healthcare"},{v:"legal",l:"Legal Tech"},
          {v:"manufacturing",l:"Manufacturing"},{v:"realestate",l:"Real Estate"},
          {v:"logistics",l:"Logistics"},{v:"cybersecurity",l:"Cybersecurity"},{v:"education",l:"Education"},
        ]},
        {label:"Country", value:country, set:setCountry, opts:[
          {v:"",l:"All Countries"},{v:"US",l:"🇺🇸 United States"},{v:"IN",l:"🇮🇳 India"},
          {v:"GB",l:"🇬🇧 United Kingdom"},{v:"DE",l:"🇩🇪 Germany"},{v:"AU",l:"🇦🇺 Australia"},
          {v:"CA",l:"🇨🇦 Canada"},{v:"FR",l:"🇫🇷 France"},{v:"SG",l:"🇸🇬 Singapore"},
          {v:"AE",l:"🇦🇪 UAE"},{v:"JP",l:"🇯🇵 Japan"},{v:"BR",l:"🇧🇷 Brazil"},{v:"IL",l:"🇮🇱 Israel"},
        ]},
        {label:"Company Size", value:empFilter, set:setEmpFilter, opts:[
          {v:"",l:"Any Size"},{v:"1-50",l:"1–50 (Startup)"},{v:"50-200",l:"50–200 (Small)"},
          {v:"200-1000",l:"200–1000 (Mid)"},{v:"1000+",l:"1000+ (Enterprise)"},
        ]},
        {label:"Department", value:deptFilter, set:setDeptFilter, opts:[
          {v:"",l:"All Departments"},{v:"Executive",l:"Executive"},{v:"Sales",l:"Sales"},
          {v:"Engineering",l:"Engineering"},{v:"Product",l:"Product"},{v:"Compliance",l:"Compliance"},
          {v:"Operations",l:"Operations"},
        ]},
      ].map(function(f){return (
        <div key={f.label} style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:600,color:T.textMuted,marginBottom:5}}>{f.label}</div>
          <select value={f.value} onChange={function(e){f.set(e.target.value)}} style={inp}>
            {f.opts.map(function(o){return <option key={o.v} value={o.v}>{o.l}</option>})}
          </select>
        </div>
      )})}

      <button onClick={onSearch} disabled={loading} style={{
        width:"100%",padding:"10px",borderRadius:8,border:"none",cursor:"pointer",
        fontSize:12,fontWeight:700,background:`linear-gradient(135deg,${T.blue},${T.purple})`,
        color:"#07090F",opacity:loading?0.5:1,marginTop:4,
      }}>
        {loading ? "Searching..." : "Find Leads"}
      </button>

      <div style={{marginTop:12,padding:"10px",background:T.blue+"10",borderRadius:8,
        border:"1px solid "+T.blue+"20"}}>
        <div style={{fontSize:9,color:T.blue,fontWeight:700,marginBottom:4}}>HOW IT WORKS</div>
        <div style={{fontSize:9,color:T.textMuted,lineHeight:1.7}}>
          1 credit = unlock full email<br/>
          HOT score = decision makers<br/>
          Compliance auto-checked
        </div>
      </div>
    </div>
  );
}

// ─── Search Results Table ─────────────────────────────────────────────────────
function SearchResults({results, onUnlock, onAddPipeline, onDraftEmail}) {
  var [expandedCompany, setExpandedCompany] = useState(null);
  var [sort, setSort] = useState({key:"score", dir:"desc"});

  if (!results) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:60,color:T.textFaint,textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:16,opacity:0.3}}>🔍</div>
      <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Discover your next clients</div>
      <div style={{fontSize:12}}>Select filters and click Find Leads</div>
    </div>
  );

  if (!results.data || results.data.length === 0) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
      color:T.textFaint,fontSize:13}}>No results. Try different filters.</div>
  );

  // Flatten to contact rows
  var rows = [];
  results.data.forEach(function(comp) {
    comp.contacts.forEach(function(c) {
      rows.push({...c, comp});
    });
  });

  // Sort
  rows.sort(function(a,b) {
    if (sort.key === "score") return sort.dir==="desc" ? b.lead_score-a.lead_score : a.lead_score-b.lead_score;
    if (sort.key === "company") return sort.dir==="desc" ? b.comp.company.localeCompare(a.comp.company) : a.comp.company.localeCompare(b.comp.company);
    return 0;
  });

  function toggleSort(key) {
    setSort(function(s){ return {key, dir: s.key===key && s.dir==="desc" ? "asc" : "desc"}; });
  }

  var thStyle = {padding:"8px 12px",fontSize:10,fontWeight:700,color:T.textMuted,
    textTransform:"uppercase",letterSpacing:0.8,textAlign:"left",cursor:"pointer",
    borderBottom:"1px solid "+T.border,whiteSpace:"nowrap"};

  return (
    <div style={{flex:1,overflow:"auto"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid "+T.border,
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:T.textMuted}}>
          <span style={{color:T.textPrimary,fontWeight:700}}>{rows.length}</span> contacts in{" "}
          <span style={{color:T.textPrimary,fontWeight:700}}>{results.data.length}</span> companies
        </span>
        <div style={{display:"flex",gap:6}}>
          <Btn small onClick={function(){api("/search/load-samples",{method:"POST"}).then(function(d){
            if(d.success) alert(d.message);
          })}}>Load Samples</Btn>
          <a href={API_BASE+"/api/search/export-csv"} style={{
            padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:600,
            background:T.purple+"15",color:T.purple,textDecoration:"none",display:"inline-flex",alignItems:"center",
          }}>Export CSV</a>
        </div>
      </div>

      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:T.surface}}>
            <th style={thStyle} onClick={function(){toggleSort("company")}}>
              Company {sort.key==="company" ? (sort.dir==="desc"?"↓":"↑") : ""}
            </th>
            <th style={thStyle}>Contact</th>
            <th style={thStyle}>Title / Department</th>
            <th style={thStyle} onClick={function(){toggleSort("score")}}>
              Score {sort.key==="score" ? (sort.dir==="desc"?"↓":"↑") : ""}
            </th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Location</th>
            <th style={thStyle}>Compliance</th>
            <th style={{...thStyle,textAlign:"right"}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(function(row, i) {
            var comp = row.comp;
            var compExpanded = expandedCompany === comp.domain;
            return (
              <tr key={i} style={{borderBottom:"1px solid "+T.border,
                background: i%2===0 ? "transparent" : T.surface+"60",
                transition:"background 0.1s"}}
                onMouseEnter={function(e){e.currentTarget.style.background=T.surfaceHover}}
                onMouseLeave={function(e){e.currentTarget.style.background= i%2===0 ? "transparent" : T.surface+"60"}}>

                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Avatar name={comp.company} size={28}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:T.textPrimary,whiteSpace:"nowrap"}}>{comp.company}</div>
                      <div style={{fontSize:10,color:T.textMuted}}>{comp.domain}</div>
                    </div>
                  </div>
                </td>

                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <Avatar name={row.name} size={24}/>
                    <span style={{fontSize:12,color:T.textPrimary,fontWeight:500,whiteSpace:"nowrap"}}>{row.name}</span>
                    {row.verified && <span style={{fontSize:8,padding:"1px 5px",borderRadius:6,
                      background:T.teal+"20",color:T.teal,fontWeight:700}}>✓ VER</span>}
                  </div>
                </td>

                <td style={{padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:T.textPrimary,whiteSpace:"nowrap"}}>{row.title}</div>
                  <div style={{fontSize:10,color:T.textMuted}}>{row.department}</div>
                </td>

                <td style={{padding:"10px 12px"}}><ScorePill score={row.lead_score}/></td>

                <td style={{padding:"10px 12px"}}>
                  <span style={{fontSize:11,color:T.textMuted,fontFamily:"monospace"}}>{row.email_masked}</span>
                </td>

                <td style={{padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:T.textPrimary}}>{comp.city}</div>
                  <div style={{fontSize:10,color:T.textMuted}}>{comp.country} · {comp.employees} emp</div>
                </td>

                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <span style={{fontSize:10,color:T.textMuted}}>{comp.compliance.law}</span>
                    <span style={{fontSize:9,padding:"1px 6px",borderRadius:6,display:"inline-block",
                      background: comp.compliance.risk==="high" ? T.red+"15" : T.green+"15",
                      color: comp.compliance.risk==="high" ? T.red : T.green,fontWeight:600}}>
                      {comp.compliance.risk.toUpperCase()} RISK
                    </span>
                  </div>
                </td>

                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                    <Btn small variant="teal" onClick={function(){onUnlock(comp.domain, row.name)}}>
                      Unlock
                    </Btn>
                    <Btn small onClick={function(){onAddPipeline(comp, row)}}>
                      + Pipeline
                    </Btn>
                    <Btn small style={{background:T.purple+"15",color:T.purple}}
                      onClick={function(){onDraftEmail(row.name, row.title, comp.company)}}>
                      Email
                    </Btn>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pipeline Board ───────────────────────────────────────────────────────────
// ─── Inline Note Panel (used inside deal cards + contact rows) ────────────────
function InlineNotePanel({dealId, contactId, onClose}) {
  var [notes, setNotes] = useState([]);
  var [text, setText] = useState("");
  var [type, setType] = useState("note");
  var [saving, setSaving] = useState(false);
  var NOTE_ICONS = {note:"📝",call:"📞",email:"✉️",meeting:"🤝",task:"✅"};
  var NOTE_COLORS = {note:"#4F8EF7",call:"#00D97E",email:"#A855F7",meeting:"#FF8C42",task:"#00D4AA"};

  useEffect(function(){
    var path = dealId ? "/notes/deal/"+dealId : "/notes/contact/"+contactId;
    apiFetch(path).then(function(r){ setNotes(r.notes||[]); });
  }, [dealId, contactId]);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    var body = {content:text, note_type:type};
    if (dealId) body.deal_id = dealId; else body.saved_lead_id = contactId;
    var r = await apiFetch("/notes/", {method:"POST", body:JSON.stringify(body)}).catch(()=>({}));
    if (r.success) {
      setNotes(function(prev){ return [r.note, ...prev]; });
      setText("");
    }
    setSaving(false);
  }

  return (
    <div style={{background:"#070910",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:12,marginTop:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:10,fontWeight:700,color:"rgba(226,232,240,0.5)",letterSpacing:0.8}}>ACTIVITY LOG</span>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(226,232,240,0.3)",fontSize:14,padding:0}}>✕</button>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"}}>
        {Object.entries(NOTE_ICONS).map(function([k,v]){
          return <button key={k} onClick={function(){setType(k)}} style={{
            padding:"3px 8px",borderRadius:12,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,
            background: type===k ? NOTE_COLORS[k] : "rgba(255,255,255,0.05)",
            color: type===k ? "#fff" : "rgba(226,232,240,0.4)"}}>
            {v} {k}
          </button>;
        })}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={text} onChange={function(e){setText(e.target.value)}}
          onKeyDown={function(e){if(e.key==="Enter") submit();}}
          placeholder="Log a note and press Enter..."
          style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:6,padding:"6px 10px",color:"#E2E8F0",fontSize:12,outline:"none"}}/>
        <button onClick={submit} disabled={saving||!text.trim()} style={{
          padding:"6px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
          background: saving?"rgba(79,142,247,0.3)":"#4F8EF7",color:"#fff"}}>
          {saving?"...":"Log"}
        </button>
      </div>
      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4,maxHeight:120,overflow:"auto"}}>
        {notes.length===0
          ? <div style={{fontSize:11,color:"rgba(226,232,240,0.25)",textAlign:"center",padding:"8px 0"}}>No notes yet</div>
          : notes.map(function(n){
            var ic = NOTE_ICONS[n.note_type]||"📝";
            var cl = NOTE_COLORS[n.note_type]||"#4F8EF7";
            return <div key={n.id} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
              <span style={{fontSize:12,marginTop:1}}>{ic}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"rgba(226,232,240,0.8)",lineHeight:1.4}}>{n.content}</div>
                <div style={{fontSize:9,color:"rgba(226,232,240,0.25)",marginTop:2}}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            </div>;
          })}
      </div>
    </div>
  );
}

// ─── New Deal Modal ────────────────────────────────────────────────────────────
var COUNTRIES_SHORT = ["US","GB","IN","DE","SG","JP","AE","AU","CA","FR","BR","KR","ZA","SA","NL","SE","IL","CN","NZ","HK","MY","TH","ID","PH","VN","PK","EG","NG","KE","MX"];
var CURRENCIES = ["USD","INR","GBP","EUR","SGD","JPY","AED","AUD","CAD","BRL"];

function NewDealModal({onClose, onCreated}) {
  var [form, setForm] = useState({
    title:"", company_name:"", contact_name:"",
    value:"", currency:"USD", stage:"lead", country:"US", notes:""
  });
  var [saving, setSaving] = useState(false);
  var [err, setErr] = useState("");

  function set(k, v) { setForm(function(f){return {...f, [k]:v};}); }

  async function submit() {
    if (!form.title.trim()) { setErr("Deal title is required"); return; }
    setSaving(true); setErr("");
    var r = await api("/deals/", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        title: form.title.trim(),
        value: parseFloat(form.value) || 0,
        currency: form.currency,
        stage: form.stage,
        country: form.country,
        notes: form.notes || undefined,
        company_name: form.company_name || undefined,
        contact_name: form.contact_name || undefined,
      })
    });
    setSaving(false);
    if (r.success) { onCreated(); onClose(); }
    else setErr(r.detail || "Error creating deal");
  }

  var inp = {width:"100%",background:T.bg,border:"1px solid "+T.border,borderRadius:8,
    padding:"9px 12px",color:T.textPrimary,fontSize:13,outline:"none",boxSizing:"border-box"};
  var label = {fontSize:10,fontWeight:700,color:T.textMuted,letterSpacing:0.5,
    display:"block",marginBottom:4,textTransform:"uppercase"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.surface,borderRadius:16,border:"1px solid "+T.borderStrong,
        padding:28,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.textPrimary}}>＋ New Deal</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Manually add a deal to your pipeline</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,
            cursor:"pointer",fontSize:18,padding:4}}>✕</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={label}>Deal Title *</label>
            <input value={form.title} onChange={function(e){set("title",e.target.value)}}
              placeholder="e.g. Acme Corp — Enterprise CRM" style={inp}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={label}>Company</label>
              <input value={form.company_name} onChange={function(e){set("company_name",e.target.value)}}
                placeholder="Company name" style={inp}/>
            </div>
            <div>
              <label style={label}>Contact Name</label>
              <input value={form.contact_name} onChange={function(e){set("contact_name",e.target.value)}}
                placeholder="Decision maker" style={inp}/>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={label}>Deal Value</label>
              <input type="number" value={form.value} onChange={function(e){set("value",e.target.value)}}
                placeholder="0" style={inp} min="0"/>
            </div>
            <div>
              <label style={label}>Currency</label>
              <select value={form.currency} onChange={function(e){set("currency",e.target.value)}}
                style={{...inp,cursor:"pointer"}}>
                {CURRENCIES.map(function(c){return <option key={c} value={c}>{c}</option>;})}
              </select>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={label}>Stage</label>
              <select value={form.stage} onChange={function(e){set("stage",e.target.value)}}
                style={{...inp,cursor:"pointer",color:STAGE_COLORS[form.stage]}}>
                {["lead","qualified","proposal","negotiation"].map(function(s){
                  return <option key={s} value={s} style={{color:STAGE_COLORS[s]}}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>;
                })}
              </select>
            </div>
            <div>
              <label style={label}>Country</label>
              <select value={form.country} onChange={function(e){set("country",e.target.value)}}
                style={{...inp,cursor:"pointer"}}>
                {COUNTRIES_SHORT.map(function(c){return <option key={c} value={c}>{c}</option>;})}
              </select>
            </div>
          </div>

          <div>
            <label style={label}>Notes (optional)</label>
            <textarea value={form.notes} onChange={function(e){set("notes",e.target.value)}}
              placeholder="Add context, requirements, or key info..."
              style={{...inp,minHeight:72,resize:"vertical",lineHeight:1.5}}/>
          </div>

          {err && <div style={{padding:"8px 12px",background:T.red+"12",border:"1px solid "+T.red+"25",
            borderRadius:7,fontSize:12,color:T.red}}>{err}</div>}

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" onClick={submit} style={{opacity:saving?0.6:1}}>
              {saving ? "Creating..." : "Create Deal"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Board ────────────────────────────────────────────────────────────
function followUpStatus(dateStr) {
  if (!dateStr) return null;
  var d = new Date(dateStr); var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var diff = Math.round((due - today) / 86400000);
  if (diff < 0) return {label:"Overdue "+Math.abs(diff)+"d", color:T.red};
  if (diff === 0) return {label:"Follow up Today", color:T.orange};
  return {label:"Follow up in "+diff+"d", color:T.blue};
}

function DealCoachPanel({deal, onClose}) {
  var [loading, setLoading] = useState(true);
  var [coach, setCoach] = useState(null);
  var [err, setErr] = useState(null);

  useEffect(function() {
    var days = 0;
    if (deal.updated_at) {
      days = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86400000);
    }
    api("/claude/deal-coach", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        deal_title: deal.title,
        deal_value: deal.value,
        stage: deal.stage,
        country: deal.country || "US",
        contact_title: deal.contact_title || "",
        days_in_stage: days,
        notes: deal.notes || "",
        company_name: deal.company || "",
        industry: deal.industry || "",
      })
    }).then(function(r){
      if (r.success && r.coaching) setCoach(r.coaching);
      else setErr("Coach unavailable");
      setLoading(false);
    }).catch(function(){ setErr("Network error"); setLoading(false); });
  }, [deal.id]);

  var healthColor = coach ? (coach.deal_health === "strong" ? T.green : coach.deal_health === "at_risk" ? T.red : T.orange) : T.textMuted;
  var healthLabel = coach ? coach.deal_health?.replace("_"," ").toUpperCase() : "";

  return (
    <div style={{marginTop:6,padding:10,background:"rgba(168,85,247,0.06)",borderRadius:8,
      border:"1px solid rgba(168,85,247,0.2)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:10,fontWeight:700,color:T.purple}}>🤖 AI Deal Coach</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:12}}>✕</button>
      </div>

      {loading && (
        <div style={{textAlign:"center",padding:"12px 0",color:T.textMuted,fontSize:10}}>
          Analyzing deal...
        </div>
      )}

      {err && <div style={{fontSize:10,color:T.red}}>{err}</div>}

      {coach && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {/* Win Probability + Deal Health */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:9,color:T.textMuted}}>Win Probability</span>
                <span style={{fontSize:10,fontWeight:700,color:T.teal}}>{coach.win_probability}%</span>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:coach.win_probability+"%",borderRadius:3,
                  background:`linear-gradient(90deg,${T.blue},${T.teal})`}}/>
              </div>
            </div>
            <div style={{padding:"2px 7px",borderRadius:5,background:healthColor+"15",border:"1px solid "+healthColor+"30"}}>
              <span style={{fontSize:9,fontWeight:700,color:healthColor}}>{healthLabel}</span>
            </div>
          </div>

          {/* Immediate Action */}
          {coach.immediate_action && (
            <div style={{padding:"6px 8px",background:T.orange+"12",borderRadius:5,border:"1px solid "+T.orange+"25",borderLeft:"3px solid "+T.orange}}>
              <div style={{fontSize:8,fontWeight:700,color:T.orange,marginBottom:2}}>⚡ IMMEDIATE ACTION</div>
              <div style={{fontSize:10,color:T.textPrimary,lineHeight:1.5}}>{coach.immediate_action}</div>
            </div>
          )}

          {/* Country Insight */}
          {coach.country_insight && (
            <div style={{padding:"6px 8px",background:T.blue+"10",borderRadius:5,border:"1px solid "+T.blue+"25"}}>
              <div style={{fontSize:8,fontWeight:700,color:T.blue,marginBottom:2}}>🌍 CULTURAL INSIGHT</div>
              <div style={{fontSize:10,color:T.textPrimary,lineHeight:1.5}}>{coach.country_insight}</div>
            </div>
          )}

          {/* Talk Track */}
          {coach.talk_track && (
            <div style={{padding:"6px 8px",background:T.purple+"10",borderRadius:5,border:"1px solid "+T.purple+"25"}}>
              <div style={{fontSize:8,fontWeight:700,color:T.purple,marginBottom:2}}>💬 TALK TRACK</div>
              <div style={{fontSize:10,color:T.textPrimary,lineHeight:1.5,fontStyle:"italic"}}>"{coach.talk_track}"</div>
            </div>
          )}

          {/* Best Contact Time */}
          {coach.best_contact_time && (
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:9,color:T.textMuted}}>📅 Best time to reach:</span>
              <span style={{fontSize:9,fontWeight:600,color:T.teal}}>{coach.best_contact_time}</span>
            </div>
          )}

          {/* Compliance Alert */}
          {coach.compliance_alert && (
            <div style={{padding:"5px 8px",background:T.red+"10",borderRadius:5,border:"1px solid "+T.red+"25"}}>
              <div style={{fontSize:8,fontWeight:700,color:T.red,marginBottom:2}}>⚠ COMPLIANCE</div>
              <div style={{fontSize:10,color:T.textPrimary,lineHeight:1.5}}>{coach.compliance_alert}</div>
            </div>
          )}

          {/* Next Steps */}
          {coach.next_steps && coach.next_steps.length > 0 && (
            <div>
              <div style={{fontSize:8,fontWeight:700,color:T.textMuted,marginBottom:4}}>NEXT STEPS</div>
              {coach.next_steps.map(function(step, i) {
                return (
                  <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                    <span style={{width:14,height:14,borderRadius:"50%",background:T.blue+"20",color:T.blue,
                      fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>
                    <span style={{fontSize:10,color:T.textPrimary,lineHeight:1.4}}>{step}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Red Flags */}
          {coach.red_flags && coach.red_flags.length > 0 && (
            <div style={{padding:"5px 8px",background:"rgba(255,59,92,0.06)",borderRadius:5,border:"1px solid rgba(255,59,92,0.15)"}}>
              <div style={{fontSize:8,fontWeight:700,color:T.red,marginBottom:4}}>🚩 RED FLAGS</div>
              {coach.red_flags.map(function(flag, i) {
                return <div key={i} style={{fontSize:10,color:"rgba(226,232,240,0.7)",lineHeight:1.4,marginBottom:2}}>• {flag}</div>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DealCard({deal, stages, onMoveStage, onDelete, onFollowUpSet}) {
  var [showNotes, setShowNotes] = useState(false);
  var [showDate, setShowDate] = useState(false);
  var [showCoach, setShowCoach] = useState(false);
  var [dateVal, setDateVal] = useState(deal.follow_up_date ? deal.follow_up_date.slice(0,10) : "");
  var fuStatus = followUpStatus(deal.follow_up_date);

  function saveFollowUp() {
    onFollowUpSet(deal.id, dateVal);
    setShowDate(false);
  }

  return (
    <div style={{background:T.surface,borderRadius:"0 0 8px 8px",
      border:"1px solid "+T.border,borderTop:"none",padding:12}}>
      <div style={{fontSize:12,fontWeight:600,color:T.textPrimary,marginBottom:4,lineHeight:1.3}}>{deal.title}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,fontWeight:700,color:T.teal,fontFamily:"monospace"}}>
          ${(deal.value/1000).toFixed(0)}K
        </span>
        <CompliancePill status={deal.compliance_status}/>
      </div>

      {/* Follow-up badge */}
      {fuStatus && (
        <div onClick={function(){setShowDate(function(v){return !v;})}}
          style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",
            borderRadius:5,marginBottom:6,cursor:"pointer",
            background:fuStatus.color+"18",border:"1px solid "+fuStatus.color+"40"}}>
          <span style={{fontSize:9,color:fuStatus.color,fontWeight:700}}>⏰ {fuStatus.label}</span>
        </div>
      )}

      {deal.notes && (
        <div style={{fontSize:10,color:T.textMuted,marginBottom:6,padding:"4px 6px",
          background:"rgba(255,255,255,0.03)",borderRadius:4,lineHeight:1.4,
          borderLeft:"2px solid rgba(255,255,255,0.1)"}}>
          {deal.notes.split("\n").pop().slice(0,60)}{deal.notes.length>60?"…":""}
        </div>
      )}

      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>
        {stages.filter(function(s){return s!==deal.stage && s!=="lost"}).slice(0,3).map(function(s){
          return (
            <button key={s} onClick={function(){onMoveStage(deal.id,s)}} style={{
              padding:"2px 7px",borderRadius:4,border:"none",cursor:"pointer",
              fontSize:8,fontWeight:600,background:STAGE_COLORS[s]+"15",
              color:STAGE_COLORS[s],textTransform:"capitalize"}}>
              → {s}
            </button>
          );
        })}
        <button onClick={function(){setShowDate(function(v){return !v;})}} style={{
          padding:"2px 7px",borderRadius:4,border:"none",cursor:"pointer",
          fontSize:8,fontWeight:600,
          background:showDate?T.orange+"20":"rgba(255,255,255,0.06)",
          color:showDate?T.orange:"rgba(226,232,240,0.4)"}}>
          ⏰ {fuStatus ? "Edit" : "Follow-up"}
        </button>
        <button onClick={function(){setShowNotes(function(v){return !v;})}} style={{
          padding:"2px 7px",borderRadius:4,border:"none",cursor:"pointer",
          fontSize:8,fontWeight:600,
          background: showNotes?"rgba(79,142,247,0.2)":"rgba(255,255,255,0.06)",
          color: showNotes?"#4F8EF7":"rgba(226,232,240,0.4)"}}>
          📝 Notes
        </button>
        <button onClick={function(){setShowCoach(function(v){return !v;});setShowNotes(false);}} style={{
          padding:"2px 7px",borderRadius:4,border:"none",cursor:"pointer",
          fontSize:8,fontWeight:600,
          background: showCoach?"rgba(168,85,247,0.2)":"rgba(255,255,255,0.06)",
          color: showCoach?T.purple:"rgba(226,232,240,0.4)"}}>
          🤖 Coach
        </button>
        <button onClick={function(){onDelete(deal.id)}} style={{
          padding:"2px 7px",borderRadius:4,border:"none",cursor:"pointer",
          fontSize:8,fontWeight:600,background:"rgba(255,59,92,0.1)",color:"#FF3B5C",marginLeft:"auto"}}>
          ✕
        </button>
      </div>

      {/* Follow-up date picker */}
      {showDate && (
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,
          padding:"6px 8px",background:T.bg,borderRadius:6,border:"1px solid "+T.border}}>
          <input type="date" value={dateVal} onChange={function(e){setDateVal(e.target.value)}}
            style={{flex:1,background:"transparent",border:"none",color:T.textPrimary,
              fontSize:11,outline:"none",colorScheme:"dark"}}/>
          <button onClick={saveFollowUp}
            style={{padding:"3px 8px",borderRadius:4,border:"none",cursor:"pointer",
              background:T.orange+"25",color:T.orange,fontSize:10,fontWeight:700}}>Set</button>
          {fuStatus && (
            <button onClick={function(){onFollowUpSet(deal.id,"");setShowDate(false);setDateVal("");}}
              style={{padding:"3px 8px",borderRadius:4,border:"none",cursor:"pointer",
                background:T.red+"15",color:T.red,fontSize:10,fontWeight:700}}>Clear</button>
          )}
        </div>
      )}

      {showNotes && <InlineNotePanel dealId={deal.id} onClose={function(){setShowNotes(false)}}/>}
      {showCoach && <DealCoachPanel deal={deal} onClose={function(){setShowCoach(false)}}/>}
    </div>
  );
}

function PipelineBoard({deals, pipeline, onMoveStage, onRefresh, onDeleteDeal, onFollowUpSet}) {
  var stages = ["lead","qualified","proposal","negotiation","won","lost"];
  var {API_BASE} = require("../../lib/api");
  var [showNewDeal, setShowNewDeal] = useState(false);

  return (
    <div style={{flex:1,overflow:"auto",padding:16}}>
      {showNewDeal && (
        <NewDealModal
          onClose={function(){setShowNewDeal(false);}}
          onCreated={function(){onRefresh();setShowNewDeal(false);}}
        />
      )}
      <SectionHeader title="Deal Pipeline"
        count={deals.length}
        action={
          <div style={{display:"flex",gap:8}}>
            <a href={API_BASE+"/api/deals/export-csv"}
              style={{padding:"4px 10px",borderRadius:7,border:"1px solid "+T.border,
                background:"transparent",color:T.textMuted,fontSize:10,fontWeight:600,
                textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>
              ⬇ CSV
            </a>
            <Btn small onClick={function(){setShowNewDeal(true);}}>＋ New Deal</Btn>
            <Btn small variant="primary" onClick={onRefresh}>Refresh</Btn>
          </div>
        }
      />
      <div className="pipeline-board" style={{display:"flex",gap:10,minWidth:"max-content"}}>
        {stages.map(function(stage) {
          var color = STAGE_COLORS[stage];
          var p = pipeline[stage] || {count:0, value:0};
          var stageDeals = deals.filter(function(d){return d.stage===stage});
          return (
            <div className="pipeline-col" key={stage} style={{width:240,flexShrink:0}}>
              <div style={{background:T.surface,borderRadius:"10px 10px 0 0",
                border:"1px solid "+T.border,borderBottom:"2px solid "+color,
                padding:"10px 12px",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:color,display:"inline-block"}}/>
                    <span style={{fontSize:11,fontWeight:700,color:T.textPrimary,textTransform:"capitalize"}}>{stage}</span>
                  </div>
                  <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,background:color+"20",color}}>{p.count}</span>
                </div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:4,fontFamily:"monospace"}}>
                  ${(p.value/1000).toFixed(0)}K pipeline
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {stageDeals.map(function(deal) {
                  return <DealCard key={deal.id} deal={deal} stages={stages}
                    onMoveStage={onMoveStage} onDelete={onDeleteDeal}
                    onFollowUpSet={onFollowUpSet}/>;
                })}
                {stageDeals.length===0 && (
                  <div style={{padding:"20px 12px",textAlign:"center",color:T.textFaint,fontSize:11,
                    border:"1px dashed "+T.border,borderTop:"none",borderRadius:"0 0 8px 8px"}}>
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Contacts Book ────────────────────────────────────────────────────────────
var STATUS_COLORS = {discovered:"#4F8EF7",contacted:"#A855F7",meeting:"#FF8C42",won:"#00D97E",lost:"#FF3B5C"};
var STATUSES = ["discovered","contacted","meeting","won","lost"];

function ContactRow({c, idx, onStatusChange}) {
  var [open, setOpen] = useState(false);
  var [status, setStatus] = useState(c.status);
  var [updating, setUpdating] = useState(false);

  async function changeStatus(s) {
    setUpdating(true);
    await apiFetch("/search/contacts/"+c.id, {method:"PATCH",
      body:JSON.stringify({status:s})}).catch(()=>{});
    setStatus(s);
    onStatusChange(c.id, s);
    setUpdating(false);
  }

  var rowBg = idx%2===0 ? "transparent" : "rgba(15,17,32,0.6)";
  return (
    <>
      <tr style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:rowBg,
        cursor:"pointer",transition:"background 0.15s"}}
        onMouseEnter={function(e){e.currentTarget.style.background="rgba(20,23,40,0.9)"}}
        onMouseLeave={function(e){e.currentTarget.style.background=rowBg}}>
        <td style={{padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Avatar name={c.name} size={26}/>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#E2E8F0"}}>{c.name}</div>
              <div style={{fontSize:10,color:"rgba(226,232,240,0.35)"}}>{c.country}</div>
            </div>
          </div>
        </td>
        <td style={{padding:"10px 12px",fontSize:12,color:"#E2E8F0"}}>{c.company}</td>
        <td style={{padding:"10px 12px",fontSize:11,color:"rgba(226,232,240,0.5)",whiteSpace:"nowrap"}}>{c.title}</td>
        <td style={{padding:"10px 12px",fontSize:11,color:"rgba(226,232,240,0.5)",fontFamily:"monospace"}}>{c.email}</td>
        <td style={{padding:"10px 12px"}}><ScorePill score={c.lead_score||0}/></td>
        <td style={{padding:"10px 12px"}}>
          <select value={status} onChange={function(e){changeStatus(e.target.value)}}
            disabled={updating}
            style={{background:STATUS_COLORS[status]+"18",border:"1px solid "+STATUS_COLORS[status]+"40",
              borderRadius:6,padding:"3px 6px",color:STATUS_COLORS[status],fontSize:11,fontWeight:600,
              outline:"none",cursor:"pointer"}}>
            {STATUSES.map(function(s){return <option key={s} value={s}>{s}</option>;})}
          </select>
        </td>
        <td style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:"#00D4AA",fontFamily:"monospace"}}>
          {c.deal_value > 0 ? "$"+(c.deal_value/1000).toFixed(0)+"K" : "—"}
        </td>
        <td style={{padding:"10px 12px"}}>
          <button onClick={function(){setOpen(function(v){return !v;})}} style={{
            padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
            background: open?"rgba(79,142,247,0.2)":"rgba(255,255,255,0.06)",
            color: open?"#4F8EF7":"rgba(226,232,240,0.4)"}}>
            📝 {open?"Close":"Notes"}
          </button>
        </td>
      </tr>
      {open && (
        <tr style={{background:"#07090F"}}>
          <td colSpan={8} style={{padding:"0 12px 12px 52px"}}>
            <InlineNotePanel contactId={c.id} onClose={function(){setOpen(false)}}/>
          </td>
        </tr>
      )}
    </>
  );
}

function ContactCard({c, onStatusChange}) {
  var [open, setOpen] = useState(false);
  var [status, setStatus] = useState(c.status);
  async function changeStatus(s) {
    await apiFetch("/search/contacts/"+c.id, {method:"PATCH", body:JSON.stringify({status:s})}).catch(()=>{});
    setStatus(s);
    onStatusChange(c.id, s);
  }
  return (
    <div style={{background:T.surface,borderRadius:10,border:"1px solid "+T.border,padding:12,marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <Avatar name={c.name} size={34}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{c.name}</div>
          <div style={{fontSize:11,color:T.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title} · {c.company}</div>
        </div>
        <ScorePill score={c.lead_score||0}/>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <span style={{fontSize:10,color:T.textMuted,fontFamily:"monospace",flex:1,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email||"—"}</span>
        <span style={{fontSize:10,fontWeight:700,color:T.teal,fontFamily:"monospace"}}>
          {c.deal_value > 0 ? "$"+(c.deal_value/1000).toFixed(0)+"K" : "—"}
        </span>
      </div>
      <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
        <select value={status} onChange={function(e){changeStatus(e.target.value)}}
          style={{flex:1,background:STATUS_COLORS[status]+"18",border:"1px solid "+STATUS_COLORS[status]+"40",
            borderRadius:6,padding:"4px 6px",color:STATUS_COLORS[status],fontSize:11,fontWeight:600,outline:"none"}}>
          {STATUSES.map(function(s){return <option key={s} value={s}>{s}</option>;})}
        </select>
        <button onClick={function(){setOpen(function(v){return !v;})}} style={{
          padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
          background:open?"rgba(79,142,247,0.2)":"rgba(255,255,255,0.06)",
          color:open?"#4F8EF7":"rgba(226,232,240,0.4)"}}>
          📝 Notes
        </button>
      </div>
      {open && <InlineNotePanel contactId={c.id} onClose={function(){setOpen(false)}}/>}
    </div>
  );
}

function ContactsBook() {
  var [contacts, setContacts] = useState([]);
  var [q, setQ] = useState("");
  var [statusFilter, setStatusFilter] = useState("");
  var [loading, setLoading] = useState(true);
  var {isMobile} = useWindow();

  useEffect(function(){
    api("/search/contacts").then(function(d){
      if(d.success){ setContacts(d.data); setLoading(false); }
    });
  }, []);

  function handleStatusChange(id, newStatus) {
    setContacts(function(prev){ return prev.map(function(c){ return c.id===id ? {...c, status:newStatus} : c; }); });
  }

  var filtered = useMemo(function(){
    return contacts.filter(function(c){
      if(statusFilter && c.status !== statusFilter) return false;
      if(q){
        var h = (c.name+" "+c.company+" "+c.title+" "+(c.email||"")).toLowerCase();
        if(!h.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [contacts, q, statusFilter]);

  var thStyle = {padding:"8px 12px",fontSize:10,fontWeight:700,color:"rgba(226,232,240,0.4)",
    textTransform:"uppercase",letterSpacing:0.8,textAlign:"left",
    borderBottom:"1px solid rgba(255,255,255,0.06)",whiteSpace:"nowrap"};

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input value={q} onChange={function(e){setQ(e.target.value)}} placeholder="Search contacts..."
          style={{flex:1,minWidth:120,background:"#0F1120",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,
            padding:"7px 12px",color:"#E2E8F0",fontSize:12,outline:"none"}}/>
        <select value={statusFilter} onChange={function(e){setStatusFilter(e.target.value)}}
          style={{background:"#0F1120",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"7px 10px",
            color:"#E2E8F0",fontSize:12,outline:"none"}}>
          <option value="">All</option>
          {STATUSES.map(function(s){
            return <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>;
          })}
        </select>
        <a href={API_BASE+"/api/search/export-csv"} style={{
          padding:"6px 12px",borderRadius:7,fontSize:11,fontWeight:600,
          background:"rgba(168,85,247,0.15)",color:"#A855F7",textDecoration:"none"}}>
          ⬇ CSV
        </a>
        <span style={{fontSize:11,color:"rgba(226,232,240,0.5)"}}>
          <span style={{color:"#E2E8F0",fontWeight:700}}>{filtered.length}</span>
        </span>
      </div>

      <div style={{flex:1,overflow:"auto"}}>
        {loading ? (
          <div style={{padding:40,textAlign:"center",color:"rgba(226,232,240,0.2)",fontSize:13}}>Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:60,textAlign:"center",color:"rgba(226,232,240,0.2)"}}>
            <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>👥</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No contacts yet</div>
            <div style={{fontSize:12}}>Unlock leads from Discover or Search to build your contact book</div>
          </div>
        ) : isMobile ? (
          <div style={{padding:12}}>
            {filtered.map(function(c){
              return <ContactCard key={c.id} c={c} onStatusChange={handleStatusChange}/>;
            })}
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#0B0D17"}}>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Value</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(c, i) {
                return <ContactRow key={c.id} c={c} idx={i} onStatusChange={handleStatusChange}/>;
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Overview ───────────────────────────────────────────────────────
function DashboardOverview({stats, pipeline}) {
  var stageOrder = ["lead","qualified","proposal","negotiation","won","lost"];
  var totalPipelineDeals = stageOrder.reduce(function(s,k){return s+(pipeline[k]||{count:0}).count;},0) || 1;
  var [followups, setFollowups] = useState({overdue:[],today:[],upcoming:[]});
  var {isMobile} = useWindow();

  useEffect(function(){
    api("/deals/followups").then(function(d){
      if(d.success) setFollowups({overdue:d.overdue||[],today:d.today||[],upcoming:d.upcoming||[]});
    });
  }, []);

  var totalDue = followups.overdue.length + followups.today.length;

  return (
    <div style={{flex:1,overflow:"auto",padding:isMobile?12:20}}>
      <SectionHeader title="Overview"/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:24}}>
        <StatCard label="Credits" value={stats.credits||0} color={T.blue} icon="💎" sub="Available to unlock leads"/>
        <StatCard label="Pipeline Value" value={"$"+((stats.pipeline_value||0)/1000).toFixed(0)+"K"} color={T.purple} icon="📈" sub={(stats.total_deals||0)+" active deals"}/>
        <StatCard label="Deals Won" value={stats.won||0} color={T.green} icon="🏆" sub={"Win rate: "+(stats.conversion||"0%")}/>
        <StatCard label="Hot Deals" value={stats.hot_deals||0} color={T.orange} icon="🔥" sub="Proposal + Negotiation"/>
        <StatCard label="Follow-ups Due" value={totalDue} color={totalDue>0?T.red:T.teal} icon="⏰" sub={followups.upcoming.length+" upcoming this week"}/>
        <StatCard label="Contacts" value={stats.leads_saved||0} color={T.teal} icon="👥" sub="In contacts book"/>
      </div>

      {/* Follow-up Reminders */}
      {(followups.overdue.length > 0 || followups.today.length > 0 || followups.upcoming.length > 0) && (
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:18,marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:12}}>⏰ Follow-up Reminders</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {followups.overdue.map(function(d){
              return (
                <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                  borderRadius:8,background:T.red+"08",border:"1px solid "+T.red+"25"}}>
                  <span style={{fontSize:10,fontWeight:700,color:T.red,minWidth:60}}>OVERDUE</span>
                  <span style={{fontSize:12,color:T.textPrimary,flex:1,fontWeight:600}}>{d.title}</span>
                  <span style={{fontSize:10,color:T.textMuted}}>{d.follow_up_date}</span>
                  <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,
                    background:STAGE_COLORS[d.stage]+"20",color:STAGE_COLORS[d.stage],textTransform:"capitalize"}}>
                    {d.stage}
                  </span>
                </div>
              );
            })}
            {followups.today.map(function(d){
              return (
                <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                  borderRadius:8,background:T.orange+"08",border:"1px solid "+T.orange+"25"}}>
                  <span style={{fontSize:10,fontWeight:700,color:T.orange,minWidth:60}}>TODAY</span>
                  <span style={{fontSize:12,color:T.textPrimary,flex:1,fontWeight:600}}>{d.title}</span>
                  <span style={{fontSize:10,color:T.textMuted}}>{d.follow_up_date}</span>
                  <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,
                    background:STAGE_COLORS[d.stage]+"20",color:STAGE_COLORS[d.stage],textTransform:"capitalize"}}>
                    {d.stage}
                  </span>
                </div>
              );
            })}
            {followups.upcoming.map(function(d){
              return (
                <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                  borderRadius:8,background:T.blue+"06",border:"1px solid "+T.blue+"20"}}>
                  <span style={{fontSize:10,fontWeight:700,color:T.blue,minWidth:60}}>UPCOMING</span>
                  <span style={{fontSize:12,color:T.textPrimary,flex:1,fontWeight:600}}>{d.title}</span>
                  <span style={{fontSize:10,color:T.textMuted}}>{d.follow_up_date}</span>
                  <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,
                    background:STAGE_COLORS[d.stage]+"20",color:STAGE_COLORS[d.stage],textTransform:"capitalize"}}>
                    {d.stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pipeline funnel */}
      <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:20,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:14}}>Pipeline Funnel</div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end",height:90}}>
          {stageOrder.map(function(stage) {
            var p = pipeline[stage]||{count:0,value:0};
            var pct = Math.max(8, (p.count/totalPipelineDeals)*100);
            var color = STAGE_COLORS[stage];
            return (
              <div key={stage} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:11,fontWeight:800,color}}>{p.count}</div>
                <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:color+"25",
                  border:"1px solid "+color+"40",height:pct+"%",minHeight:20,display:"flex",
                  alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:9,color,fontFamily:"monospace",fontWeight:700}}>
                    ${(p.value/1000).toFixed(0)}K
                  </span>
                </div>
                <div style={{fontSize:9,color:T.textMuted,textTransform:"capitalize",textAlign:"center"}}>{stage}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick tips */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
        {[
          {icon:"🔍",title:"Search Leads",desc:"10 industries × 15 countries. 200+ verified contacts."},
          {icon:"🤖",title:"AI Email",desc:"Claude AI drafts outreach in English, Japanese, German, Hindi."},
          {icon:"🛡️",title:"Auto Compliance",desc:"GDPR, CCPA, LGPD, DPDPA checked per country automatically."},
          {icon:"💰",title:"Credit System",desc:"1 credit = 1 unlocked email. Top up via billing."},
        ].map(function(tip) {
          return (
            <div key={tip.title} style={{background:T.surface,borderRadius:10,border:"1px solid "+T.border,padding:14}}>
              <div style={{fontSize:18,marginBottom:6}}>{tip.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:T.textPrimary,marginBottom:4}}>{tip.title}</div>
              <div style={{fontSize:11,color:T.textMuted,lineHeight:1.6}}>{tip.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Email ─────────────────────────────────────────────────────────────────
function AIEmailView({draft, setDraft, subject, setSubject, to, setTo, lang, setLang, loading}) {
  function sendEmail() {
    if(!to) return alert("Enter recipient email");
    api("/search/send-email",{method:"POST",body:JSON.stringify({to_email:to,subject,body:draft})})
    .then(function(d){ alert(d.status==="sent"?"Sent!":"Draft saved. Configure SMTP to send directly."); });
  }

  var inp = {width:"100%",background:T.surface,border:"1px solid "+T.border,borderRadius:7,
    padding:"9px 12px",color:T.textPrimary,fontSize:12,outline:"none",boxSizing:"border-box"};

  return (
    <div style={{flex:1,overflow:"auto",padding:20}}>
      <SectionHeader title="AI Email Drafting"/>
      <div style={{maxWidth:680}}>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{v:"en",l:"English"},{v:"ja",l:"日本語"},{v:"de",l:"Deutsch"},{v:"hi",l:"हिंदी"}].map(function(l){
            return (
              <button key={l.v} onClick={function(){setLang(l.v)}} style={{
                padding:"5px 14px",borderRadius:6,border:"1px solid "+(lang===l.v?T.blue:T.border),
                cursor:"pointer",fontSize:11,fontWeight:600,
                background:lang===l.v?T.blue+"15":"transparent",color:lang===l.v?T.blue:T.textMuted}}>
                {l.l}
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{padding:40,textAlign:"center",color:T.purple,fontSize:13}}>
            <div style={{fontSize:24,marginBottom:8,animation:"pulse 1s infinite"}}>🤖</div>
            Drafting with Claude AI...
          </div>
        )}

        {draft && !loading && (
          <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:20}}>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:10,color:T.textMuted,fontWeight:600,display:"block",marginBottom:5}}>TO</label>
              <input value={to} onChange={function(e){setTo(e.target.value)}} placeholder="recipient@company.com" style={inp}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:10,color:T.textMuted,fontWeight:600,display:"block",marginBottom:5}}>SUBJECT</label>
              <input value={subject} onChange={function(e){setSubject(e.target.value)}} style={inp}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,color:T.textMuted,fontWeight:600,display:"block",marginBottom:5}}>MESSAGE</label>
              <textarea value={draft} onChange={function(e){setDraft(e.target.value)}}
                style={{...inp,minHeight:160,resize:"vertical",lineHeight:1.6}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="primary" onClick={sendEmail}>Send Email</Btn>
              <Btn onClick={function(){navigator.clipboard.writeText(draft)}}>Copy</Btn>
            </div>
          </div>
        )}

        {!draft && !loading && (
          <div style={{padding:60,textAlign:"center",color:T.textFaint,border:"1px dashed "+T.border,borderRadius:12}}>
            <div style={{fontSize:32,marginBottom:12,opacity:0.4}}>✉</div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>No draft yet</div>
            <div style={{fontSize:11}}>Click "Email" on any contact in Search to auto-draft with Claude AI</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Earnings ─────────────────────────────────────────────────────────────────
function EarningsView() {
  var [data, setData] = useState(null);
  useEffect(function(){ apiFetch("/search/earnings").then(setData); }, []);

  if(!data) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.textFaint,fontSize:13}}>Loading...</div>;

  return (
    <div style={{flex:1,overflow:"auto",padding:20}}>
      <SectionHeader title="Earnings Projections (₹ INR)"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Potential" value={data.total_potential_formatted||"₹0"} color="#FFD700" icon="💰"/>
        <StatCard label="Monthly" value={data.monthly_projection||"₹0"} color={T.blue} icon="📅"/>
        <StatCard label="Yearly" value={data.yearly_projection||"₹0"} color={T.green} icon="📈"/>
      </div>

      {data.by_country && Object.keys(data.by_country).length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textPrimary,marginBottom:12}}>By Country</div>
            {Object.entries(data.by_country).map(function(e){
              return (
                <div key={e[0]} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",
                  borderBottom:"1px solid "+T.border,fontSize:11}}>
                  <span style={{color:T.textMuted}}>{e[0]}</span>
                  <span style={{color:"#FFD700",fontWeight:700,fontFamily:"monospace"}}>{e[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textPrimary,marginBottom:12}}>Lead Values</div>
            {(data.leads||[]).slice(0,10).map(function(l,i){
              return (
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",
                  borderBottom:"1px solid "+T.border,fontSize:10}}>
                  <span style={{color:T.textMuted}}>{l.company} · {l.contact}</span>
                  <span style={{color:T.green,fontWeight:700,fontFamily:"monospace"}}>₹{(l.potential_inr||0).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{marginTop:16,padding:14,background:T.blue+"08",borderRadius:10,
        border:"1px solid "+T.blue+"15",fontSize:11,color:T.textMuted,lineHeight:1.7}}>
        <span style={{fontWeight:700,color:T.blue}}>Strategy: </span>
        {data.tip}
      </div>
    </div>
  );
}

// ─── Invoice Generator ────────────────────────────────────────────────────────
var INVOICE_PLANS = [
  {id:"starter",  label:"Starter Plan",  inr:4066,  usd:49,  gbp:39,  eur:45},
  {id:"pro",      label:"Pro Plan",      inr:16517, usd:199, gbp:157, eur:183},
  {id:"business", label:"Business Plan", inr:41417, usd:499, gbp:394, eur:459},
];
var STATUS_COLORS = {draft:T.textMuted, sent:T.blue, paid:T.green};

function printInvoice(inv, seller) {
  var currency = inv.currency;
  var sym = currency==="INR"?"₹":currency==="USD"?"$":currency==="GBP"?"£":"€";
  var taxRows = "";
  if (!inv.is_export) {
    if (inv.is_igst) {
      taxRows = `<tr><td>IGST @ 18%</td><td style="text-align:right">${sym}${inv.igst_amount.toFixed(2)}</td></tr>`;
    } else {
      taxRows = `<tr><td>CGST @ 9%</td><td style="text-align:right">${sym}${inv.cgst_amount.toFixed(2)}</td></tr>
                 <tr><td>SGST @ 9%</td><td style="text-align:right">${sym}${inv.sgst_amount.toFixed(2)}</td></tr>`;
    }
  } else {
    taxRows = `<tr><td>GST (Export — Zero Rated / LUT)</td><td style="text-align:right">${sym}0.00</td></tr>`;
  }
  var html = `<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111;font-size:13px}
    h1{font-size:22px;margin:0} h2{font-size:14px;margin:0;color:#555}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f5f5f5;padding:8px;text-align:left;border:1px solid #ddd}
    td{padding:8px;border:1px solid #ddd}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #111}
    .badge{background:#111;color:#fff;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:bold}
    .total{font-size:16px;font-weight:bold}
    .footer{margin-top:32px;font-size:11px;color:#888;text-align:center;border-top:1px solid #ddd;padding-top:12px}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="header">
    <div>
      <h1>${seller.name}</h1>
      <div style="margin-top:6px;line-height:1.8;color:#555">
        ${seller.address ? seller.address+"<br>" : ""}
        ${seller.state ? "State: "+seller.state+"<br>" : ""}
        ${seller.gstin ? "<strong>GSTIN:</strong> "+seller.gstin+"<br>" : ""}
        <strong>Email:</strong> ${seller.email}<br>
        <strong>Website:</strong> ${seller.website}
      </div>
    </div>
    <div style="text-align:right">
      <div class="badge">${inv.is_export ? "EXPORT INVOICE" : "TAX INVOICE"}</div>
      <div style="margin-top:10px;line-height:1.8">
        <strong>Invoice No:</strong> ${inv.invoice_number}<br>
        <strong>Date:</strong> ${inv.invoice_date}<br>
        <strong>Status:</strong> ${inv.status.toUpperCase()}
      </div>
    </div>
  </div>

  <h2 style="margin-bottom:8px">Bill To</h2>
  <table><tr>
    <td style="border:none;padding:4px 0;line-height:1.8">
      <strong>${inv.buyer_name}</strong><br>
      ${inv.buyer_company ? inv.buyer_company+"<br>" : ""}
      ${inv.buyer_address ? inv.buyer_address+"<br>" : ""}
      ${inv.buyer_state ? "State: "+inv.buyer_state+"<br>" : ""}
      ${inv.buyer_country !== "IN" ? "Country: "+inv.buyer_country+"<br>" : ""}
      ${inv.buyer_gstin ? "<strong>GSTIN:</strong> "+inv.buyer_gstin : ""}
    </td>
  </tr></table>

  <table>
    <tr><th>#</th><th>Description</th><th>SAC Code</th><th style="text-align:right">Amount (${currency})</th></tr>
    <tr><td>1</td><td>${inv.description}</td><td>${seller.sac_code}</td>
        <td style="text-align:right">${sym}${inv.amount_before_tax.toFixed(2)}</td></tr>
  </table>

  <table style="width:300px;margin-left:auto">
    <tr><td>Subtotal</td><td style="text-align:right">${sym}${inv.amount_before_tax.toFixed(2)}</td></tr>
    ${taxRows}
    <tr class="total"><td><strong>Total</strong></td><td style="text-align:right"><strong>${sym}${inv.total_amount.toFixed(2)}</strong></td></tr>
  </table>

  ${inv.notes ? `<div style="margin-top:16px"><strong>Notes:</strong> ${inv.notes}</div>` : ""}

  <div class="footer">
    This is a computer-generated invoice. | ${seller.name} | ${seller.email}<br>
    ${inv.is_export ? "This is an export invoice under LUT. No GST charged as per IGST Act." : `SAC Code: ${seller.sac_code} — Information Technology Services`}
  </div>
  </body></html>`;
  var w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function(){w.print();}, 400);
}

function InvoiceView() {
  var [tab, setTab] = useState("list");
  var [invoices, setInvoices] = useState([]);
  var [seller, setSeller] = useState(null);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [msg, setMsg] = useState("");

  var [form, setForm] = useState({
    buyer_name:"", buyer_email:"", buyer_company:"", buyer_gstin:"",
    buyer_address:"", buyer_state:"", buyer_country:"IN",
    plan:"pro", currency:"INR", custom_amount:"", custom_description:"", notes:""
  });

  useEffect(function(){
    loadInvoices();
    api("/invoices/seller-info").then(function(d){ if(d.success) setSeller(d.seller); });
  }, []);

  function loadInvoices() {
    setLoading(true);
    api("/invoices/").then(function(d){
      if(d.success) setInvoices(d.invoices);
      setLoading(false);
    });
  }

  function setF(k,v){ setForm(function(f){return Object.assign({},f,{[k]:v})}); }

  var selectedPlan = INVOICE_PLANS.find(function(p){return p.id===form.plan});
  var autoAmount = selectedPlan ? selectedPlan[form.currency.toLowerCase()] : 0;
  var displayAmount = form.custom_amount ? parseFloat(form.custom_amount) : autoAmount;
  var sym = form.currency==="INR"?"₹":form.currency==="USD"?"$":form.currency==="GBP"?"£":"€";
  var isExport = form.currency !== "INR";
  var tax = isExport ? 0 : displayAmount * 0.18;
  var total = displayAmount + tax;

  function handleCreate() {
    if (!form.buyer_name.trim()) { setMsg("Buyer name is required"); return; }
    setSaving(true); setMsg("");
    api("/invoices/", {method:"POST", body:JSON.stringify({
      ...form,
      custom_amount: form.custom_amount ? parseFloat(form.custom_amount) : null,
    })}).then(function(d){
      setSaving(false);
      if(d.success){
        setMsg("Invoice "+d.invoice.invoice_number+" created!");
        setTab("list");
        loadInvoices();
        setForm({buyer_name:"",buyer_email:"",buyer_company:"",buyer_gstin:"",
          buyer_address:"",buyer_state:"",buyer_country:"IN",
          plan:"pro",currency:"INR",custom_amount:"",custom_description:"",notes:""});
      } else { setMsg(d.detail||"Error creating invoice"); }
    });
  }

  function markStatus(id, status) {
    api("/invoices/"+id, {method:"PATCH", body:JSON.stringify({status})})
      .then(loadInvoices);
  }

  function deleteInv(id) {
    if (!confirm("Delete this invoice?")) return;
    api("/invoices/"+id, {method:"DELETE"}).then(loadInvoices);
  }

  var inputStyle = {
    width:"100%", background:T.surface, border:"1px solid "+T.border,
    borderRadius:8, padding:"9px 12px", color:T.textPrimary,
    fontSize:12, outline:"none", boxSizing:"border-box",
  };
  var labelStyle = {fontSize:11, color:T.textMuted, marginBottom:4, display:"block"};

  return (
    <div style={{flex:1, overflow:"auto", padding:20}}>
      <SectionHeader title="Invoice Generator"/>
      <p style={{fontSize:12, color:T.textMuted, marginBottom:20}}>
        GST Tax Invoices (INR) · Export Invoices (USD/GBP/EUR) · SAC 998314 · Nanoneuron Services
      </p>

      {/* Tab toggle */}
      <div style={{display:"flex", gap:8, marginBottom:20}}>
        {[["list","📋 My Invoices"],["create","➕ Create Invoice"]].map(function(t){
          var active = tab===t[0];
          return (
            <button key={t[0]} onClick={function(){setTab(t[0]); setMsg("");}}
              style={{padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer",
                background:active?T.blue+"20":"transparent",
                color:active?T.blue:T.textMuted,
                fontWeight:active?700:500, fontSize:12,
                border:"1px solid "+(active?T.blue+"40":T.border)}}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {msg && (
        <div style={{padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:12,
          background:msg.includes("created")?T.green+"12":T.red+"12",
          color:msg.includes("created")?T.green:T.red,
          border:"1px solid "+(msg.includes("created")?T.green+"30":T.red+"30")}}>
          {msg}
        </div>
      )}

      {/* ── Invoice List ── */}
      {tab==="list" && (
        <div>
          {loading ? (
            <div style={{color:T.textMuted, fontSize:13, padding:40, textAlign:"center"}}>Loading...</div>
          ) : invoices.length === 0 ? (
            <div style={{color:T.textMuted, fontSize:13, padding:40, textAlign:"center"}}>
              No invoices yet. Create your first invoice →
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {invoices.map(function(inv){
                var sym2 = inv.currency==="INR"?"₹":inv.currency==="USD"?"$":inv.currency==="GBP"?"£":"€";
                var statusColor = STATUS_COLORS[inv.status] || T.textMuted;
                return (
                  <div key={inv.id} style={{background:T.surface, borderRadius:12,
                    border:"1px solid "+T.border, padding:16}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
                      <div>
                        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:4}}>
                          <span style={{fontSize:13, fontWeight:700, color:T.textPrimary, fontFamily:"monospace"}}>
                            {inv.invoice_number}
                          </span>
                          <span style={{fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6,
                            background:statusColor+"18", color:statusColor, textTransform:"uppercase"}}>
                            {inv.status}
                          </span>
                          {inv.is_export && (
                            <span style={{fontSize:10, padding:"2px 8px", borderRadius:6,
                              background:T.purple+"18", color:T.purple}}>EXPORT</span>
                          )}
                        </div>
                        <div style={{fontSize:12, color:T.textPrimary, fontWeight:600}}>{inv.buyer_name}</div>
                        {inv.buyer_company && <div style={{fontSize:11, color:T.textMuted}}>{inv.buyer_company}</div>}
                        <div style={{fontSize:11, color:T.textMuted, marginTop:2}}>{inv.invoice_date} · {inv.plan} plan</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18, fontWeight:800, color:T.textPrimary}}>
                          {sym2}{inv.total_amount.toLocaleString()}
                        </div>
                        <div style={{fontSize:10, color:T.textMuted}}>{inv.currency}</div>
                      </div>
                    </div>

                    <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                      <button onClick={function(){printInvoice(inv, seller||{name:"Nanoneuron Services",email:"service@nanoneuron.ai",website:"nanoneuron.ai",sac_code:"998314"})}}
                        style={{padding:"5px 12px", borderRadius:6, border:"1px solid "+T.border,
                          background:"transparent", color:T.textPrimary, fontSize:11, cursor:"pointer"}}>
                        🖨 Print / PDF
                      </button>
                      {inv.status==="draft" && (
                        <button onClick={function(){markStatus(inv.id,"sent")}}
                          style={{padding:"5px 12px", borderRadius:6, border:"1px solid "+T.blue+"40",
                            background:T.blue+"12", color:T.blue, fontSize:11, cursor:"pointer"}}>
                          ✉ Mark Sent
                        </button>
                      )}
                      {inv.status!=="paid" && (
                        <button onClick={function(){markStatus(inv.id,"paid")}}
                          style={{padding:"5px 12px", borderRadius:6, border:"1px solid "+T.green+"40",
                            background:T.green+"12", color:T.green, fontSize:11, cursor:"pointer"}}>
                          ✓ Mark Paid
                        </button>
                      )}
                      {inv.status==="draft" && (
                        <button onClick={function(){deleteInv(inv.id)}}
                          style={{padding:"5px 12px", borderRadius:6, border:"1px solid "+T.red+"40",
                            background:T.red+"12", color:T.red, fontSize:11, cursor:"pointer"}}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Create Invoice Form ── */}
      {tab==="create" && (
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth:820}}>

          {/* Left column — buyer details */}
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <div style={{fontSize:12, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:2}}>
              Buyer Details
            </div>

            <div><label style={labelStyle}>Client Name *</label>
              <input style={inputStyle} value={form.buyer_name} placeholder="Full name"
                onChange={function(e){setF("buyer_name",e.target.value)}}/></div>

            <div><label style={labelStyle}>Company Name</label>
              <input style={inputStyle} value={form.buyer_company} placeholder="ABC Pvt Ltd"
                onChange={function(e){setF("buyer_company",e.target.value)}}/></div>

            <div><label style={labelStyle}>Email</label>
              <input style={inputStyle} value={form.buyer_email} placeholder="client@company.com"
                onChange={function(e){setF("buyer_email",e.target.value)}}/></div>

            <div><label style={labelStyle}>GSTIN (optional — for B2B invoice)</label>
              <input style={inputStyle} value={form.buyer_gstin} placeholder="27AABCU9603R1ZX"
                onChange={function(e){setF("buyer_gstin",e.target.value.toUpperCase())}}/></div>

            <div><label style={labelStyle}>Address</label>
              <textarea style={{...inputStyle, height:70, resize:"vertical"}} value={form.buyer_address}
                placeholder="Street, City, PIN"
                onChange={function(e){setF("buyer_address",e.target.value)}}/></div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              <div><label style={labelStyle}>State</label>
                <input style={inputStyle} value={form.buyer_state} placeholder="Maharashtra"
                  onChange={function(e){setF("buyer_state",e.target.value)}}/></div>
              <div><label style={labelStyle}>Country</label>
                <select style={{...inputStyle}} value={form.buyer_country}
                  onChange={function(e){
                    setF("buyer_country",e.target.value);
                    if(e.target.value!=="IN") setF("currency","USD");
                    else setF("currency","INR");
                  }}>
                  <option value="IN">India (IN)</option>
                  <option value="US">USA (US)</option>
                  <option value="GB">UK (GB)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="AE">UAE (AE)</option>
                  <option value="AU">Australia (AU)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right column — plan + preview */}
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <div style={{fontSize:12, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:2}}>
              Invoice Details
            </div>

            <div><label style={labelStyle}>Plan</label>
              <select style={inputStyle} value={form.plan}
                onChange={function(e){setF("plan",e.target.value)}}>
                {INVOICE_PLANS.map(function(p){
                  return <option key={p.id} value={p.id}>{p.label}</option>;
                })}
              </select>
            </div>

            <div><label style={labelStyle}>Currency</label>
              <div style={{display:"flex", gap:8}}>
                {["INR","USD","GBP","EUR"].map(function(c){
                  var active = form.currency===c;
                  return (
                    <button key={c} onClick={function(){
                      setF("currency",c);
                      if(c!=="INR") setF("buyer_country","OTHER");
                      else setF("buyer_country","IN");
                    }}
                      style={{flex:1, padding:"8px 0", borderRadius:8, cursor:"pointer",
                        border:"1px solid "+(active?T.blue+"60":T.border),
                        background:active?T.blue+"18":"transparent",
                        color:active?T.blue:T.textMuted, fontSize:12, fontWeight:active?700:400}}>
                      {c==="INR"?"₹":c==="USD"?"$":c==="GBP"?"£":"€"} {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div><label style={labelStyle}>Custom Amount (leave blank for plan price)</label>
              <input style={inputStyle} value={form.custom_amount} type="number"
                placeholder={"Auto: "+sym+autoAmount}
                onChange={function(e){setF("custom_amount",e.target.value)}}/></div>

            <div><label style={labelStyle}>Custom Description (optional)</label>
              <input style={inputStyle} value={form.custom_description}
                placeholder="Leave blank for default plan description"
                onChange={function(e){setF("custom_description",e.target.value)}}/></div>

            <div><label style={labelStyle}>Notes (optional)</label>
              <input style={inputStyle} value={form.notes}
                placeholder="Payment due within 7 days"
                onChange={function(e){setF("notes",e.target.value)}}/></div>

            {/* Live preview box */}
            <div style={{background:T.bg, borderRadius:10, border:"1px solid "+T.border, padding:14, marginTop:4}}>
              <div style={{fontSize:11, fontWeight:700, color:T.textMuted, marginBottom:10, letterSpacing:1}}>PREVIEW</div>
              <div style={{fontSize:11, lineHeight:2, color:T.textMuted}}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <span>Subtotal</span>
                  <span style={{color:T.textPrimary, fontFamily:"monospace"}}>{sym}{displayAmount.toLocaleString()}</span>
                </div>
                {!isExport ? (
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <span>GST @ 18%</span>
                    <span style={{color:T.textPrimary, fontFamily:"monospace"}}>{sym}{tax.toFixed(2)}</span>
                  </div>
                ) : (
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <span>GST (Export / LUT)</span>
                    <span style={{color:T.green, fontFamily:"monospace"}}>₹0.00</span>
                  </div>
                )}
                <div style={{display:"flex", justifyContent:"space-between", borderTop:"1px solid "+T.border, paddingTop:6, marginTop:4}}>
                  <span style={{color:T.textPrimary, fontWeight:700}}>Total</span>
                  <span style={{color:T.blue, fontFamily:"monospace", fontWeight:800, fontSize:15}}>{sym}{total.toFixed(2)}</span>
                </div>
                {isExport && (
                  <div style={{fontSize:10, color:T.purple, marginTop:6}}>Export invoice — 0% GST under LUT</div>
                )}
              </div>
            </div>

            <button onClick={handleCreate} disabled={saving}
              style={{padding:"12px 0", borderRadius:10, border:"none", cursor:"pointer",
                background:saving?"transparent":`linear-gradient(135deg,${T.blue},${T.purple})`,
                color:saving?T.textMuted:"#07090F", fontSize:13, fontWeight:800,
                border:saving?"1px solid "+T.border:"none"}}>
              {saving ? "Creating..." : "🧾 Generate Invoice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment / Billing ────────────────────────────────────────────────────────
function WireRow({label, value}) {
  if (!value) return null;
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
      padding:"8px 0",borderBottom:"1px solid "+T.border}}>
      <span style={{fontSize:11,color:T.textMuted,minWidth:160}}>{label}</span>
      <span style={{fontSize:11,color:T.textPrimary,fontFamily:"monospace",fontWeight:600,
        textAlign:"right",maxWidth:240,wordBreak:"break-all"}}>{value}</span>
    </div>
  );
}

var CREDIT_PACKS = [
  {id:"c500",  credits:500,  inr:2499,  usd:29,  label:"Starter Pack",  color:T.blue},
  {id:"c2000", credits:2000, inr:7999,  usd:89,  label:"Growth Pack",   color:T.purple},
  {id:"c5000", credits:5000, inr:16999, usd:199, label:"Scale Pack",    color:T.green},
];

function PaymentView() {
  var [plans, setPlans] = useState(null);
  var [methods, setMethods] = useState(null);
  var [selectedPlan, setSelectedPlan] = useState("pro");
  var [billing, setBilling] = useState("monthly");
  var [currency, setCurrency] = useState("INR");
  var [section, setSection] = useState("plans");  // plans | credits
  var {isMobile} = useWindow();

  useEffect(function(){
    apiFetch("/payment/plans").then(function(d){if(d.success) setPlans(d.plans)});
    apiFetch("/payment/methods").then(function(d){if(d.success) setMethods(d.methods)});
  }, []);

  var neft = methods && methods.find(function(m){return m.id==="neft"});
  var swiftUsd = methods && methods.find(function(m){return m.id==="swift_usd"});
  var swiftGbp = methods && methods.find(function(m){return m.id==="swift_gbp"});
  var swiftEur = methods && methods.find(function(m){return m.id==="swift_eur"});

  var activePlan = plans && plans.find(function(p){return p.id===selectedPlan});
  var discount = billing === "annual" ? 0.80 : 1;

  function planPrice(p, cur) {
    var base = cur==="INR" ? p.price_inr : cur==="USD" ? p.price_usd :
               cur==="GBP" ? Math.round(p.price_usd*0.79) : Math.round(p.price_usd*0.92);
    return billing==="annual" ? Math.round(base*0.80) : base;
  }

  function activeAmount() {
    if (!activePlan) return "";
    var sym = currency==="INR"?"₹":currency==="USD"?"$":currency==="GBP"?"£":"€";
    var price = planPrice(activePlan, currency);
    if (billing==="annual") {
      var total = price * 12;
      return sym+total.toLocaleString()+" / year ("+sym+price+"/mo)";
    }
    return sym+price.toLocaleString()+" / month";
  }

  return (
    <div style={{flex:1,overflow:"auto",padding:isMobile?12:20,maxWidth:900}}>
      <SectionHeader title="Billing & Plans"/>
      <p style={{fontSize:12,color:T.textMuted,marginBottom:20}}>
        Bank wire transfer only · NEFT/RTGS for INR · SWIFT for international · Access within 24 hours
      </p>

      {/* Section toggle */}
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[["plans","📋 Subscription Plans"],["credits","💎 Credit Top-ups"]].map(function(s){
          var active = section===s[0];
          return (
            <button key={s[0]} onClick={function(){setSection(s[0])}}
              style={{padding:"9px 20px",borderRadius:9,border:"2px solid "+(active?T.blue+"60":T.border),
                background:active?T.blue+"18":"transparent",color:active?T.blue:T.textMuted,
                fontSize:12,fontWeight:active?700:500,cursor:"pointer"}}>
              {s[1]}
            </button>
          );
        })}
      </div>

      {section==="plans" && (<>
        {/* Billing toggle */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{display:"flex",background:T.surface,borderRadius:10,border:"1px solid "+T.border,padding:3}}>
            {[["monthly","Monthly"],["annual","Annual — 20% off"]].map(function(b){
              var active = billing===b[0];
              return (
                <button key={b[0]} onClick={function(){setBilling(b[0])}}
                  style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:active?700:400,
                    background:active?`linear-gradient(135deg,${T.blue},${T.purple})`:"transparent",
                    color:active?"#07090F":T.textMuted,transition:"all 0.15s"}}>
                  {b[1]}
                </button>
              );
            })}
          </div>
          {billing==="annual" && (
            <span style={{fontSize:11,color:T.green,fontWeight:700,padding:"3px 10px",
              borderRadius:6,background:T.green+"12",border:"1px solid "+T.green+"25"}}>
              Save 20% — 2 months free
            </span>
          )}
        </div>

        {/* ── Step 1: Choose Plan ── */}
        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Step 1 — Choose your plan</div>
        {plans && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginBottom:24}}>
            {plans.map(function(p) {
              var isPro = p.id === "pro";
              var color = p.id==="starter" ? T.blue : p.id==="pro" ? T.purple : T.green;
              var active = selectedPlan === p.id;
              var price = planPrice(p, currency);
              var origPrice = currency==="INR" ? p.price_inr : currency==="USD" ? p.price_usd :
                              currency==="GBP" ? Math.round(p.price_usd*0.79) : Math.round(p.price_usd*0.92);
              var sym = currency==="INR"?"₹":currency==="USD"?"$":currency==="GBP"?"£":"€";
              return (
                <div key={p.id} onClick={function(){setSelectedPlan(p.id)}}
                  style={{background:T.surface,borderRadius:14,cursor:"pointer",
                    border:`2px solid ${active ? color : T.border}`,padding:22,position:"relative",
                    boxShadow: active ? "0 0 0 3px "+color+"18" : "none",transition:"all 0.15s"}}>
                  {isPro && <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",
                    padding:"2px 12px",borderRadius:12,fontSize:9,fontWeight:700,
                    background:color+"25",color,border:"1px solid "+color+"30"}}>Most Popular</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{fontSize:13,fontWeight:700,color}}>{p.name}</div>
                    {active && <span style={{fontSize:10,color,fontWeight:700}}>✓ Selected</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                    <div style={{fontSize:26,fontWeight:800,color:T.textPrimary}}>{sym}{price.toLocaleString()}</div>
                    {billing==="annual" && <span style={{fontSize:11,color:T.textMuted,textDecoration:"line-through"}}>{sym}{origPrice}</span>}
                  </div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:12}}>
                    {billing==="annual" ? "per month · billed annually" : "per month"}
                  </div>
                  {billing==="annual" && (
                    <div style={{fontSize:10,color:T.green,fontWeight:700,marginBottom:10}}>
                      Annual total: {sym}{(price*12).toLocaleString()}
                    </div>
                  )}
                  {p.features.map(function(f){
                    return (
                      <div key={f} style={{fontSize:10,color:T.textMuted,padding:"2px 0",display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{color:T.green}}>✓</span>{f}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step 2: Choose Currency ── */}
        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Step 2 — Select transfer currency</div>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {["INR","USD","GBP","EUR"].map(function(c){
            var active = currency===c;
            var color = c==="INR" ? T.green : c==="USD" ? T.blue : c==="GBP" ? T.purple : T.teal;
            return (
              <button key={c} onClick={function(){setCurrency(c)}}
                style={{padding:"8px 20px",borderRadius:8,border:"2px solid "+(active?color:T.border),
                  background:active?color+"15":"transparent",color:active?color:T.textMuted,
                  fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>
                {c === "INR" ? "₹ INR" : c === "USD" ? "$ USD" : c === "GBP" ? "£ GBP" : "€ EUR"}
              </button>
            );
          })}
        </div>

        {/* ── Step 3: Wire Details ── */}
        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>Step 3 — Wire transfer details</div>

        {activePlan && (
          <div style={{padding:"10px 16px",background:T.blue+"10",borderRadius:8,border:"1px solid "+T.blue+"25",marginBottom:16,fontSize:12}}>
            <span style={{color:T.textMuted}}>Amount to transfer: </span>
            <span style={{fontWeight:800,color:T.textPrimary}}>{activeAmount()}</span>
            <span style={{color:T.textMuted}}> · {activePlan.name} plan</span>
          </div>
        )}

      {currency === "INR" && neft && (
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.green+"30",padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:18}}>🏦</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.green}}>NEFT / RTGS / IMPS</div>
              <div style={{fontSize:10,color:T.textMuted}}>Domestic India bank transfer</div>
            </div>
          </div>
          <WireRow label="Bank Name" value={neft.details.bank}/>
          <WireRow label="Account Holder" value={neft.details.account_holder}/>
          <WireRow label="Account Number" value={neft.details.account_number}/>
          <WireRow label="IFSC Code" value={neft.details.ifsc}/>
          <WireRow label="Transfer Type" value="NEFT / RTGS / IMPS"/>
        </div>
      )}

      {currency === "USD" && swiftUsd && (
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.blue+"30",padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:18}}>🌐</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.blue}}>SWIFT Wire Transfer — USD</div>
              <div style={{fontSize:10,color:T.textMuted}}>International bank wire</div>
            </div>
          </div>
          <WireRow label="Beneficiary Name" value={swiftUsd.details.beneficiary}/>
          <WireRow label="Account Number" value={swiftUsd.details.account}/>
          <WireRow label="Beneficiary Bank" value={swiftUsd.details.bank}/>
          <WireRow label="Bank SWIFT / BIC" value={swiftUsd.details.bank_swift}/>
          <WireRow label="Correspondent Bank" value={swiftUsd.details.correspondent}/>
          <WireRow label="Correspondent SWIFT" value={swiftUsd.details.correspondent_swift}/>
          <WireRow label="Nostro Account" value={swiftUsd.details.nostro}/>
          <WireRow label="Fed ABA / IBAN" value={swiftUsd.details.iban}/>
        </div>
      )}

      {currency === "GBP" && swiftGbp && (
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.purple+"30",padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:18}}>🌐</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.purple}}>SWIFT Wire Transfer — GBP</div>
              <div style={{fontSize:10,color:T.textMuted}}>International bank wire</div>
            </div>
          </div>
          <WireRow label="Beneficiary Name" value={swiftGbp.details.beneficiary}/>
          <WireRow label="Account Number" value={swiftGbp.details.account}/>
          <WireRow label="Beneficiary Bank" value={swiftGbp.details.bank}/>
          <WireRow label="Bank SWIFT / BIC" value={swiftGbp.details.bank_swift}/>
          <WireRow label="Correspondent Bank" value={swiftGbp.details.correspondent}/>
          <WireRow label="Correspondent SWIFT" value={swiftGbp.details.correspondent_swift}/>
          <WireRow label="Nostro Account" value={swiftGbp.details.nostro}/>
          <WireRow label="IBAN" value={swiftGbp.details.iban}/>
        </div>
      )}

      {currency === "EUR" && swiftEur && (
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.teal+"30",padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:18}}>🌐</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.teal}}>SWIFT Wire Transfer — EUR</div>
              <div style={{fontSize:10,color:T.textMuted}}>International bank wire</div>
            </div>
          </div>
          <WireRow label="Beneficiary Name" value={swiftEur.details.beneficiary}/>
          <WireRow label="Account Number" value={swiftEur.details.account}/>
          <WireRow label="Beneficiary Bank" value={swiftEur.details.bank}/>
          <WireRow label="Bank SWIFT / BIC" value={swiftEur.details.bank_swift}/>
          <WireRow label="Correspondent Bank" value={swiftEur.details.correspondent}/>
          <WireRow label="Correspondent SWIFT" value={swiftEur.details.correspondent_swift}/>
          <WireRow label="Nostro Account" value={swiftEur.details.nostro}/>
          <WireRow label="IBAN" value={swiftEur.details.iban}/>
        </div>
      )}

      {/* ── Step 4: After Payment ── */}
      <div style={{marginTop:8,padding:18,background:T.teal+"08",borderRadius:12,border:"1px solid "+T.teal+"25"}}>
        <div style={{fontSize:12,fontWeight:700,color:T.teal,marginBottom:12}}>Step 4 — After payment</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            ["1","Complete the wire transfer using the details above"],
            ["2","Email your transfer receipt to service@nanoneuron.ai"],
            ["3","Include your registered email, plan selected, and billing period (monthly/annual)"],
            ["4","Your account will be activated within 24 hours"],
          ].map(function(s){
            return (
              <div key={s[0]} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <span style={{width:22,height:22,borderRadius:"50%",background:T.teal+"25",color:T.teal,
                  fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s[0]}</span>
                <span style={{fontSize:11,color:T.textMuted,lineHeight:1.6}}>{s[1]}</span>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:14,padding:"10px 14px",background:T.surface,borderRadius:8,
          border:"1px solid "+T.border,fontSize:11,color:T.blue,fontWeight:600}}>
          service@nanoneuron.ai
        </div>
      </div>
      </>)}

      {/* ── Credit Top-ups ── */}
      {section==="credits" && (
        <div>
          <div style={{fontSize:11,color:T.textMuted,marginBottom:20,lineHeight:1.8}}>
            Running low on credits? Top up any time. Credits never expire. 1 credit = 1 verified contact unlock.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginBottom:28}}>
            {CREDIT_PACKS.map(function(pack){
              var sym = currency==="INR"?"₹":"$";
              var price = currency==="INR" ? pack.inr : pack.usd;
              var perCredit = (price / pack.credits).toFixed(1);
              return (
                <div key={pack.id} style={{background:T.surface,borderRadius:14,border:"1px solid "+pack.color+"30",padding:22}}>
                  <div style={{fontSize:12,fontWeight:700,color:pack.color,marginBottom:8}}>{pack.label}</div>
                  <div style={{fontSize:30,fontWeight:800,color:T.textPrimary,marginBottom:4}}>
                    {pack.credits.toLocaleString()}
                    <span style={{fontSize:13,color:T.textMuted,fontWeight:400}}> credits</span>
                  </div>
                  <div style={{fontSize:18,fontWeight:700,color:pack.color,marginBottom:4}}>
                    {sym}{price.toLocaleString()}
                  </div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:14}}>
                    {sym}{perCredit} per credit · one-time payment
                  </div>
                  <div style={{fontSize:10,color:T.textMuted,lineHeight:1.8}}>
                    <div>✓ Unlock {pack.credits} verified contacts</div>
                    <div>✓ Never expires</div>
                    <div>✓ Works on any plan</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Currency toggle for credits */}
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {["INR","USD"].map(function(c){
              var active = currency===c;
              var color = c==="INR" ? T.green : T.blue;
              return (
                <button key={c} onClick={function(){setCurrency(c)}}
                  style={{padding:"8px 20px",borderRadius:8,border:"2px solid "+(active?color:T.border),
                    background:active?color+"15":"transparent",color:active?color:T.textMuted,
                    fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {c==="INR" ? "₹ INR (NEFT)" : "$ USD (SWIFT)"}
                </button>
              );
            })}
          </div>

          {/* Wire details for credits */}
          {currency==="INR" && neft && (
            <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.green+"30",padding:20,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:T.green,marginBottom:12}}>🏦 NEFT / RTGS / IMPS</div>
              <WireRow label="Bank Name" value={neft.details.bank}/>
              <WireRow label="Account Holder" value={neft.details.account_holder}/>
              <WireRow label="Account Number" value={neft.details.account_number}/>
              <WireRow label="IFSC Code" value={neft.details.ifsc}/>
            </div>
          )}
          {currency==="USD" && swiftUsd && (
            <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.blue+"30",padding:20,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:12}}>🌐 SWIFT Wire — USD</div>
              <WireRow label="Beneficiary" value={swiftUsd.details.beneficiary}/>
              <WireRow label="Account" value={swiftUsd.details.account}/>
              <WireRow label="Bank SWIFT" value={swiftUsd.details.bank_swift}/>
              <WireRow label="Correspondent" value={swiftUsd.details.correspondent}/>
              <WireRow label="Nostro" value={swiftUsd.details.nostro}/>
            </div>
          )}

          <div style={{padding:16,background:T.teal+"08",borderRadius:10,border:"1px solid "+T.teal+"20",fontSize:11,color:T.textMuted,lineHeight:2}}>
            Transfer the pack amount · Email receipt to <span style={{color:T.blue,fontWeight:600}}>service@nanoneuron.ai</span> with your registered email + "Credit Top-up" in subject · Credits added within 24 hours
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NOTES & ACTIVITY VIEW ────────────────────────────────────────────────────
var NOTE_TYPES = [
  {id:"note",icon:"📝",label:"Note",color:"#4F8EF7"},
  {id:"call",icon:"📞",label:"Call",color:"#00D97E"},
  {id:"email",icon:"✉️",label:"Email",color:"#A855F7"},
  {id:"meeting",icon:"🤝",label:"Meeting",color:"#FF8C42"},
  {id:"task",icon:"✅",label:"Task",color:"#00D4AA"},
];

function NotesActivityView() {
  var [activity, setActivity] = useState([]);
  var [loading, setLoading] = useState(true);
  var [noteText, setNoteText] = useState("");
  var [noteType, setNoteType] = useState("note");
  var [saving, setSaving] = useState(false);
  var [msg, setMsg] = useState("");
  var [templates, setTemplates] = useState([]);
  var [tmplName, setTmplName] = useState("");
  var [tmplSubject, setTmplSubject] = useState("");
  var [tmplBody, setTmplBody] = useState("");
  var [savingTmpl, setSavingTmpl] = useState(false);
  var [tab, setTab] = useState("activity");

  useEffect(() => {
    loadActivity();
    loadTemplates();
  }, []);

  async function loadActivity() {
    setLoading(true);
    var r = await apiFetch("/notes/recent").catch(() => ({}));
    setActivity(r.activity || []);
    setLoading(false);
  }

  async function loadTemplates() {
    var r = await apiFetch("/templates/").catch(() => ({}));
    setTemplates(r.templates || []);
  }

  async function submitNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    // Notes require a real deal_id or saved_lead_id — open a deal or contact to log notes there
    setSaving(false);
    setMsg("📝 To log notes, open a deal from the Pipeline tab or a contact from Contacts.");
  }

  async function saveTmpl() {
    if (!tmplName || !tmplSubject || !tmplBody) return;
    setSavingTmpl(true);
    await apiFetch("/templates/", { method:"POST", body: JSON.stringify({
      name: tmplName, subject: tmplSubject, body: tmplBody, language: "en"
    })}).catch(() => {});
    setTmplName(""); setTmplSubject(""); setTmplBody("");
    setSavingTmpl(false);
    loadTemplates();
  }

  async function deleteTmpl(id) {
    await apiFetch("/templates/" + id, { method:"DELETE" }).catch(() => {});
    loadTemplates();
  }

  var typeInfo = (t) => NOTE_TYPES.find(n => n.id === t) || NOTE_TYPES[0];

  return (
    <div style={{padding:24, maxWidth:900, margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:22, fontWeight:700, color:"#E2E8F0", marginBottom:4}}>Notes & Activity</div>
        <div style={{fontSize:13, color:"rgba(226,232,240,0.5)"}}>Log calls, meetings, emails · Save email templates</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex", gap:8, marginBottom:24}}>
        {[{id:"activity",label:"📋 Activity Feed"},{id:"templates",label:"✉️ Email Templates"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
            background: tab===t.id ? "#4F8EF7" : "rgba(255,255,255,0.05)",
            color: tab===t.id ? "#fff" : "rgba(226,232,240,0.6)"
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "activity" && (
        <div>
          {/* Quick note */}
          <div style={{background:"#0F1120", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:20, marginBottom:24}}>
            <div style={{fontSize:13, fontWeight:600, color:"rgba(226,232,240,0.7)", marginBottom:12}}>Log Activity</div>
            <div style={{display:"flex", gap:8, marginBottom:12, flexWrap:"wrap"}}>
              {NOTE_TYPES.map(nt => (
                <button key={nt.id} onClick={() => setNoteType(nt.id)} style={{
                  padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
                  background: noteType===nt.id ? nt.color : "rgba(255,255,255,0.05)",
                  color: noteType===nt.id ? "#fff" : "rgba(226,232,240,0.5)"
                }}>{nt.icon} {nt.label}</button>
              ))}
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." rows={3}
              style={{width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:8, padding:10, color:"#E2E8F0", fontSize:13, resize:"vertical", outline:"none", boxSizing:"border-box"}}/>
            <button onClick={submitNote} disabled={saving || !noteText.trim()} style={{
              marginTop:10, padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer",
              background: saving ? "rgba(79,142,247,0.4)" : "#4F8EF7", color:"#fff", fontWeight:600, fontSize:13
            }}>{saving ? "Saving..." : "Log Note"}</button>
            {msg && <div style={{marginTop:10, padding:"8px 12px", borderRadius:8, background:"rgba(79,142,247,0.1)", border:"1px solid rgba(79,142,247,0.2)", fontSize:12, color:"rgba(226,232,240,0.8)"}}>{msg}</div>}
          </div>

          {/* Activity feed */}
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {loading ? (
              <div style={{color:"rgba(226,232,240,0.4)", fontSize:13, textAlign:"center", padding:40}}>Loading activity...</div>
            ) : activity.length === 0 ? (
              <div style={{color:"rgba(226,232,240,0.4)", fontSize:13, textAlign:"center", padding:40}}>No activity yet. Log your first note above.</div>
            ) : activity.map(n => {
              var ti = typeInfo(n.note_type);
              return (
                <div key={n.id} style={{background:"#0F1120", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"14px 18px", display:"flex", gap:14, alignItems:"flex-start"}}>
                  <div style={{width:32, height:32, borderRadius:8, background:ti.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0}}>{ti.icon}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                      <span style={{fontSize:11, fontWeight:700, color:ti.color, background:ti.color+"18", padding:"2px 8px", borderRadius:10}}>{ti.label}</span>
                      <span style={{fontSize:11, color:"rgba(226,232,240,0.35)"}}>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{fontSize:13, color:"rgba(226,232,240,0.85)", lineHeight:1.5}}>{n.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "templates" && (
        <div>
          {/* Create template */}
          <div style={{background:"#0F1120", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:20, marginBottom:24}}>
            <div style={{fontSize:13, fontWeight:600, color:"rgba(226,232,240,0.7)", marginBottom:12}}>New Email Template</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12}}>
              <input value={tmplName} onChange={e => setTmplName(e.target.value)} placeholder="Template name" style={{
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
                padding:"9px 12px", color:"#E2E8F0", fontSize:13, outline:"none"}}/>
              <input value={tmplSubject} onChange={e => setTmplSubject(e.target.value)} placeholder="Email subject" style={{
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8,
                padding:"9px 12px", color:"#E2E8F0", fontSize:13, outline:"none"}}/>
            </div>
            <textarea value={tmplBody} onChange={e => setTmplBody(e.target.value)} placeholder="Email body..." rows={4}
              style={{width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:8, padding:10, color:"#E2E8F0", fontSize:13, resize:"vertical", outline:"none", boxSizing:"border-box"}}/>
            <button onClick={saveTmpl} disabled={savingTmpl || !tmplName || !tmplSubject || !tmplBody} style={{
              marginTop:10, padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer",
              background: savingTmpl ? "rgba(168,85,247,0.4)" : "#A855F7", color:"#fff", fontWeight:600, fontSize:13
            }}>{savingTmpl ? "Saving..." : "Save Template"}</button>
          </div>

          {/* Templates list */}
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {templates.length === 0 ? (
              <div style={{color:"rgba(226,232,240,0.4)", fontSize:13, textAlign:"center", padding:40}}>No templates yet. Create one above.</div>
            ) : templates.map(t => (
              <div key={t.id} style={{background:"#0F1120", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"14px 18px"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8}}>
                  <div>
                    <div style={{fontSize:14, fontWeight:600, color:"#E2E8F0", marginBottom:2}}>{t.name}</div>
                    <div style={{fontSize:12, color:"#A855F7"}}>Subject: {t.subject}</div>
                  </div>
                  <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    <span style={{fontSize:11, color:"rgba(226,232,240,0.4)"}}>Used {t.use_count}x</span>
                    <button onClick={() => deleteTmpl(t.id)} style={{
                      padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer",
                      background:"rgba(255,59,92,0.15)", color:"#FF3B5C", fontSize:11, fontWeight:600
                    }}>Delete</button>
                  </div>
                </div>
                <div style={{fontSize:12, color:"rgba(226,232,240,0.5)", lineHeight:1.5, whiteSpace:"pre-wrap"}}>{t.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────
function MiniBar({value, max, color, height=8}) {
  var pct = max > 0 ? Math.max(4, Math.round(value/max*100)) : 4;
  return (
    <div style={{height,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden",flex:1}}>
      <div style={{height:"100%",width:pct+"%",background:color,borderRadius:4,transition:"width 0.5s ease"}}/>
    </div>
  );
}

function AnalyticsView() {
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(true);
  var {isMobile} = useWindow();

  useEffect(function(){
    api("/deals/analytics").then(function(r){
      if(r.success) setData(r);
      setLoading(false);
    });
  }, []);

  if(loading) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div style={{fontSize:28,opacity:0.3}}>📊</div>
      <div style={{fontSize:13,color:T.textMuted}}>Loading analytics...</div>
    </div>
  );
  if(!data) return null;

  var s = data.summary;
  var stages = ["lead","qualified","proposal","negotiation","won","lost"];
  var stageColors = {lead:"#64748B",qualified:T.blue,proposal:T.purple,negotiation:T.orange,won:T.green,lost:T.red};
  var maxStageCount = Math.max(...stages.map(function(st){return data.stages[st]?.count||0;}), 1);
  var maxMonthlyVal = Math.max(...(data.monthly||[]).map(function(m){return m.value;}), 1);
  var maxCountryVal = Math.max(...(data.top_countries||[]).map(function(c){return c.value;}), 1);

  return (
    <div style={{flex:1,overflow:"auto",padding:isMobile?12:20}}>
      <SectionHeader title="Analytics & Insights"/>

      {/* ── KPI Cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        <StatCard label="Pipeline Value" value={"$"+(s.pipeline_value/1000).toFixed(1)+"K"} color={T.blue} icon="📈" sub={s.active_count+" active deals"}/>
        <StatCard label="Won Revenue" value={"$"+(s.total_won_value/1000).toFixed(1)+"K"} color={T.green} icon="🏆" sub={s.won_count+" deals closed"}/>
        <StatCard label="Win Rate" value={s.win_rate+"%"} color={s.win_rate>=30?T.green:s.win_rate>=15?T.orange:T.red} icon="🎯" sub="Of closed deals"/>
        <StatCard label="Avg Deal Size" value={"$"+(s.avg_deal_value/1000).toFixed(1)+"K"} color={T.purple} icon="💰" sub={"Of "+s.total_deals+" total deals"}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>

        {/* ── Pipeline by Stage ── */}
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:14}}>Pipeline by Stage</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {stages.map(function(st){
              var sd = data.stages[st] || {count:0,value:0};
              var color = stageColors[st];
              return (
                <div key={st}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:T.textPrimary,textTransform:"capitalize"}}>{st}</span>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:11,fontWeight:700,color:T.teal,fontFamily:"monospace"}}>
                        ${(sd.value/1000).toFixed(1)}K
                      </span>
                      <span style={{fontSize:11,color:T.textMuted,fontFamily:"monospace",minWidth:20,textAlign:"right"}}>{sd.count}</span>
                    </div>
                  </div>
                  <MiniBar value={sd.count} max={maxStageCount} color={color} height={6}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Monthly Trend ── */}
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:14}}>Monthly Deal Activity</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:110}}>
            {(data.monthly||[]).map(function(m,i){
              var pct = maxMonthlyVal > 0 ? Math.max(6, Math.round(m.value/maxMonthlyVal*100)) : 6;
              var isLast = i === (data.monthly.length-1);
              return (
                <div key={m.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:9,fontWeight:700,color:isLast?T.teal:T.textMuted,fontFamily:"monospace"}}>
                    {m.value>0?"$"+(m.value/1000).toFixed(0)+"K":"—"}
                  </span>
                  <div style={{width:"100%",borderRadius:"4px 4px 0 0",
                    background:isLast?T.teal+"30":T.blue+"20",
                    border:"1px solid "+(isLast?T.teal:T.blue)+"40",
                    height:pct+"%",minHeight:4,display:"flex",alignItems:"flex-start",
                    justifyContent:"center",paddingTop:2}}>
                    {m.count>0 && <span style={{fontSize:8,color:isLast?T.teal:T.blue,fontWeight:700}}>{m.count}</span>}
                  </div>
                  <span style={{fontSize:9,color:T.textMuted}}>{m.month}</span>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:10,fontSize:10,color:T.textMuted,textAlign:"center"}}>
            Bars show deal count · Labels show pipeline value
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>

        {/* ── Top Countries ── */}
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:14}}>Top Countries by Value</div>
          {(data.top_countries||[]).length === 0 ? (
            <div style={{textAlign:"center",padding:20,color:T.textMuted,fontSize:12}}>No deals yet</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(data.top_countries||[]).map(function(c,i){
                var colors = [T.blue,T.purple,T.teal,T.orange,T.green,T.red];
                var color = colors[i % colors.length];
                return (
                  <div key={c.country}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.textPrimary}}>{c.country}</span>
                        <span style={{fontSize:10,color:T.textMuted}}>{c.count} deal{c.count!==1?"s":""}</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:color,fontFamily:"monospace"}}>
                        ${(c.value/1000).toFixed(1)}K
                      </span>
                    </div>
                    <MiniBar value={c.value} max={maxCountryVal} color={color} height={6}/>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Stage Conversion Funnel ── */}
        <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:14}}>Conversion Funnel</div>
          {s.total_deals === 0 ? (
            <div style={{textAlign:"center",padding:20,color:T.textMuted,fontSize:12}}>Add deals to see conversion rates</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {stages.filter(function(st){return st!=="lost";}).map(function(st,i){
                var sd = data.stages[st] || {count:0};
                var pct = s.total_deals > 0 ? Math.round(sd.count/s.total_deals*100) : 0;
                var color = stageColors[st];
                var barW = Math.max(4, pct);
                return (
                  <div key={st} style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"capitalize",
                      minWidth:80,textAlign:"right"}}>{st}</span>
                    <div style={{flex:1,height:22,background:"rgba(255,255,255,0.04)",borderRadius:4,overflow:"hidden",position:"relative"}}>
                      <div style={{position:"absolute",top:0,left:0,height:"100%",width:barW+"%",
                        background:color+"30",borderRadius:4,transition:"width 0.6s ease"}}/>
                      <div style={{position:"absolute",top:0,left:0,height:"100%",
                        display:"flex",alignItems:"center",paddingLeft:8,zIndex:1}}>
                        <span style={{fontSize:10,fontWeight:700,color:color}}>{sd.count} deal{sd.count!==1?"s":""}</span>
                      </div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color,minWidth:32,textAlign:"right"}}>{pct}%</span>
                  </div>
                );
              })}
              <div style={{marginTop:10,padding:"10px 12px",background:T.green+"08",borderRadius:8,
                border:"1px solid "+T.green+"20",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:T.textMuted}}>Win rate (closed deals)</span>
                <span style={{fontSize:13,fontWeight:800,color:T.green}}>{s.win_rate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Performance Summary ── */}
      <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,padding:18}}>
        <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:12}}>Performance Summary</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
          {[
            {label:"Total Deals", value:s.total_deals, color:T.textPrimary, icon:"📋"},
            {label:"Active Deals", value:s.active_count, color:T.blue, icon:"⚡"},
            {label:"Deals Won", value:s.won_count, color:T.green, icon:"✅"},
            {label:"Deals Lost", value:s.lost_count, color:T.red, icon:"❌"},
          ].map(function(item){
            return (
              <div key={item.label} style={{padding:"12px 14px",background:T.bg,borderRadius:10,
                border:"1px solid "+T.border,textAlign:"center"}}>
                <div style={{fontSize:20,marginBottom:4}}>{item.icon}</div>
                <div style={{fontSize:22,fontWeight:800,color:item.color,fontFamily:"monospace"}}>{item.value}</div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  var [tab, setTab] = useState("dashboard");
  var [industry, setIndustry] = useState("");
  var [country, setCountry] = useState("");
  var [empFilter, setEmpFilter] = useState("");
  var [deptFilter, setDeptFilter] = useState("");
  var [results, setResults] = useState(null);
  var [searchLoading, setSearchLoading] = useState(false);
  var [deals, setDeals] = useState([]);
  var [pipeline, setPipeline] = useState({});
  var [stats, setStats] = useState({});
  var [emailDraft, setEmailDraft] = useState("");
  var [emailTo, setEmailTo] = useState("");
  var [emailSubject, setEmailSubject] = useState("");
  var [emailLang, setEmailLang] = useState("en");
  var [emailLoading, setEmailLoading] = useState(false);
  var [user, setUser] = useState(null);
  var [trialInfo, setTrialInfo] = useState(null);
  var [sidebarOpen, setSidebarOpen] = useState(true);
  var [menuOpen, setMenuOpen] = useState(false);
  var { isMobile, isTablet } = useWindow();

  useEffect(function(){
    try { setUser(JSON.parse(localStorage.getItem("user"))); } catch(e){}
    loadData();
    api("/auth/trial-status").then(function(d){if(d.success) setTrialInfo(d)});
  }, []);

  function loadData() {
    api("/deals/").then(function(d){ if(d.success) setDeals(d.data); });
    api("/deals/pipeline").then(function(d){ if(d.success) setPipeline(d.pipeline); });
    api("/dashboard/stats").then(function(d){ if(d.success) setStats(d.stats); });
  }

  function doSearch() {
    setSearchLoading(true);
    var p = [];
    if(industry) p.push("industry="+industry);
    if(country) p.push("country="+country);
    api("/search/discover?"+p.join("&")).then(function(d){
      setResults(d); setSearchLoading(false);
    });
  }

  function handleUnlock(domain, name) {
    api("/search/unlock",{method:"POST",body:JSON.stringify({company_domain:domain,contact_name:name})})
    .then(function(d){
      if(d.success){
        alert("Unlocked!\nEmail: "+d.lead.email+"\nScore: "+d.lead.lead_score+"\nSaved to Contacts.");
        loadData();
      } else { alert(d.detail||"Error"); }
    });
  }

  function handleAddPipeline(comp, contact) {
    api("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
      company_name:comp.company, contact_name:contact.name,
      contact_email:contact.email_masked, contact_title:contact.title,
      country:comp.country, deal_value:25000,
    })}).then(function(d){
      if(d.success){ alert("Added to pipeline! Compliance: "+d.compliance.status); loadData(); }
    });
  }

  function handleDraftEmail(name, title, company) {
    setEmailLoading(true); setTab("email");
    api("/ai/draft-email",{method:"POST",body:JSON.stringify({
      contact_name:name, contact_title:title, company_name:company, language:emailLang
    })}).then(function(d){
      setEmailDraft(d.email||"");
      setEmailSubject("Partnership: "+company);
      setEmailLoading(false);
    });
  }

  function handleMoveStage(dealId, stage) {
    api("/deals/"+dealId,{method:"PATCH",body:JSON.stringify({stage})}).then(loadData);
  }

  function handleDeleteDeal(dealId) {
    api("/deals/"+dealId,{method:"DELETE"}).then(loadData);
  }

  function handleFollowUpSet(dealId, dateStr) {
    api("/deals/"+dealId,{method:"PATCH",body:JSON.stringify({follow_up_date:dateStr})}).then(loadData);
  }

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.textPrimary,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header style={{height:52,borderBottom:"1px solid "+T.border,display:"flex",
        alignItems:"center",padding:"0 12px",gap:10,flexShrink:0,background:T.sidebar,zIndex:20}}>

        {/* Hamburger — mobile only */}
        {isMobile && (
          <button onClick={function(){setMenuOpen(function(v){return !v;})}}
            style={{background:"none",border:"none",cursor:"pointer",color:T.textPrimary,
              fontSize:20,padding:"4px 6px",flexShrink:0,lineHeight:1}}>
            {menuOpen ? "✕" : "☰"}
          </button>
        )}

        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:8,
            background:`linear-gradient(135deg,${T.blue},${T.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:15,fontWeight:900,color:"#07090F"}}>N</div>
          {!isMobile && (
            <div>
              <div style={{fontSize:13,fontWeight:800,letterSpacing:-0.3}}>Nanoneuron</div>
              <div style={{fontSize:8,color:T.textMuted,marginTop:-2}}>CRM · nanoneuron.ai</div>
            </div>
          )}
        </div>

        {/* Search — hidden on mobile */}
        {!isMobile && (
          <div style={{flex:1,maxWidth:400,marginLeft:8}}>
            <input placeholder="Search leads, companies, contacts..."
              style={{width:"100%",background:T.surface,border:"1px solid "+T.border,
                borderRadius:8,padding:"7px 14px",color:T.textPrimary,fontSize:12,outline:"none"}}
              onFocus={function(){setTab("search")}}/>
          </div>
        )}

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:isMobile?6:12}}>
          {trialInfo && trialInfo.status === "trial" && !isMobile && (
            <div style={{fontSize:10,padding:"3px 10px",borderRadius:6,
              background:T.orange+"15",color:T.orange,fontWeight:600}}>
              Trial: {trialInfo.days_left}d left
            </div>
          )}
          {trialInfo && trialInfo.is_paid && !isMobile && (
            <div style={{fontSize:10,padding:"3px 10px",borderRadius:6,
              background:T.green+"15",color:T.green,fontWeight:600}}>
              ✓ {(trialInfo.plan||"").toUpperCase()}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",
            background:T.blue+"12",borderRadius:6,border:"1px solid "+T.blue+"20"}}>
            <span style={{fontSize:9,color:T.textMuted,fontWeight:600}}>💎</span>
            <span style={{fontSize:12,fontWeight:800,color:T.blue,fontFamily:"monospace"}}>{stats.credits||0}</span>
          </div>
          <Avatar name={user ? user.name : "?"} size={28}/>
          {!isMobile && (
            <div style={{lineHeight:1.2}}>
              <div style={{fontSize:11,fontWeight:600}}>{user ? user.name : "User"}</div>
              <div style={{fontSize:9,color:T.textMuted}}>{user ? user.email : ""}</div>
            </div>
          )}
        </div>
      </header>

      {/* ── Trial Expired Banner ─────────────────────────────────────────────── */}
      {trialInfo && trialInfo.status === "expired" && (
        <div style={{padding:"10px 20px",background:T.red+"12",borderBottom:"1px solid "+T.red+"25",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:T.red,fontWeight:600}}>
            Trial expired — your data is safe. Pay now to restore access.
          </span>
          <Btn small variant="primary" onClick={function(){setTab("payment")}}>Subscribe Now</Btn>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>

        {/* ── Mobile overlay backdrop ───────────────────────────────────────── */}
        {isMobile && menuOpen && (
          <div onClick={function(){setMenuOpen(false)}}
            style={{position:"fixed",inset:0,top:52,background:"rgba(0,0,0,0.6)",zIndex:90}}/>
        )}

        {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
        <nav style={{
          width: isMobile ? 240 : 200,
          flexShrink: 0,
          background: T.sidebar,
          borderRight: "1px solid "+T.border,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
          // Mobile: fixed drawer, Desktop: static sidebar
          ...(isMobile ? {
            position: "fixed",
            top: 52,
            left: 0,
            bottom: 0,
            zIndex: 95,
            transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
          } : {}),
        }}>
          {NAV.map(function(item) {
            var active = tab === item.id;
            return (
              <button key={item.id} onClick={function(){setTab(item.id);if(isMobile)setMenuOpen(false);}} style={{
                display:"flex",alignItems:"center",gap:9,padding:"10px 12px",
                borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",width:"100%",
                background: active ? T.blue+"18" : "transparent",
                color: active ? T.blue : T.textMuted,
                fontWeight: active ? 700 : 500,
                fontSize:13,
                transition:"background 0.15s,color 0.15s",
              }}
              onMouseEnter={function(e){if(!active)e.currentTarget.style.background=T.surface}}
              onMouseLeave={function(e){if(!active)e.currentTarget.style.background="transparent"}}>
                <span style={{fontSize:15,width:20,textAlign:"center",flexShrink:0}}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          {/* Separator */}
          <div style={{flex:1}}/>
          <div style={{height:1,background:T.border,margin:"8px 0"}}/>
          <button onClick={function(){localStorage.clear();window.location.href="/"}} style={{
            display:"flex",alignItems:"center",gap:9,padding:"9px 12px",
            borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",width:"100%",
            background:"transparent",color:T.red,fontSize:12,fontWeight:500}}>
            <span style={{fontSize:14,width:18,textAlign:"center"}}>⏏</span>
            Sign Out
          </button>
        </nav>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <main style={{flex:1,display:"flex",overflow:"hidden",
          marginLeft: isMobile ? 0 : 0,  // sidebar is static on desktop
          paddingBottom: isMobile ? 60 : 0,  // space for mobile bottom nav
        }}>

          {/* Dashboard */}
          {tab==="dashboard" && <DashboardOverview stats={stats} pipeline={pipeline}/>}

          {/* Global Lead Discovery Engine */}
          {tab==="discover" && <LeadDiscoveryEngine/>}

          {/* Search — split layout: filter sidebar + results table */}
          {tab==="search" && (
            <div style={{flex:1,display:"flex",overflow:"hidden"}}>
              <FilterSidebar
                industry={industry} setIndustry={setIndustry}
                country={country} setCountry={setCountry}
                empFilter={empFilter} setEmpFilter={setEmpFilter}
                deptFilter={deptFilter} setDeptFilter={setDeptFilter}
                onSearch={doSearch} loading={searchLoading}
              />
              <SearchResults
                results={results}
                onUnlock={handleUnlock}
                onAddPipeline={handleAddPipeline}
                onDraftEmail={handleDraftEmail}
              />
            </div>
          )}

          {/* Contacts */}
          {tab==="contacts" && <ContactsBook/>}

          {/* Pipeline */}
          {tab==="pipeline" && (
            <PipelineBoard
              deals={deals} pipeline={pipeline}
              onMoveStage={handleMoveStage} onRefresh={loadData}
              onDeleteDeal={handleDeleteDeal} onFollowUpSet={handleFollowUpSet}
            />
          )}

          {/* Analytics */}
          {tab==="analytics" && <AnalyticsView/>}

          {/* AI Hub */}
          {tab==="aihub" && <AIHub/>}

          {/* Notes & Activity */}
          {tab==="notes" && <NotesActivityView/>}

          {/* AI Email */}
          {tab==="email" && (
            <AIEmailView
              draft={emailDraft} setDraft={setEmailDraft}
              subject={emailSubject} setSubject={setEmailSubject}
              to={emailTo} setTo={setEmailTo}
              lang={emailLang} setLang={setEmailLang}
              loading={emailLoading}
            />
          )}

          {/* Invoices */}
          {tab==="invoices" && <InvoiceView/>}

          {/* Earnings */}
          {tab==="earnings" && <EarningsView/>}

          {/* Payment */}
          {tab==="payment" && <PaymentView/>}

        </main>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────────────── */}
      {isMobile && (
        <nav style={{
          position:"fixed",bottom:0,left:0,right:0,height:58,
          background:T.sidebar,borderTop:"1px solid "+T.border,
          display:"flex",alignItems:"stretch",zIndex:80,
        }}>
          {[
            {id:"dashboard", icon:"⬛", label:"Home"},
            {id:"discover",  icon:"🌍", label:"Leads"},
            {id:"pipeline",  icon:"📋", label:"Pipeline"},
            {id:"analytics", icon:"📊", label:"Analytics"},
            {id:"aihub",     icon:"⚡", label:"AI"},
          ].map(function(item){
            var active = tab === item.id;
            return (
              <button key={item.id} onClick={function(){setTab(item.id);setMenuOpen(false);}} style={{
                flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",
                color: active ? T.blue : T.textMuted,
                transition:"color 0.15s",
              }}>
                <span style={{fontSize:18}}>{item.icon}</span>
                <span style={{fontSize:9,fontWeight:active?700:500}}>{item.label}</span>
                {active && <span style={{position:"absolute",bottom:0,width:32,height:2,
                  background:T.blue,borderRadius:"2px 2px 0 0"}}/>}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
