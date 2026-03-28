"use client";
import { useState, useEffect } from "react";
import { apiFetch, API_BASE } from "../../lib/api";

var SC = {lead:"#64748b",qualified:"#00F0FF",proposal:"#A855F7",negotiation:"#FF8C42",won:"#00FF94",lost:"#FF3B5C"};

function api(path, opts) { return apiFetch(path, opts); }

function StatCard(props) {
  return <div style={{background:"rgba(255,255,255,0.015)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",padding:"16px 14px",position:"relative",overflow:"hidden"}}>
    <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,fontFamily:"monospace"}}>{props.label}</div>
    <div style={{fontSize:22,fontWeight:800,marginTop:4}}>{props.value}</div>
    {props.sub && <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:2}}>{props.sub}</div>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+(props.color||"#00F0FF")+",transparent)"}}></div>
  </div>;
}

function ScoreBadge(props) {
  var c = props.score >= 75 ? "#FF3B5C" : props.score >= 50 ? "#FF8C42" : "#64748b";
  var l = props.score >= 75 ? "HOT" : props.score >= 50 ? "WARM" : "COLD";
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:700,background:c+"15",color:c}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:c}}></span> {props.score} {l}
  </span>;
}

export default function Dashboard() {
  var [tab, setTab] = useState("search");
  var [industry, setIndustry] = useState("");
  var [country, setCountry] = useState("");
  var [results, setResults] = useState(null);
  var [loading, setLoading] = useState(false);
  var [deals, setDeals] = useState([]);
  var [pipeline, setPipeline] = useState({});
  var [stats, setStats] = useState({});
  var [emailDraft, setEmailDraft] = useState("");
  var [emailTo, setEmailTo] = useState("");
  var [emailSubject, setEmailSubject] = useState("");
  var [emailLoading, setEmailLoading] = useState(false);
  var [emailLang, setEmailLang] = useState("en");
  var [user, setUser] = useState(null);

  var [trialInfo, setTrialInfo] = useState(null);

  useEffect(function(){
    try { setUser(JSON.parse(localStorage.getItem("user"))); } catch(e){}
    loadData();
    checkTrial();
  }, []);

  function checkTrial() {
    api("/auth/trial-status").then(function(d){if(d.success) setTrialInfo(d)});
  }

  function loadData() {
    api("/deals/").then(function(d){ if(d.success) setDeals(d.data) });
    api("/deals/pipeline").then(function(d){ if(d.success) setPipeline(d.pipeline) });
    api("/dashboard/stats").then(function(d){ if(d.success) setStats(d.stats) });
  }

  function doSearch() {
    setLoading(true);
    var p = []; if(industry) p.push("industry="+industry); if(country) p.push("country="+country);
    api("/search/discover?"+p.join("&")).then(function(d){ setResults(d); setLoading(false); loadData(); });
  }

  function unlock(domain, name) {
    api("/search/unlock",{method:"POST",body:JSON.stringify({company_domain:domain,contact_name:name})}).then(function(d){
      if(d.success){ alert("Email: "+d.lead.email+"\nScore: "+d.lead.lead_score+"\nTitle: "+d.lead.title); loadData(); }
      else alert(d.detail||"Error");
    });
  }

  function addPipeline(comp, contact) {
    api("/search/add-to-pipeline",{method:"POST",body:JSON.stringify({
      company_name:comp.company, contact_name:contact.name, contact_email:contact.email_masked,
      contact_title:contact.title, country:comp.country, deal_value:25000,
    })}).then(function(d){ if(d.success){alert("Added! Compliance: "+d.compliance.status); loadData();} });
  }

  function draftEmail(name, title, company) {
    setEmailLoading(true);
    api("/ai/draft-email",{method:"POST",body:JSON.stringify({contact_name:name,contact_title:title,company_name:company,language:emailLang})})
    .then(function(d){ setEmailDraft(d.email||""); setEmailTo(""); setEmailSubject("Intro: "+company); setEmailLoading(false); setTab("email"); });
  }

  function sendEmail() {
    if(!emailTo) return alert("Enter recipient email");
    api("/search/send-email",{method:"POST",body:JSON.stringify({to_email:emailTo,subject:emailSubject,body:emailDraft})})
    .then(function(d){ alert(d.status==="sent"?"Email sent!":"Draft saved. Add SMTP settings to send directly."); });
  }

  function moveDeal(id, stage) {
    api("/deals/"+id,{method:"PATCH",body:JSON.stringify({stage:stage})}).then(function(){ loadData(); });
  }

  var inp = {background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:12};

  return (
    <div style={{minHeight:"100vh",background:"#06080D",color:"#fff",fontFamily:"system-ui"}}>
      <header style={{padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#00F0FF,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#06080D"}}>N</div>
          <span style={{fontSize:13,fontWeight:700}}>Nanoneuron CRM</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:12,color:"#00F0FF",fontWeight:700,fontFamily:"monospace",background:"rgba(0,240,255,0.08)",padding:"4px 10px",borderRadius:6}}>{stats.credits||0} credits</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{user?user.name:""}</span>
        </div>
      </header>

      {/* TRIAL BANNER */}
      {trialInfo && trialInfo.status === "trial" && <div style={{padding:"8px 20px",background:"rgba(255,140,66,0.08)",borderBottom:"1px solid rgba(255,140,66,0.15)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#FF8C42",fontWeight:600}}>{"\u26A0"} Trial: {trialInfo.days_left} days left (ends {trialInfo.trial_end})</span>
        <button onClick={function(){setTab("payment")}} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:"linear-gradient(135deg,#FF8C42,#FF3B5C)",color:"#fff"}}>Subscribe Now</button>
      </div>}

      {trialInfo && trialInfo.status === "expired" && <div style={{padding:"16px 20px",background:"rgba(255,59,92,0.1)",borderBottom:"1px solid rgba(255,59,92,0.2)",textAlign:"center"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#FF3B5C",marginBottom:4}}>{"\uD83D\uDED1"} Trial Expired — Payment Required</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:8}}>Your data is safe. Pay now to restore full access.</div>
        <button onClick={function(){setTab("payment")}} style={{padding:"10px 28px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#00F0FF,#A855F7)",color:"#06080D"}}>View Payment Options</button>
      </div>}

      {trialInfo && trialInfo.is_paid && <div style={{padding:"4px 20px",background:"rgba(0,255,148,0.05)",borderBottom:"1px solid rgba(0,255,148,0.1)",display:"flex",justifyContent:"center"}}>
        <span style={{fontSize:10,color:"#00FF94",fontWeight:600}}>{"\u2713"} {trialInfo.plan.toUpperCase()} Plan Active</span>
      </div>}

      <div style={{padding:"8px 20px",display:"flex",gap:4,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
        {[{id:"stats",l:"\uD83D\uDCCA Dashboard"},{id:"search",l:"\uD83D\uDD0D Search"},{id:"pipeline",l:"\uD83D\uDCCB Pipeline"},{id:"email",l:"\u2709\uFE0F AI Email"},{id:"earnings",l:"\uD83D\uDCB0 Earnings"},{id:"payment",l:"\uD83D\uDCB3 Payment"}].map(function(t){return(
          <button key={t.id} onClick={function(){setTab(t.id)}} style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:tab===t.id?"rgba(0,240,255,0.1)":"transparent",color:tab===t.id?"#00F0FF":"rgba(255,255,255,0.3)"}}>{t.l}</button>
        )})}
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          <button onClick={function(){api("/search/load-samples",{method:"POST"}).then(function(d){if(d.success){alert("10 sample leads loaded!"); loadData()}})}} style={{padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",fontSize:9,fontWeight:600,background:"rgba(0,255,148,0.1)",color:"#00FF94"}}>Load Samples</button>
          <a href={API_BASE+"/api/search/export-csv"} style={{padding:"4px 10px",borderRadius:5,fontSize:9,fontWeight:600,background:"rgba(168,85,247,0.1)",color:"#A855F7",textDecoration:"none",display:"flex",alignItems:"center"}}>Export CSV</a>
        </div>
      </div>

      <div style={{padding:20,maxWidth:1100,margin:"0 auto"}}>

        {/* ═══ STATS ═══ */}
        {tab==="stats"&&<div>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:14}}>Dashboard</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
            <StatCard label="Credits" value={stats.credits||0} color="#00F0FF" sub="Available to use"/>
            <StatCard label="Pipeline" value={"$"+(((stats.pipeline_value||0)/1000).toFixed(0))+"K"} color="#A855F7" sub={stats.total_deals+" deals"}/>
            <StatCard label="Won" value={stats.won||0} color="#00FF94" sub={stats.conversion||"0%"}/>
            <StatCard label="Hot Deals" value={stats.hot_deals||0} color="#FF8C42" sub="Proposal+Negotiation"/>
            <StatCard label="Leads Saved" value={stats.leads_saved||0} color="#00F0FF"/>
            <StatCard label="Plan" value={(stats.plan||"free").toUpperCase()} color="#A855F7"/>
          </div>

          {/* Mini pipeline */}
          <div style={{background:"rgba(255,255,255,0.015)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",padding:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Pipeline Overview</div>
            <div style={{display:"flex",gap:6}}>
              {["lead","qualified","proposal","negotiation","won","lost"].map(function(s){
                var d = pipeline[s]||{count:0,value:0};
                var total = Object.values(pipeline).reduce(function(sum,x){return sum+(x.count||0)},0)||1;
                var pct = Math.round((d.count/total)*100);
                return <div key={s} style={{flex:Math.max(1,pct/10),textAlign:"center"}}>
                  <div style={{height:32,borderRadius:6,background:SC[s]+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:SC[s]}}>{d.count}</div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.25)",marginTop:3,textTransform:"capitalize"}}>{s}</div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.15)",fontFamily:"monospace"}}>${(d.value/1000).toFixed(0)}K</div>
                </div>;
              })}
            </div>
          </div>
        </div>}

        {/* ═══ SEARCH ═══ */}
        {tab==="search"&&<div>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:12}}>Discover Leads</h2>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <select value={industry} onChange={function(e){setIndustry(e.target.value)}} style={inp}>
              <option value="">All Industries</option>
              <option value="saas">SaaS / Software</option>
              <option value="fintech">Fintech</option>
              <option value="ecommerce">E-Commerce</option>
            </select>
            <select value={country} onChange={function(e){setCountry(e.target.value)}} style={inp}>
              <option value="">All Countries</option>
              <option value="US">United States</option>
              <option value="IN">India</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="AE">UAE</option>
              <option value="SG">Singapore</option>
            </select>
            <button onClick={doSearch} disabled={loading} style={{padding:"10px 24px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#00F0FF,#A855F7)",color:"#06080D",opacity:loading?.5:1}}>
              {loading?"Searching...":"Find Leads"}
            </button>
          </div>

          {results&&results.data&&results.data.map(function(comp,ci){return(
            <div key={ci} style={{background:"rgba(255,255,255,0.015)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",padding:16,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700}}>{comp.company}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{comp.domain} \u00B7 {comp.city}, {comp.country} \u00B7 {comp.employees} emp \u00B7 {comp.revenue}</div>
                </div>
                <span style={{fontSize:9,padding:"3px 8px",borderRadius:10,background:comp.compliance.risk==="high"?"rgba(255,59,92,0.1)":"rgba(0,240,255,0.1)",color:comp.compliance.risk==="high"?"#FF3B5C":"#00F0FF",fontWeight:600}}>{comp.compliance.law}</span>
              </div>
              {comp.contacts.map(function(c,li){return(
                <div key={li} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:"1px solid rgba(255,255,255,0.04)",flexWrap:"wrap",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,fontWeight:600}}>{c.name}</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{c.title}</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.15)",fontFamily:"monospace"}}>{c.email_masked}</span>
                    <ScoreBadge score={c.lead_score}/>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={function(){unlock(comp.domain,c.name)}} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:600,background:"rgba(0,240,255,0.1)",color:"#00F0FF"}}>Unlock (1cr)</button>
                    <button onClick={function(){addPipeline(comp,c)}} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:600,background:"rgba(0,255,148,0.1)",color:"#00FF94"}}>+ Pipeline</button>
                    <button onClick={function(){draftEmail(c.name,c.title,comp.company)}} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:600,background:"rgba(168,85,247,0.1)",color:"#A855F7"}}>AI Email</button>
                  </div>
                </div>
              )})}
            </div>
          )})}
        </div>}

        {/* ═══ PIPELINE ═══ */}
        {tab==="pipeline"&&<div>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:14}}>Deal Pipeline</h2>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {["lead","qualified","proposal","negotiation","won","lost"].map(function(s){
              var d=pipeline[s]||{count:0,value:0};
              return<div key={s} style={{flex:1,minWidth:90,background:"rgba(255,255,255,0.015)",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)",padding:10,textAlign:"center"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:SC[s],margin:"0 auto 4px"}}></div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"capitalize"}}>{s}</div>
                <div style={{fontSize:16,fontWeight:800}}>{d.count}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.15)",fontFamily:"monospace"}}>${(d.value/1000).toFixed(0)}K</div>
              </div>
            })}
          </div>
          {deals.map(function(deal){return(
            <div key={deal.id} style={{background:"rgba(255,255,255,0.015)",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)",padding:12,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{deal.title}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{deal.country} \u00B7 ${(deal.value/1000).toFixed(0)}K \u00B7 <span style={{color:deal.compliance_status==="action_needed"?"#FF8C42":"#00FF94"}}>{deal.compliance_status}</span></div>
              </div>
              <div style={{display:"flex",gap:3}}>
                {["lead","qualified","proposal","negotiation","won"].filter(function(s){return s!==deal.stage}).slice(0,3).map(function(s){return(
                  <button key={s} onClick={function(){moveDeal(deal.id,s)}} style={{padding:"3px 8px",borderRadius:4,border:"none",cursor:"pointer",fontSize:8,fontWeight:600,background:SC[s]+"15",color:SC[s],textTransform:"capitalize"}}>{s}</button>
                )})}
              </div>
            </div>
          )})}
          {deals.length===0&&<div style={{textAlign:"center",padding:32,color:"rgba(255,255,255,0.2)",fontSize:13}}>No deals yet. Search and add leads to pipeline.</div>}
        </div>}

        {/* ═══ EMAIL ═══ */}
        {tab==="email"&&<div>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:12}}>AI Email</h2>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[{v:"en",l:"English"},{v:"ja",l:"Japanese"},{v:"de",l:"German"},{v:"hi",l:"Hindi"}].map(function(l){return(
              <button key={l.v} onClick={function(){setEmailLang(l.v)}} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,background:emailLang===l.v?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.03)",color:emailLang===l.v?"#A855F7":"rgba(255,255,255,0.3)"}}>{l.l}</button>
            )})}
          </div>
          {emailDraft&&<div style={{background:"rgba(255,255,255,0.015)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",padding:20}}>
            <input value={emailTo} onChange={function(e){setEmailTo(e.target.value)}} placeholder="Recipient email" style={{...inp,width:"100%",marginBottom:8}}/>
            <input value={emailSubject} onChange={function(e){setEmailSubject(e.target.value)}} placeholder="Subject" style={{...inp,width:"100%",marginBottom:8}}/>
            <textarea value={emailDraft} onChange={function(e){setEmailDraft(e.target.value)}} style={{...inp,width:"100%",minHeight:150,resize:"vertical",lineHeight:1.6}}/>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={sendEmail} style={{padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:"linear-gradient(135deg,#00F0FF,#A855F7)",color:"#06080D"}}>Send Email</button>
              <button onClick={function(){navigator.clipboard.writeText(emailDraft)}} style={{padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#fff"}}>Copy</button>
            </div>
          </div>}
          {!emailDraft&&!emailLoading&&<div style={{color:"rgba(255,255,255,0.3)",fontSize:13,padding:20,textAlign:"center"}}>Click "AI Email" on any lead in Search tab to draft an outreach email.</div>}
          {emailLoading&&<div style={{color:"#A855F7",fontSize:13,padding:20,textAlign:"center"}}>Drafting with AI...</div>}
        </div>}

        {/* ═══ EARNINGS ═══ */}
        {tab==="earnings"&&<EarningsView/>}

        {/* ═══ PAYMENT ═══ */}
        {tab==="payment"&&<PaymentView/>}
      </div>
    </div>
  );
}

