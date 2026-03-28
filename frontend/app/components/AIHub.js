"use client";
import { useState, useRef, useEffect } from "react";
import { apiFetch, API_BASE } from "../../lib/api";

// ─── Design tokens (match dashboard) ─────────────────────────────────────────
var T = {
  bg:"#07090F", surface:"#0F1120", sidebar:"#0B0D17",
  surfaceHover:"#141728", border:"rgba(255,255,255,0.06)",
  borderStrong:"rgba(255,255,255,0.1)",
  blue:"#4F8EF7", teal:"#00D4AA", purple:"#A855F7",
  orange:"#FF8C42", green:"#00D97E", red:"#FF3B5C",
  textPrimary:"#E2E8F0", textMuted:"rgba(226,232,240,0.45)",
  textFaint:"rgba(226,232,240,0.2)",
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Inp({label, value, onChange, placeholder, multiline, rows=3}) {
  var base = {width:"100%",background:T.surface,border:"1px solid "+T.border,
    borderRadius:8,padding:"9px 12px",color:T.textPrimary,fontSize:12,
    outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  return (
    <div style={{marginBottom:10}}>
      {label && <label style={{fontSize:10,color:T.textMuted,fontWeight:600,
        display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>{label}</label>}
      {multiline
        ? <textarea value={value} onChange={onChange} placeholder={placeholder}
            rows={rows} style={{...base,resize:"vertical",lineHeight:1.6}}/>
        : <input value={value} onChange={onChange} placeholder={placeholder} style={base}/>
      }
    </div>
  );
}

function Select({label, value, onChange, options}) {
  return (
    <div style={{marginBottom:10}}>
      {label && <label style={{fontSize:10,color:T.textMuted,fontWeight:600,
        display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>{label}</label>}
      <select value={value} onChange={onChange} style={{
        width:"100%",background:T.surface,border:"1px solid "+T.border,borderRadius:8,
        padding:"9px 12px",color:T.textPrimary,fontSize:12,outline:"none"}}>
        {options.map(function(o){
          var v = typeof o==="string"?o:o.v, l = typeof o==="string"?o:o.l;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </div>
  );
}

function RunBtn({onClick, loading, label="Generate with Claude"}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer",
      fontSize:12,fontWeight:700,width:"100%",marginTop:4,
      background:loading?"rgba(79,142,247,0.2)":`linear-gradient(135deg,${T.blue},${T.purple})`,
      color:loading?T.textMuted:"#07090F",opacity:loading?0.7:1,
    }}>
      {loading ? "⏳ Claude is thinking..." : "⚡ "+label}
    </button>
  );
}

function ResultBox({title, content, loading}) {
  if (loading) return (
    <div style={{padding:20,background:T.blue+"08",borderRadius:10,
      border:"1px solid "+T.blue+"20",textAlign:"center",marginTop:12}}>
      <div style={{fontSize:20,marginBottom:8}}>🤖</div>
      <div style={{fontSize:12,color:T.blue,fontWeight:600}}>Claude is working...</div>
    </div>
  );
  if (!content) return null;
  return (
    <div style={{marginTop:12,background:T.surface,borderRadius:10,
      border:"1px solid "+T.border,overflow:"hidden"}}>
      {title && <div style={{padding:"8px 14px",borderBottom:"1px solid "+T.border,
        fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.5}}>
        {title}
      </div>}
      <div style={{padding:14,fontSize:12,color:T.textPrimary,lineHeight:1.7,
        whiteSpace:"pre-wrap",fontFamily:"inherit"}}>
        {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
      </div>
      <div style={{padding:"8px 14px",borderTop:"1px solid "+T.border,display:"flex",gap:6}}>
        <button onClick={function(){navigator.clipboard.writeText(
          typeof content==="string" ? content : JSON.stringify(content,null,2)
        )}} style={{padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",
          fontSize:9,fontWeight:600,background:"rgba(255,255,255,0.06)",color:T.textMuted}}>
          Copy
        </button>
      </div>
    </div>
  );
}

function JsonCard({data}) {
  if (!data || typeof data !== "object") return null;
  var skip = new Set(["success","engine","raw"]);
  return (
    <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
      {Object.entries(data).filter(function(e){return !skip.has(e[0])}).map(function([key,val]){
        var label = key.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
        return (
          <div key={key} style={{background:T.surface,borderRadius:10,
            border:"1px solid "+T.border,padding:12}}>
            <div style={{fontSize:9,color:T.textMuted,fontWeight:700,textTransform:"uppercase",
              letterSpacing:0.8,marginBottom:6}}>{label}</div>
            {Array.isArray(val) ? (
              <ul style={{margin:0,padding:"0 0 0 16px"}}>
                {val.map(function(item,i){
                  return <li key={i} style={{fontSize:12,color:T.textPrimary,marginBottom:4,lineHeight:1.6}}>
                    {typeof item === "object" ? JSON.stringify(item) : item}
                  </li>;
                })}
              </ul>
            ) : typeof val === "object" ? (
              <div style={{fontSize:11,color:T.textMuted,fontFamily:"monospace",fontSize:11}}>
                {JSON.stringify(val,null,2)}
              </div>
            ) : typeof val === "boolean" ? (
              <span style={{fontSize:12,fontWeight:700,color:val?T.green:T.red}}>
                {val?"Yes":"No"}
              </span>
            ) : (
              <div style={{fontSize:12,color:T.textPrimary,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{String(val)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tool panel wrapper ───────────────────────────────────────────────────────
function ToolPanel({icon, title, desc, children}) {
  return (
    <div style={{background:T.sidebar,borderRadius:12,border:"1px solid "+T.border,padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:36,height:36,borderRadius:9,
          background:`linear-gradient(135deg,${T.blue}20,${T.purple}20)`,
          border:"1px solid "+T.blue+"30",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
          {icon}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{title}</div>
          <div style={{fontSize:10,color:T.textMuted}}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── 1. Draft Email ───────────────────────────────────────────────────────────
function EmailTool() {
  var [form, setForm] = useState({contact_name:"",contact_title:"",company_name:"",
    language:"en",tone:"professional",context:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="✉️" title="Draft Email" desc="Personalized cold outreach in any language">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Contact Name" value={form.contact_name} onChange={f("contact_name")} placeholder="Sarah Chen"/>
        <Inp label="Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CTO"/>
        <Inp label="Company" value={form.company_name} onChange={f("company_name")} placeholder="TechFlow Inc"/>
        <Select label="Language" value={form.language} onChange={f("language")} options={[
          {v:"en",l:"English"},{v:"ja",l:"Japanese"},{v:"de",l:"German"},
          {v:"hi",l:"Hindi"},{v:"fr",l:"French"},{v:"es",l:"Spanish"},
          {v:"pt",l:"Portuguese"},{v:"ar",l:"Arabic"},{v:"zh",l:"Chinese"},
        ]}/>
        <Select label="Tone" value={form.tone} onChange={f("tone")} options={[
          "professional","friendly","urgent","consultative",
        ]}/>
      </div>
      <Inp label="Context (optional)" value={form.context} onChange={f("context")}
        placeholder="They just raised $10M Series A..." multiline rows={2}/>
      <RunBtn loading={loading} onClick={function(){
        setLoading(true);
        apiFetch("/claude/draft-email",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      <ResultBox title="Claude-Generated Email" content={result?.email} loading={loading&&!result}/>
    </ToolPanel>
  );
}

// ─── 2. Email Sequence ────────────────────────────────────────────────────────
function SequenceTool() {
  var [form, setForm] = useState({contact_name:"",contact_title:"",company_name:"",context:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="📧" title="Email Sequence" desc="3-step follow-up campaign (Day 1, 4, 9)">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Contact Name" value={form.contact_name} onChange={f("contact_name")} placeholder="David Park"/>
        <Inp label="Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CEO"/>
        <Inp label="Company" value={form.company_name} onChange={f("company_name")} placeholder="CloudScale"/>
      </div>
      <Inp label="Context" value={form.context} onChange={f("context")}
        placeholder="Fintech company, 200 employees, uses Salesforce..." multiline rows={2}/>
      <RunBtn loading={loading} label="Generate 3-Email Sequence" onClick={function(){
        setLoading(true);
        apiFetch("/claude/email-sequence",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result?.emails && result.emails.map(function(em,i){
        return (
          <div key={i} style={{marginTop:10,background:T.surface,borderRadius:10,
            border:"1px solid "+T.border,padding:14}}>
            <div style={{fontSize:10,fontWeight:700,color:T.blue,marginBottom:6}}>
              EMAIL {i+1} — Day {em.day}
            </div>
            <div style={{fontSize:11,fontWeight:600,color:T.textPrimary,marginBottom:6}}>
              Subject: {em.subject}
            </div>
            <div style={{fontSize:12,color:T.textMuted,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{em.body}</div>
          </div>
        );
      })}
    </ToolPanel>
  );
}

// ─── 3. Deal Coach ────────────────────────────────────────────────────────────
function DealCoachTool() {
  var [form, setForm] = useState({deal_title:"",deal_value:0,stage:"lead",
    country:"US",contact_title:"",days_in_stage:0,notes:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  var healthColor = {green:T.green,yellow:T.orange,red:T.red};

  return (
    <ToolPanel icon="🏆" title="Deal Coach" desc="Claude analyses your deal and gives strategy advice">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Deal Title" value={form.deal_title} onChange={f("deal_title")} placeholder="TechFlow — CTO"/>
        <Inp label="Value ($)" value={form.deal_value} onChange={f("deal_value")} placeholder="25000"/>
        <Select label="Stage" value={form.stage} onChange={f("stage")} options={[
          "lead","qualified","proposal","negotiation","won","lost"]}/>
        <Select label="Country" value={form.country} onChange={f("country")} options={[
          "US","IN","GB","DE","AU","CA","FR","SG","AE","JP","BR"]}/>
        <Inp label="Contact Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CTO"/>
        <Inp label="Days in Stage" value={form.days_in_stage} onChange={f("days_in_stage")} placeholder="7"/>
      </div>
      <Inp label="Deal Notes" value={form.notes} onChange={f("notes")}
        placeholder="Last call: they liked the demo, worried about GDPR..." multiline rows={3}/>
      <RunBtn loading={loading} label="Coach Me on This Deal" onClick={function(){
        setLoading(true);
        apiFetch("/claude/deal-coach",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result && (
        <div style={{marginTop:12}}>
          {result.deal_health && (
            <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,
                background:(healthColor[result.deal_health]||T.textMuted)+"20",
                color:healthColor[result.deal_health]||T.textMuted}}>
                {result.deal_health?.toUpperCase()} HEALTH
              </span>
              {result.win_probability !== undefined && (
                <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,
                  background:T.blue+"20",color:T.blue}}>
                  {result.win_probability}% WIN PROBABILITY
                </span>
              )}
            </div>
          )}
          {result.immediate_action && (
            <div style={{padding:12,background:T.orange+"10",borderRadius:8,
              border:"1px solid "+T.orange+"25",marginBottom:8}}>
              <div style={{fontSize:9,color:T.orange,fontWeight:700,marginBottom:4}}>DO THIS TODAY</div>
              <div style={{fontSize:12,color:T.textPrimary}}>{result.immediate_action}</div>
            </div>
          )}
          <JsonCard data={result}/>
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 4. Company Research ──────────────────────────────────────────────────────
function CompanyResearchTool() {
  var [form, setForm] = useState({company_name:"",domain:"",industry:"",country:"",employees:"",revenue:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="🔬" title="Company Research" desc="Sales intelligence brief on any company">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Company Name" value={form.company_name} onChange={f("company_name")} placeholder="TechFlow Inc"/>
        <Inp label="Domain" value={form.domain} onChange={f("domain")} placeholder="techflow.io"/>
        <Inp label="Industry" value={form.industry} onChange={f("industry")} placeholder="SaaS"/>
        <Inp label="Country" value={form.country} onChange={f("country")} placeholder="US"/>
        <Inp label="Employees" value={form.employees} onChange={f("employees")} placeholder="50-200"/>
        <Inp label="Revenue" value={form.revenue} onChange={f("revenue")} placeholder="$5M-$20M"/>
      </div>
      <RunBtn loading={loading} label="Research This Company" onClick={function(){
        setLoading(true);
        apiFetch("/claude/company-research",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result?.opening_line && (
        <div style={{marginTop:12,padding:12,background:T.teal+"10",borderRadius:8,
          border:"1px solid "+T.teal+"25"}}>
          <div style={{fontSize:9,color:T.teal,fontWeight:700,marginBottom:4}}>PERFECT OPENING LINE</div>
          <div style={{fontSize:13,color:T.textPrimary,fontStyle:"italic"}}>"{result.opening_line}"</div>
        </div>
      )}
      {!loading && result && <JsonCard data={result}/>}
    </ToolPanel>
  );
}

// ─── 5. Proposal Writer ───────────────────────────────────────────────────────
function ProposalTool() {
  var [form, setForm] = useState({company_name:"",contact_name:"",contact_title:"",plan:"Pro",price_usd:199,context:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="📄" title="Proposal Writer" desc="Full business proposal in seconds">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Company" value={form.company_name} onChange={f("company_name")} placeholder="CloudScale Systems"/>
        <Inp label="Contact" value={form.contact_name} onChange={f("contact_name")} placeholder="David Park"/>
        <Inp label="Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CEO"/>
        <Select label="Plan" value={form.plan} onChange={f("plan")} options={["Starter","Pro","Business"]}/>
        <Inp label="Price (USD/mo)" value={form.price_usd} onChange={f("price_usd")} placeholder="199"/>
      </div>
      <Inp label="Context (deal notes)" value={form.context} onChange={f("context")}
        placeholder="They need GDPR compliance for EU expansion..." multiline rows={2}/>
      <RunBtn loading={loading} label="Write Proposal" onClick={function(){
        setLoading(true);
        apiFetch("/claude/proposal",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      <ResultBox title="Sales Proposal (Markdown)" content={result?.proposal} loading={loading&&!result}/>
    </ToolPanel>
  );
}

// ─── 6. Call Script ───────────────────────────────────────────────────────────
function CallScriptTool() {
  var [form, setForm] = useState({contact_name:"",contact_title:"",company_name:"",objective:"book a demo",notes:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="📞" title="Call Script" desc="Phone outreach script with objection responses">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Contact Name" value={form.contact_name} onChange={f("contact_name")} placeholder="Felix Mueller"/>
        <Inp label="Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CEO"/>
        <Inp label="Company" value={form.company_name} onChange={f("company_name")} placeholder="TechHaus GmbH"/>
        <Select label="Objective" value={form.objective} onChange={f("objective")} options={[
          "book a demo","qualify the lead","close the deal","reactivate a lost deal",
        ]}/>
      </div>
      <Inp label="Notes" value={form.notes} onChange={f("notes")}
        placeholder="German company, uses HubSpot, expanding to US..." multiline rows={2}/>
      <RunBtn loading={loading} label="Generate Call Script" onClick={function(){
        setLoading(true);
        apiFetch("/claude/call-script",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result?.opener && (
        <div style={{marginTop:12}}>
          {[
            {key:"opener",label:"OPENER",color:T.blue},
            {key:"value_pitch",label:"VALUE PITCH (20 SEC)",color:T.teal},
            {key:"close",label:"CLOSE",color:T.green},
            {key:"voicemail",label:"VOICEMAIL",color:T.purple},
          ].map(function(s){
            return result[s.key] ? (
              <div key={s.key} style={{marginBottom:8,padding:12,background:s.color+"08",
                borderRadius:8,border:"1px solid "+s.color+"20"}}>
                <div style={{fontSize:9,color:s.color,fontWeight:700,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:12,color:T.textPrimary,lineHeight:1.6}}>{result[s.key]}</div>
              </div>
            ) : null;
          })}
          {result.objection_responses && (
            <div style={{padding:12,background:T.surface,borderRadius:8,border:"1px solid "+T.border,marginBottom:8}}>
              <div style={{fontSize:9,color:T.orange,fontWeight:700,marginBottom:8}}>OBJECTION RESPONSES</div>
              {Object.entries(result.objection_responses).map(function([obj,resp]){
                return (
                  <div key={obj} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid "+T.border}}>
                    <div style={{fontSize:10,color:T.orange,fontWeight:600,marginBottom:3}}>
                      "{ obj }"
                    </div>
                    <div style={{fontSize:11,color:T.textPrimary}}>{resp}</div>
                  </div>
                );
              })}
            </div>
          )}
          {result.qualifying_questions && (
            <div style={{padding:12,background:T.surface,borderRadius:8,border:"1px solid "+T.border}}>
              <div style={{fontSize:9,color:T.textMuted,fontWeight:700,marginBottom:6}}>QUALIFYING QUESTIONS</div>
              {result.qualifying_questions.map(function(q,i){
                return <div key={i} style={{fontSize:12,color:T.textPrimary,marginBottom:4}}>
                  {i+1}. {q}
                </div>;
              })}
            </div>
          )}
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 7. Objection Handler ─────────────────────────────────────────────────────
function ObjectionTool() {
  var [form, setForm] = useState({objection:"",contact_title:"",deal_stage:"proposal",context:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="🛡️" title="Objection Handler" desc="Claude responds to any sales objection">
      <Inp label="The Objection" value={form.objection} onChange={f("objection")}
        placeholder="We already use a competitor and are happy with them." multiline rows={2}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Contact Title" value={form.contact_title} onChange={f("contact_title")} placeholder="VP Sales"/>
        <Select label="Deal Stage" value={form.deal_stage} onChange={f("deal_stage")} options={[
          "lead","qualified","proposal","negotiation"]}/>
      </div>
      <RunBtn loading={loading} label="Handle This Objection" onClick={function(){
        setLoading(true);
        apiFetch("/claude/objection-handler",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result?.response && (
        <div style={{marginTop:12}}>
          {[
            {key:"acknowledge",label:"ACKNOWLEDGE",color:T.teal},
            {key:"reframe",label:"REFRAME",color:T.blue},
            {key:"response",label:"YOUR RESPONSE",color:T.green},
            {key:"follow_up_question",label:"RE-ENGAGE WITH",color:T.purple},
          ].map(function(s){
            return result[s.key] ? (
              <div key={s.key} style={{marginBottom:8,padding:12,background:s.color+"08",
                borderRadius:8,border:"1px solid "+s.color+"20"}}>
                <div style={{fontSize:9,color:s.color,fontWeight:700,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:12,color:T.textPrimary,lineHeight:1.6}}>{result[s.key]}</div>
              </div>
            ) : null;
          })}
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 8. Subject Lines ─────────────────────────────────────────────────────────
function SubjectTool() {
  var [form, setForm] = useState({contact_name:"",contact_title:"",company_name:"",angle:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  var typeColor = {curiosity:T.purple,ROI:T.green,pain:T.red,social_proof:T.blue,direct:T.teal};

  return (
    <ToolPanel icon="✍️" title="Subject Lines" desc="5 high-converting email subject lines">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Contact" value={form.contact_name} onChange={f("contact_name")} placeholder="Sarah Chen"/>
        <Inp label="Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CTO"/>
        <Inp label="Company" value={form.company_name} onChange={f("company_name")} placeholder="TechFlow"/>
        <Inp label="Angle (optional)" value={form.angle} onChange={f("angle")} placeholder="Cost savings, ROI..."/>
      </div>
      <RunBtn loading={loading} label="Generate Subject Lines" onClick={function(){
        setLoading(true);
        apiFetch("/claude/subject-lines",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result?.subjects && (
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
          {result.subjects.map(function(s,i){
            var color = typeColor[s.type] || T.blue;
            var isBest = result.best_pick === i;
            return (
              <div key={i} style={{padding:"10px 12px",background:isBest?T.blue+"15":T.surface,
                borderRadius:8,border:"1px solid "+(isBest?T.blue+"40":T.border),
                display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1}}>
                  {isBest && <div style={{fontSize:8,color:T.blue,fontWeight:700,marginBottom:3}}>BEST PICK</div>}
                  <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{s.line}</div>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <span style={{padding:"2px 7px",borderRadius:8,fontSize:8,fontWeight:600,
                    background:color+"15",color}}>{s.type}</span>
                  <span style={{padding:"2px 7px",borderRadius:8,fontSize:8,fontWeight:600,
                    background:s.open_rate==="high"?T.green+"15":T.orange+"15",
                    color:s.open_rate==="high"?T.green:T.orange}}>
                    {s.open_rate} open rate
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 9. Translate ─────────────────────────────────────────────────────────────
function TranslateTool() {
  var [text, setText] = useState("");
  var [lang, setLang] = useState("Japanese");
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);

  return (
    <ToolPanel icon="🌍" title="Translate" desc="Translate emails and proposals to any language">
      <Inp label="Text to Translate" value={text} onChange={function(e){setText(e.target.value)}}
        placeholder="Paste your email or proposal here..." multiline rows={5}/>
      <Select label="Target Language" value={lang} onChange={function(e){setLang(e.target.value)}}
        options={["Japanese","German","French","Hindi","Spanish","Portuguese","Arabic","Chinese (Simplified)",
          "Korean","Italian","Dutch","Polish","Turkish","Swedish","Thai","Vietnamese"]}/>
      <RunBtn loading={loading} label="Translate" onClick={function(){
        setLoading(true);
        apiFetch("/claude/translate",{method:"POST",body:JSON.stringify({text,target_language:lang})})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      <ResultBox title={"Translation → "+lang} content={result?.translated} loading={loading&&!result}/>
    </ToolPanel>
  );
}

// ─── 10. Meeting Prep ─────────────────────────────────────────────────────────
function MeetingPrepTool() {
  var [form, setForm] = useState({contact_name:"",contact_title:"",company_name:"",meeting_type:"discovery",deal_value:0,notes:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="📅" title="Meeting Prep" desc="Pre-meeting intelligence brief from Claude">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Contact" value={form.contact_name} onChange={f("contact_name")} placeholder="Oliver Hughes"/>
        <Inp label="Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CEO"/>
        <Inp label="Company" value={form.company_name} onChange={f("company_name")} placeholder="BrightWave"/>
        <Select label="Meeting Type" value={form.meeting_type} onChange={f("meeting_type")} options={[
          {v:"discovery",l:"Discovery"},{v:"demo",l:"Demo"},{v:"proposal",l:"Proposal"},
          {v:"negotiation",l:"Negotiation"},{v:"closing",l:"Closing"},
        ]}/>
        <Inp label="Deal Value ($)" value={form.deal_value} onChange={f("deal_value")} placeholder="45000"/>
      </div>
      <Inp label="Notes" value={form.notes} onChange={f("notes")}
        placeholder="Last call: interested in GDPR features, asked about pricing..." multiline rows={2}/>
      <RunBtn loading={loading} label="Prepare Me for This Meeting" onClick={function(){
        setLoading(true);
        apiFetch("/claude/meeting-prep",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result && <JsonCard data={result}/>}
    </ToolPanel>
  );
}

// ─── 11. LinkedIn Message ─────────────────────────────────────────────────────
function LinkedInTool() {
  var [form, setForm] = useState({contact_name:"",contact_title:"",company_name:"",mutual_context:"",message_type:"connection"});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  return (
    <ToolPanel icon="💼" title="LinkedIn Message" desc="Connection notes and InMail that get replies">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp label="Name" value={form.contact_name} onChange={f("contact_name")} placeholder="Kenneth Ng"/>
        <Inp label="Title" value={form.contact_title} onChange={f("contact_title")} placeholder="CEO"/>
        <Inp label="Company" value={form.company_name} onChange={f("company_name")} placeholder="PayNow Asia"/>
        <Select label="Type" value={form.message_type} onChange={f("message_type")} options={[
          {v:"connection",l:"Connection Note (300 chars)"},{v:"follow-up",l:"Follow-up Message"},
          {v:"inmail",l:"InMail (1900 chars)"},
        ]}/>
      </div>
      <Inp label="Mutual Context" value={form.mutual_context} onChange={f("mutual_context")}
        placeholder="We both attended Singapore Fintech Festival..." multiline rows={2}/>
      <RunBtn loading={loading} label="Write LinkedIn Message" onClick={function(){
        setLoading(true);
        apiFetch("/claude/linkedin-message",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result?.message && (
        <div style={{marginTop:12}}>
          <ResultBox title="LinkedIn Message" content={result.message}/>
          <div style={{fontSize:10,color:result.char_count>result.limit?T.red:T.textMuted,marginTop:6}}>
            {result.char_count} / {result.limit} characters
          </div>
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 12. Compliance Advisor ───────────────────────────────────────────────────
function ComplianceTool() {
  var [form, setForm] = useState({country:"",industry:"SaaS",scenario:""});
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var f = function(k){ return function(e){ setForm(function(p){return {...p,[k]:e.target.value}}); }; };

  var riskColor = {low:T.green,medium:T.orange,high:T.red,critical:"#FF0000"};

  return (
    <ToolPanel icon="⚖️" title="Compliance Advisor" desc="Country-specific compliance guidance from Claude">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Select label="Country" value={form.country} onChange={f("country")} options={[
          {v:"",l:"Select country"},{v:"DE",l:"Germany (GDPR)"},{v:"GB",l:"UK (UK GDPR)"},
          {v:"FR",l:"France (GDPR+CNIL)"},{v:"US",l:"USA (CCPA)"},{v:"IN",l:"India (DPDPA)"},
          {v:"BR",l:"Brazil (LGPD)"},{v:"JP",l:"Japan (APPI)"},{v:"SG",l:"Singapore (PDPA)"},
          {v:"AU",l:"Australia"},{v:"CA",l:"Canada (PIPEDA)"},{v:"KR",l:"South Korea (PIPA)"},
        ]}/>
        <Inp label="Industry" value={form.industry} onChange={f("industry")} placeholder="SaaS"/>
      </div>
      <Inp label="Your Scenario" value={form.scenario} onChange={f("scenario")}
        placeholder="I want to cold email 500 business contacts in Germany using LinkedIn data..." multiline rows={3}/>
      <RunBtn loading={loading} label="Get Compliance Advice" onClick={function(){
        setLoading(true);
        apiFetch("/claude/compliance-advice",{method:"POST",body:JSON.stringify(form)})
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result && (
        <div style={{marginTop:12}}>
          {result.risk_level && (
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,
                background:(riskColor[result.risk_level]||T.textMuted)+"20",
                color:riskColor[result.risk_level]||T.textMuted}}>
                {result.risk_level?.toUpperCase()} RISK
              </span>
              <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,
                background:T.blue+"15",color:T.blue}}>{result.applicable_law}</span>
              {result.consent_needed && (
                <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,
                  background:T.red+"15",color:T.red}}>Consent Required</span>
              )}
            </div>
          )}
          {result.recommended_action && (
            <div style={{padding:12,background:T.blue+"08",borderRadius:8,
              border:"1px solid "+T.blue+"20",marginBottom:8}}>
              <div style={{fontSize:9,color:T.blue,fontWeight:700,marginBottom:4}}>RECOMMENDED ACTION</div>
              <div style={{fontSize:12,color:T.textPrimary}}>{result.recommended_action}</div>
            </div>
          )}
          <JsonCard data={result}/>
          <div style={{padding:10,background:T.orange+"08",borderRadius:8,
            border:"1px solid "+T.orange+"15",marginTop:8,fontSize:10,color:T.textMuted}}>
            ⚠️ {result.disclaimer || "Always consult a qualified legal professional for binding compliance advice."}
          </div>
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 13. Deal Scorer ──────────────────────────────────────────────────────────
function DealScorerTool() {
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var healthColor = {green:T.green,yellow:T.orange,red:T.red};
  var urgencyColor = {high:T.red,medium:T.orange,low:T.textMuted};

  return (
    <ToolPanel icon="📊" title="AI Deal Scorer" desc="Claude scores all your active deals and prioritises them">
      <div style={{padding:12,background:T.blue+"08",borderRadius:8,
        border:"1px solid "+T.blue+"15",marginBottom:12,fontSize:11,color:T.textMuted}}>
        Claude will analyse all your active pipeline deals and give each a win probability, health score, and next action.
      </div>
      <RunBtn loading={loading} label="Score My Pipeline" onClick={function(){
        setLoading(true);
        apiFetch("/claude/score-deals")
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result && (
        <div style={{marginTop:12}}>
          {result.top_priority && (
            <div style={{padding:12,background:T.green+"10",borderRadius:8,
              border:"1px solid "+T.green+"25",marginBottom:10}}>
              <div style={{fontSize:9,color:T.green,fontWeight:700,marginBottom:3}}>FOCUS ON TODAY</div>
              <div style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{result.top_priority}</div>
            </div>
          )}
          {result.scored_deals && result.scored_deals.map(function(d,i){
            var hc = healthColor[d.health] || T.textMuted;
            var uc = urgencyColor[d.urgency] || T.textMuted;
            return (
              <div key={i} style={{marginBottom:8,padding:12,background:T.surface,
                borderRadius:8,border:"1px solid "+T.border}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.textPrimary,flex:1}}>{d.title}</div>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    <span style={{padding:"2px 7px",borderRadius:6,fontSize:9,fontWeight:700,
                      background:hc+"15",color:hc}}>{d.health?.toUpperCase()}</span>
                    <span style={{padding:"2px 7px",borderRadius:6,fontSize:9,fontWeight:700,
                      background:T.blue+"15",color:T.blue}}>{d.win_probability}%</span>
                    <span style={{padding:"2px 7px",borderRadius:6,fontSize:9,fontWeight:700,
                      background:uc+"15",color:uc}}>{d.urgency?.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:5}}>{d.recommended_action}</div>
              </div>
            );
          })}
          {result.pipeline_health && (
            <div style={{padding:10,background:T.surface,borderRadius:8,border:"1px solid "+T.border,
              fontSize:11,color:T.textMuted}}>{result.pipeline_health}</div>
          )}
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 14. Daily Brief ──────────────────────────────────────────────────────────
function DailyBriefTool() {
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);

  return (
    <ToolPanel icon="☀️" title="Daily Brief" desc="Your AI-powered morning CRM briefing">
      <div style={{padding:12,background:T.purple+"08",borderRadius:8,
        border:"1px solid "+T.purple+"15",marginBottom:12,fontSize:11,color:T.textMuted}}>
        Start your day with a Claude-generated brief of your pipeline, top priorities, and a sales insight.
      </div>
      <RunBtn loading={loading} label="Get My Daily Brief" onClick={function(){
        setLoading(true);
        apiFetch("/claude/daily-brief")
        .then(function(d){setResult(d);setLoading(false)}).catch(function(){setLoading(false)});
      }}/>
      {!loading && result && (
        <div style={{marginTop:12}}>
          {result.greeting && (
            <div style={{padding:14,background:`linear-gradient(135deg,${T.blue}15,${T.purple}15)`,
              borderRadius:10,border:"1px solid "+T.blue+"20",marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:700,color:T.textPrimary,marginBottom:4}}>{result.greeting}</div>
              <div style={{fontSize:12,color:T.textMuted}}>{result.headline}</div>
            </div>
          )}
          {result.focus_today && (
            <div style={{padding:12,background:T.surface,borderRadius:8,
              border:"1px solid "+T.border,marginBottom:8}}>
              <div style={{fontSize:9,color:T.orange,fontWeight:700,marginBottom:6}}>YOUR TOP 3 FOR TODAY</div>
              {result.focus_today.map(function(item,i){
                return <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:T.textPrimary}}>
                  <span style={{color:T.orange,fontWeight:700,flexShrink:0}}>{i+1}.</span>{item}
                </div>;
              })}
            </div>
          )}
          {result.insight && (
            <div style={{padding:12,background:T.teal+"08",borderRadius:8,
              border:"1px solid "+T.teal+"20",marginBottom:8}}>
              <div style={{fontSize:9,color:T.teal,fontWeight:700,marginBottom:3}}>TODAY'S INSIGHT</div>
              <div style={{fontSize:12,color:T.textPrimary}}>{result.insight}</div>
            </div>
          )}
          {result.motivation && (
            <div style={{padding:12,background:T.purple+"08",borderRadius:8,
              border:"1px solid "+T.purple+"20",fontSize:12,color:T.textPrimary,fontStyle:"italic"}}>
              {result.motivation}
            </div>
          )}
        </div>
      )}
    </ToolPanel>
  );
}

// ─── 15. Chat ─────────────────────────────────────────────────────────────────
function ChatTool() {
  var [messages, setMessages] = useState([
    {role:"assistant", content:"Hi! I'm your Nanoneuron AI assistant powered by Claude.\n\nI know your full CRM context — deals, pipeline, contacts, credits. Ask me anything:\n- \"Draft an email to the CEO of TechFlow\"\n- \"Coach me on my biggest deal\"\n- \"How do I handle GDPR for German outreach?\"\n- \"What should I focus on today?\"\n- \"Translate this proposal to Japanese\""}
  ]);
  var [input, setInput] = useState("");
  var [streaming, setStreaming] = useState(false);
  var bottomRef = useRef(null);

  useEffect(function(){
    if (bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"});
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    var userMsg = input.trim();
    setInput("");
    var history = messages.slice(-10).filter(function(m){return m.role!=="system"});
    setMessages(function(prev){ return [...prev, {role:"user",content:userMsg}]; });
    setStreaming(true);

    var assistantMsg = {role:"assistant",content:""};
    setMessages(function(prev){ return [...prev, assistantMsg]; });

    try {
      var token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      var resp = await fetch(API_BASE+"/api/claude/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json", "Authorization":"Bearer "+token},
        body: JSON.stringify({message:userMsg, history}),
      });

      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buf = "";

      while(true) {
        var {done, value} = await reader.read();
        if (done) break;
        buf += decoder.decode(value, {stream:true});
        var lines = buf.split("\n");
        buf = lines.pop();
        for (var line of lines) {
          if (!line.startsWith("data: ")) continue;
          var data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            var parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages(function(prev){
                var updated = [...prev];
                updated[updated.length-1] = {
                  role:"assistant",
                  content: updated[updated.length-1].content + parsed.text
                };
                return updated;
              });
            }
            if (parsed.error) {
              setMessages(function(prev){
                var updated = [...prev];
                updated[updated.length-1] = {role:"assistant",content:"Error: "+parsed.error};
                return updated;
              });
            }
          } catch(_){}
        }
      }
    } catch(e) {
      setMessages(function(prev){
        var updated = [...prev];
        updated[updated.length-1] = {role:"assistant",content:"Connection error. Check ANTHROPIC_API_KEY in Railway."};
        return updated;
      });
    }
    setStreaming(false);
  }

  var SUGGESTIONS = [
    "What should I focus on today?",
    "Draft an email to a CTO about GDPR compliance",
    "How do I close a deal that's been stalled for 2 weeks?",
    "Translate this: Hi, I wanted to connect regarding our CRM platform",
    "Score my pipeline and tell me which deal to prioritize",
    "What's the best opening line for a cold email to a CEO?",
  ];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:12}}>
        {messages.length === 1 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
            {SUGGESTIONS.map(function(s,i){
              return (
                <button key={i} onClick={function(){setInput(s)}} style={{
                  padding:"6px 12px",borderRadius:20,border:"1px solid "+T.border,
                  background:"transparent",color:T.textMuted,fontSize:11,cursor:"pointer",
                  fontFamily:"inherit",textAlign:"left",lineHeight:1.4,
                }}>
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {messages.map(function(msg, i) {
          var isUser = msg.role === "user";
          return (
            <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",gap:8}}>
              {!isUser && (
                <div style={{width:28,height:28,borderRadius:7,flexShrink:0,
                  background:`linear-gradient(135deg,${T.blue},${T.purple})`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:14,fontWeight:900,color:"#07090F",marginTop:2}}>N</div>
              )}
              <div style={{
                maxWidth:"75%",padding:"10px 14px",borderRadius:12,
                background:isUser?T.blue+"20":T.surface,
                border:"1px solid "+(isUser?T.blue+"30":T.border),
                fontSize:13,lineHeight:1.7,color:T.textPrimary,
                whiteSpace:"pre-wrap",wordBreak:"break-word",
              }}>
                {msg.content}
                {streaming && i===messages.length-1 && !isUser && !msg.content && (
                  <span style={{display:"inline-flex",gap:3,alignItems:"center"}}>
                    <span style={{width:4,height:4,borderRadius:"50%",background:T.blue,animation:"pulse 1s infinite"}}/>
                    <span style={{width:4,height:4,borderRadius:"50%",background:T.blue,animation:"pulse 1s 0.2s infinite"}}/>
                    <span style={{width:4,height:4,borderRadius:"50%",background:T.blue,animation:"pulse 1s 0.4s infinite"}}/>
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 20px",borderTop:"1px solid "+T.border,
        display:"flex",gap:8,alignItems:"flex-end"}}>
        <textarea value={input}
          onChange={function(e){setInput(e.target.value)}}
          onKeyDown={function(e){
            if(e.key==="Enter" && !e.shiftKey){e.preventDefault();sendMessage();}
          }}
          placeholder="Ask Claude anything about your CRM, leads, deals, compliance..."
          rows={1}
          style={{flex:1,background:T.surface,border:"1px solid "+T.border,borderRadius:10,
            padding:"10px 14px",color:T.textPrimary,fontSize:13,outline:"none",
            resize:"none",fontFamily:"inherit",lineHeight:1.5,maxHeight:120,overflowY:"auto"}}/>
        <button onClick={sendMessage} disabled={streaming||!input.trim()} style={{
          width:38,height:38,borderRadius:9,border:"none",cursor:"pointer",flexShrink:0,
          background:streaming||!input.trim()?"rgba(79,142,247,0.2)":`linear-gradient(135deg,${T.blue},${T.purple})`,
          color:streaming||!input.trim()?T.textMuted:"#07090F",
          fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",
        }}>→</button>
      </div>
    </div>
  );
}

// ─── AI Hub Main ──────────────────────────────────────────────────────────────
var TOOLS = [
  {id:"chat",    icon:"💬", label:"AI Chat"},
  {id:"brief",   icon:"☀️", label:"Daily Brief"},
  {id:"scorer",  icon:"📊", label:"Deal Scorer"},
  {id:"coach",   icon:"🏆", label:"Deal Coach"},
  {id:"email",   icon:"✉️", label:"Email"},
  {id:"seq",     icon:"📧", label:"Sequence"},
  {id:"subj",    icon:"✍️", label:"Subject Lines"},
  {id:"call",    icon:"📞", label:"Call Script"},
  {id:"obj",     icon:"🛡️", label:"Objections"},
  {id:"research",icon:"🔬", label:"Research"},
  {id:"proposal",icon:"📄", label:"Proposal"},
  {id:"meeting", icon:"📅", label:"Meeting Prep"},
  {id:"linkedin",icon:"💼", label:"LinkedIn"},
  {id:"comply",  icon:"⚖️", label:"Compliance"},
  {id:"translate",icon:"🌍",label:"Translate"},
];

export default function AIHub() {
  var [activeTool, setActiveTool] = useState("chat");

  var toolMap = {
    chat:<ChatTool/>, brief:<DailyBriefTool/>, scorer:<DealScorerTool/>,
    coach:<DealCoachTool/>, email:<EmailTool/>, seq:<SequenceTool/>,
    subj:<SubjectTool/>, call:<CallScriptTool/>, obj:<ObjectionTool/>,
    research:<CompanyResearchTool/>, proposal:<ProposalTool/>,
    meeting:<MeetingPrepTool/>, linkedin:<LinkedInTool/>,
    comply:<ComplianceTool/>, translate:<TranslateTool/>,
  };

  var isChat = activeTool === "chat";

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Toolbar */}
      <div style={{borderBottom:"1px solid "+T.border,padding:"8px 16px",
        display:"flex",gap:4,overflowX:"auto",flexShrink:0,alignItems:"center"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.blue,marginRight:8,flexShrink:0}}>
          ⚡ Claude AI
        </span>
        {TOOLS.map(function(t){
          var active = activeTool === t.id;
          return (
            <button key={t.id} onClick={function(){setActiveTool(t.id)}} style={{
              padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",whiteSpace:"nowrap",
              fontSize:11,fontWeight:active?700:500,flexShrink:0,
              background:active?T.blue+"20":"transparent",
              color:active?T.blue:T.textMuted,
            }}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isChat ? (
        <ChatTool/>
      ) : (
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          {toolMap[activeTool]}
        </div>
      )}
    </div>
  );
}
