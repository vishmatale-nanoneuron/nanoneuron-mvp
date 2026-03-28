"use client";
import { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE } from "../../lib/api";

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
  {id:"search",    icon:"🔍", label:"Search Leads"},
  {id:"contacts",  icon:"👥", label:"Contacts"},
  {id:"pipeline",  icon:"📋", label:"Pipeline"},
  {id:"email",     icon:"✉", label:"AI Email"},
  {id:"earnings",  icon:"₹",  label:"Earnings"},
  {id:"payment",   icon:"💳", label:"Billing"},
];

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
function PipelineBoard({deals, pipeline, onMoveStage, onRefresh}) {
  var stages = ["lead","qualified","proposal","negotiation","won","lost"];

  return (
    <div style={{flex:1,overflow:"auto",padding:16}}>
      <SectionHeader title="Deal Pipeline"
        count={deals.length}
        action={<Btn small variant="primary" onClick={onRefresh}>Refresh</Btn>}
      />
      <div style={{display:"flex",gap:10,minWidth:"max-content"}}>
        {stages.map(function(stage) {
          var color = STAGE_COLORS[stage];
          var p = pipeline[stage] || {count:0, value:0};
          var stageDeals = deals.filter(function(d){return d.stage===stage});
          return (
            <div key={stage} style={{width:220,flexShrink:0}}>
              {/* Column header */}
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

              {/* Deal cards */}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {stageDeals.map(function(deal) {
                  return (
                    <div key={deal.id} style={{background:T.surface,borderRadius:"0 0 8px 8px",
                      border:"1px solid "+T.border,borderTop:"none",padding:12}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.textPrimary,marginBottom:6,
                        lineHeight:1.3}}>{deal.title}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:11,fontWeight:700,color:T.teal,fontFamily:"monospace"}}>
                          ${(deal.value/1000).toFixed(0)}K
                        </span>
                        <CompliancePill status={deal.compliance_status}/>
                      </div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {stages.filter(function(s){return s!==stage && s!=="lost"}).slice(0,3).map(function(s){
                          return (
                            <button key={s} onClick={function(){onMoveStage(deal.id,s)}} style={{
                              padding:"2px 7px",borderRadius:4,border:"none",cursor:"pointer",
                              fontSize:8,fontWeight:600,background:STAGE_COLORS[s]+"15",
                              color:STAGE_COLORS[s],textTransform:"capitalize"}}>
                              → {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
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
function ContactsBook() {
  var [contacts, setContacts] = useState([]);
  var [q, setQ] = useState("");
  var [statusFilter, setStatusFilter] = useState("");
  var [loading, setLoading] = useState(true);

  useEffect(function(){
    api("/search/contacts").then(function(d){
      if(d.success){ setContacts(d.data); setLoading(false); }
    });
  }, []);

  var filtered = useMemo(function(){
    return contacts.filter(function(c){
      if(statusFilter && c.status !== statusFilter) return false;
      if(q){
        var h = (c.name+" "+c.company+" "+c.title+" "+c.email).toLowerCase();
        if(!h.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [contacts, q, statusFilter]);

  var STATUS_COLORS = {discovered:T.blue,contacted:T.purple,meeting:T.orange,won:T.green,lost:T.red};
  var thStyle = {padding:"8px 12px",fontSize:10,fontWeight:700,color:T.textMuted,
    textTransform:"uppercase",letterSpacing:0.8,textAlign:"left",
    borderBottom:"1px solid "+T.border,whiteSpace:"nowrap"};

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Toolbar */}
      <div style={{padding:"12px 16px",borderBottom:"1px solid "+T.border,display:"flex",gap:8,alignItems:"center"}}>
        <input value={q} onChange={function(e){setQ(e.target.value)}} placeholder="Search contacts..."
          style={{flex:1,maxWidth:280,background:T.surface,border:"1px solid "+T.border,borderRadius:7,
            padding:"7px 12px",color:T.textPrimary,fontSize:12,outline:"none"}}/>
        <select value={statusFilter} onChange={function(e){setStatusFilter(e.target.value)}}
          style={{background:T.surface,border:"1px solid "+T.border,borderRadius:7,padding:"7px 10px",
            color:T.textPrimary,fontSize:12,outline:"none"}}>
          <option value="">All Statuses</option>
          {["discovered","contacted","meeting","won","lost"].map(function(s){
            return <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>;
          })}
        </select>
        <span style={{fontSize:12,color:T.textMuted,marginLeft:"auto"}}>
          <span style={{color:T.textPrimary,fontWeight:700}}>{filtered.length}</span> contacts
        </span>
        <a href={API_BASE+"/api/search/export-csv"} style={{
          padding:"6px 12px",borderRadius:7,fontSize:11,fontWeight:600,
          background:T.purple+"15",color:T.purple,textDecoration:"none"}}>
          Export CSV
        </a>
      </div>

      {/* Table */}
      <div style={{flex:1,overflow:"auto"}}>
        {loading ? (
          <div style={{padding:40,textAlign:"center",color:T.textFaint,fontSize:13}}>Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:60,textAlign:"center",color:T.textFaint}}>
            <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>👥</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No contacts yet</div>
            <div style={{fontSize:12}}>Unlock leads from Search to build your contact book</div>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:T.surface}}>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Country</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(c, i) {
                return (
                  <tr key={c.id} style={{borderBottom:"1px solid "+T.border,
                    background: i%2===0 ? "transparent" : T.surface+"60"}}
                    onMouseEnter={function(e){e.currentTarget.style.background=T.surfaceHover}}
                    onMouseLeave={function(e){e.currentTarget.style.background= i%2===0 ? "transparent" : T.surface+"60"}}>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Avatar name={c.name} size={26}/>
                        <span style={{fontSize:12,fontWeight:600,color:T.textPrimary}}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{padding:"10px 12px",fontSize:12,color:T.textPrimary}}>{c.company}</td>
                    <td style={{padding:"10px 12px",fontSize:11,color:T.textMuted,whiteSpace:"nowrap"}}>{c.title}</td>
                    <td style={{padding:"10px 12px",fontSize:11,color:T.textMuted,fontFamily:"monospace"}}>{c.email}</td>
                    <td style={{padding:"10px 12px"}}><ScorePill score={c.lead_score||0}/></td>
                    <td style={{padding:"10px 12px",fontSize:11,color:T.textMuted}}>{c.country}</td>
                    <td style={{padding:"10px 12px"}}>
                      <Pill label={c.status} color={STATUS_COLORS[c.status]||T.textFaint}/>
                    </td>
                    <td style={{padding:"10px 12px",fontSize:11,fontWeight:700,color:T.teal,fontFamily:"monospace"}}>
                      {c.deal_value > 0 ? "$"+(c.deal_value/1000).toFixed(0)+"K" : "—"}
                    </td>
                  </tr>
                );
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

  return (
    <div style={{flex:1,overflow:"auto",padding:20}}>
      <SectionHeader title="Overview"/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
        <StatCard label="Credits" value={stats.credits||0} color={T.blue} icon="💎" sub="Available to unlock leads"/>
        <StatCard label="Pipeline Value" value={"$"+((stats.pipeline_value||0)/1000).toFixed(0)+"K"} color={T.purple} icon="📈" sub={(stats.total_deals||0)+" active deals"}/>
        <StatCard label="Deals Won" value={stats.won||0} color={T.green} icon="🏆" sub={"Win rate: "+(stats.conversion||"0%")}/>
        <StatCard label="Hot Deals" value={stats.hot_deals||0} color={T.orange} icon="🔥" sub="Proposal + Negotiation"/>
        <StatCard label="Saved Leads" value={stats.leads_saved||0} color={T.teal} icon="👥" sub="In contacts book"/>
        <StatCard label="Plan" value={(stats.plan||"trial").toUpperCase()} color={T.blue} icon="⭐" sub="Current subscription"/>
      </div>

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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
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

// ─── Payment / Billing ────────────────────────────────────────────────────────
function PaymentView() {
  var [plans, setPlans] = useState(null);
  var [methods, setMethods] = useState(null);
  useEffect(function(){
    apiFetch("/payment/plans").then(function(d){if(d.success) setPlans(d.plans)});
    apiFetch("/payment/methods").then(function(d){if(d.success) setMethods(d.methods)});
  }, []);

  return (
    <div style={{flex:1,overflow:"auto",padding:20}}>
      <SectionHeader title="Billing & Plans"/>
      <p style={{fontSize:12,color:T.textMuted,marginBottom:20}}>
        Transfer payment · Email receipt to billing@nanoneuron.ai · Access restored within 24 hours
      </p>

      {plans && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginBottom:28}}>
          {plans.map(function(p) {
            var isPro = p.id === "pro";
            var color = p.id==="starter" ? T.blue : p.id==="pro" ? T.purple : T.green;
            return (
              <div key={p.id} style={{background:T.surface,borderRadius:14,
                border:`1px solid ${isPro ? color+"40" : T.border}`,padding:24,position:"relative"}}>
                {isPro && <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",
                  padding:"2px 12px",borderRadius:12,fontSize:9,fontWeight:700,
                  background:color+"25",color,border:"1px solid "+color+"30"}}>Most Popular</div>}
                <div style={{fontSize:13,fontWeight:700,color,marginBottom:8}}>{p.name}</div>
                <div style={{fontSize:30,fontWeight:800,color:T.textPrimary}}>
                  ${p.price_usd}<span style={{fontSize:12,color:T.textMuted,fontWeight:400}}>/mo</span>
                </div>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:16}}>₹{p.price_inr.toLocaleString()}/month</div>
                {p.features.map(function(f){
                  return (
                    <div key={f} style={{fontSize:11,color:T.textMuted,padding:"3px 0",display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{color:T.green,fontSize:10}}>✓</span>{f}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,marginBottom:12}}>Payment Methods</div>
      {methods && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
          {methods.map(function(m) {
            return (
              <div key={m.id} style={{background:T.surface,borderRadius:10,border:"1px solid "+T.border,padding:16}}>
                <div style={{fontSize:12,fontWeight:700,color:T.textPrimary,marginBottom:10}}>{m.name}</div>
                {typeof m.details === "object" ? Object.entries(m.details).map(function(e){
                  return (
                    <div key={e[0]} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",
                      borderBottom:"1px solid "+T.border,fontSize:10}}>
                      <span style={{color:T.textMuted,textTransform:"capitalize"}}>{e[0].replace(/_/g," ")}</span>
                      <span style={{color:T.blue,fontFamily:"monospace",fontWeight:600}}>{e[1]}</span>
                    </div>
                  );
                }) : <div style={{fontSize:11,color:T.textMuted}}>{m.details}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{marginTop:20,padding:16,background:T.teal+"08",borderRadius:10,border:"1px solid "+T.teal+"20"}}>
        <div style={{fontSize:12,fontWeight:700,color:T.teal,marginBottom:8}}>After Payment</div>
        <div style={{fontSize:11,color:T.textMuted,lineHeight:2}}>
          1. Transfer to any method above &nbsp;·&nbsp;
          2. Email receipt to billing@nanoneuron.ai &nbsp;·&nbsp;
          3. Include your registered email &nbsp;·&nbsp;
          4. Access restored within 24 hours
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

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.textPrimary,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header style={{height:52,borderBottom:"1px solid "+T.border,display:"flex",
        alignItems:"center",padding:"0 16px",gap:12,flexShrink:0,background:T.sidebar,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,
            background:`linear-gradient(135deg,${T.blue},${T.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:15,fontWeight:900,color:"#07090F"}}>N</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,letterSpacing:-0.3}}>Nanoneuron</div>
            <div style={{fontSize:8,color:T.textMuted,marginTop:-2}}>CRM · nanoneuron.ai</div>
          </div>
        </div>

        <div style={{flex:1,maxWidth:400,marginLeft:16}}>
          <input placeholder="Search leads, companies, contacts..."
            style={{width:"100%",background:T.surface,border:"1px solid "+T.border,
              borderRadius:8,padding:"7px 14px",color:T.textPrimary,fontSize:12,outline:"none"}}
            onFocus={function(){setTab("search")}}/>
        </div>

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
          {trialInfo && trialInfo.status === "trial" && (
            <div style={{fontSize:10,padding:"3px 10px",borderRadius:6,
              background:T.orange+"15",color:T.orange,fontWeight:600}}>
              Trial: {trialInfo.days_left}d left
            </div>
          )}
          {trialInfo && trialInfo.is_paid && (
            <div style={{fontSize:10,padding:"3px 10px",borderRadius:6,
              background:T.green+"15",color:T.green,fontWeight:600}}>
              ✓ {(trialInfo.plan||"").toUpperCase()}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",
            background:T.blue+"12",borderRadius:6,border:"1px solid "+T.blue+"20"}}>
            <span style={{fontSize:9,color:T.textMuted,fontWeight:600}}>CREDITS</span>
            <span style={{fontSize:13,fontWeight:800,color:T.blue,fontFamily:"monospace"}}>{stats.credits||0}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <Avatar name={user ? user.name : "?"} size={28}/>
            <div style={{lineHeight:1.2}}>
              <div style={{fontSize:11,fontWeight:600}}>{user ? user.name : "User"}</div>
              <div style={{fontSize:9,color:T.textMuted}}>{user ? user.email : ""}</div>
            </div>
          </div>
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
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
        <nav style={{width:200,flexShrink:0,background:T.sidebar,borderRight:"1px solid "+T.border,
          padding:"10px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {NAV.map(function(item) {
            var active = tab === item.id;
            return (
              <button key={item.id} onClick={function(){setTab(item.id)}} style={{
                display:"flex",alignItems:"center",gap:9,padding:"9px 12px",
                borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",width:"100%",
                background: active ? T.blue+"18" : "transparent",
                color: active ? T.blue : T.textMuted,
                fontWeight: active ? 700 : 500,
                fontSize:12,
                transition:"background 0.15s,color 0.15s",
              }}
              onMouseEnter={function(e){if(!active)e.currentTarget.style.background=T.surface}}
              onMouseLeave={function(e){if(!active)e.currentTarget.style.background="transparent"}}>
                <span style={{fontSize:14,width:18,textAlign:"center",flexShrink:0}}>{item.icon}</span>
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
        <main style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* Dashboard */}
          {tab==="dashboard" && <DashboardOverview stats={stats} pipeline={pipeline}/>}

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
            />
          )}

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

          {/* Earnings */}
          {tab==="earnings" && <EarningsView/>}

          {/* Payment */}
          {tab==="payment" && <PaymentView/>}

        </main>
      </div>
    </div>
  );
}