function EarningsView(){
  var [data,setData]=useState(null);
  useEffect(function(){
    apiFetch("/search/earnings").then(function(d){setData(d)});
  },[]);
  if(!data) return <div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,0.3)"}}>Loading earnings...</div>;
  return <div>
    <h2 style={{fontSize:18,fontWeight:800,marginBottom:14}}>{"\uD83D\uDCB0"} Earnings (\u20B9 INR)</h2>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
      <div style={{background:"rgba(255,215,0,0.06)",borderRadius:12,border:"1px solid rgba(255,215,0,0.15)",padding:16,textAlign:"center"}}>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>TOTAL POTENTIAL</div>
        <div style={{fontSize:24,fontWeight:800,color:"#FFD700"}}>{data.total_potential_formatted||"\u20B90"}</div>
      </div>
      <div style={{background:"rgba(0,240,255,0.06)",borderRadius:12,border:"1px solid rgba(0,240,255,0.15)",padding:16,textAlign:"center"}}>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>MONTHLY</div>
        <div style={{fontSize:24,fontWeight:800,color:"#00F0FF"}}>{data.monthly_projection||"\u20B90"}</div>
      </div>
      <div style={{background:"rgba(0,255,148,0.06)",borderRadius:12,border:"1px solid rgba(0,255,148,0.15)",padding:16,textAlign:"center"}}>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>YEARLY</div>
        <div style={{fontSize:24,fontWeight:800,color:"#00FF94"}}>{data.yearly_projection||"\u20B90"}</div>
      </div>
    </div>
    {data.by_country&&<div style={{background:"rgba(255,255,255,0.015)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",padding:14,marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>By Country</div>
      {Object.entries(data.by_country).map(function(e){return <div key={e[0]} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11,borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{color:"rgba(255,255,255,0.4)"}}>{e[0]}</span><span style={{color:"#FFD700",fontWeight:700,fontFamily:"monospace"}}>{e[1]}</span></div>})}
    </div>}
    {data.leads&&data.leads.length>0&&<div style={{background:"rgba(255,255,255,0.015)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",padding:14}}>
      <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>Lead Values</div>
      {data.leads.map(function(l,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:10,borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{color:"rgba(255,255,255,0.4)"}}>{l.company} \u2022 {l.contact} ({l.country})</span><span style={{color:"#00FF94",fontWeight:700,fontFamily:"monospace"}}>{"\u20B9"}{(l.potential_inr||0).toLocaleString()}</span></div>})}
    </div>}
    <div style={{marginTop:14,padding:12,background:"rgba(255,215,0,0.04)",borderRadius:10,border:"1px solid rgba(255,215,0,0.08)",fontSize:10,color:"rgba(255,255,255,0.35)",lineHeight:1.7}}>
      <span style={{fontWeight:700,color:"#FFD700"}}>How to earn:</span> USA/UK/Germany leads = \u20B940K-67K each. India = \u20B925K. Sell on Upwork/LinkedIn or close deals yourself.
    </div>
  </div>;
}

function PaymentView(){
  var [plans,setPlans]=useState(null);
  var [methods,setMethods]=useState(null);
  useEffect(function(){
    apiFetch("/payment/plans").then(function(d){if(d.success)setPlans(d.plans)});
    apiFetch("/payment/methods").then(function(d){if(d.success)setMethods(d.methods)});
  },[]);

  return <div>
    <h2 style={{fontSize:18,fontWeight:800,marginBottom:4}}>Subscribe to Nanoneuron CRM</h2>
    <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:16}}>Choose a plan. Transfer payment. Email receipt to billing@nanoneuron.ai. Access within 24 hours.</p>

    {plans&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:20}}>
      {plans.map(function(p){return <div key={p.id} style={{background:"rgba(255,255,255,0.015)",borderRadius:14,border:p.id==="pro"?"1px solid rgba(168,85,247,0.3)":"1px solid rgba(255,255,255,0.05)",padding:24}}>
        <div style={{fontSize:14,fontWeight:700,color:p.id==="starter"?"#00F0FF":p.id==="pro"?"#A855F7":"#00FF94"}}>{p.name}</div>
        <div style={{fontSize:28,fontWeight:800,marginTop:4}}>${p.price_usd}<span style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>/mo</span></div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginBottom:12}}>{"\u20B9"}{p.price_inr.toLocaleString()}/month</div>
        {p.features.map(function(f){return <div key={f} style={{fontSize:11,color:"rgba(255,255,255,0.4)",padding:"2px 0"}}><span style={{color:"#00FF94",marginRight:6}}>{"\u2713"}</span>{f}</div>})}
      </div>})}
    </div>}

    <h3 style={{fontSize:15,fontWeight:700,marginBottom:10}}>Payment Methods</h3>
    {methods&&methods.map(function(m){return <div key={m.id} style={{background:"rgba(255,255,255,0.015)",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)",padding:14,marginBottom:8}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{m.name}</div>
      {typeof m.details === "object" ? Object.entries(m.details).map(function(e){return <div key={e[0]} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:10,borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
        <span style={{color:"rgba(255,255,255,0.3)",textTransform:"capitalize"}}>{e[0].replace(/_/g," ")}</span>
        <span style={{color:"#00F0FF",fontFamily:"monospace",fontWeight:600}}>{e[1]}</span>
      </div>}) : <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{m.details}</div>}
    </div>})}

    <div style={{marginTop:16,padding:14,background:"rgba(0,240,255,0.04)",borderRadius:10,border:"1px solid rgba(0,240,255,0.1)"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#00F0FF",marginBottom:4}}>After Payment:</div>
      <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>
        1. Transfer to any method above{"\n"}
        2. Email payment receipt to billing@nanoneuron.ai{"\n"}
        3. Include your registered email in the subject{"\n"}
        4. Access restored within 24 hours{"\n"}
        5. Your data is safe during the wait
      </div>
    </div>
  </div>;
}
