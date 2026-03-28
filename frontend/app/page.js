"use client";
import Link from "next/link";

var T = {
  bg:"#07090F", surface:"#0F1120", sidebar:"#0B0D17",
  border:"rgba(255,255,255,0.06)", borderStrong:"rgba(255,255,255,0.1)",
  blue:"#4F8EF7", teal:"#00D4AA", purple:"#A855F7", green:"#00D97E",
  red:"#FF3B5C", orange:"#FF8C42",
  text:"#E2E8F0", muted:"rgba(226,232,240,0.5)", faint:"rgba(226,232,240,0.2)",
};

var STATS = [
  {n:"200+",l:"Verified Contacts"},
  {n:"10",l:"Industries"},
  {n:"15",l:"Countries"},
  {n:"6",l:"Compliance Laws"},
];

var FEATURES = [
  {icon:"🔍", title:"B2B Lead Intelligence",
   desc:"Search 200+ verified contacts across SaaS, Fintech, Healthcare, Legal, Manufacturing, Logistics, Cybersecurity and more."},
  {icon:"🤖", title:"AI-Powered Outreach",
   desc:"Claude AI drafts personalized outreach emails in English, Japanese, German, and Hindi — tailored to every contact."},
  {icon:"📊", title:"Lead Scoring Engine",
   desc:"Every contact scored 0–100. CEOs and CXOs score highest. Focus your credits on HOT leads, skip cold ones."},
  {icon:"🛡️", title:"Auto Compliance",
   desc:"GDPR, UK GDPR, CCPA, DPDPA, LGPD, APPI — compliance status checked and displayed automatically per country."},
  {icon:"📋", title:"Deal Pipeline",
   desc:"6-stage pipeline: Lead → Qualified → Proposal → Negotiation → Won → Lost. Track every deal from first touch to close."},
  {icon:"👥", title:"Contact Book",
   desc:"Every unlocked contact saved automatically. Search, filter, update status, track last contacted date."},
  {icon:"💰", title:"Credit System",
   desc:"7-day free trial with 10 credits. 1 credit unlocks a full verified email + phone. Pay only for what you use."},
  {icon:"🌏", title:"Global Coverage",
   desc:"US, India, UK, Germany, Australia, Canada, France, Singapore, UAE, Japan, Brazil, Israel and more."},
  {icon:"📤", title:"CSV Export",
   desc:"Export your entire contact book with one click — ready for CRM import, email campaigns, or resale."},
];

var PLANS = [
  {id:"starter",name:"Starter",usd:49,inr:4067,credits:100,users:1,color:T.blue,
   features:["100 lead unlocks/month","Deal pipeline","AI email drafting","Auto compliance","1 user"]},
  {id:"pro",name:"Pro",usd:199,inr:16517,credits:500,users:5,color:T.purple,pop:true,
   features:["500 lead unlocks/month","Unlimited deals","All languages","Priority support","5 users","CSV export"]},
  {id:"business",name:"Business",usd:499,inr:41417,credits:2500,users:999,color:T.green,
   features:["2,500 lead unlocks/month","Unlimited everything","API access","Team features","Dedicated support"]},
];

export default function Home() {
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* ── Nav ── */}
      <nav style={{position:"sticky",top:0,zIndex:50,height:60,borderBottom:"1px solid "+T.border,
        background:T.sidebar+"EE",backdropFilter:"blur(12px)",
        display:"flex",alignItems:"center",padding:"0 32px",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,
            background:`linear-gradient(135deg,${T.blue},${T.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,fontWeight:900,color:"#07090F"}}>N</div>
          <div>
            <span style={{fontSize:15,fontWeight:800,letterSpacing:-0.3}}>Nanoneuron</span>
            <span style={{fontSize:10,color:T.muted,marginLeft:8}}>B2B Intelligence</span>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:28}}>
          {["Features","Pricing","Compliance"].map(function(l){
            return <a key={l} href={"#"+l.toLowerCase()} style={{fontSize:13,color:T.muted,textDecoration:"none",
              fontWeight:500}}>{l}</a>;
          })}
        </div>

        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <Link href="/login" style={{fontSize:13,color:T.muted,textDecoration:"none",padding:"7px 14px",fontWeight:500}}>
            Sign In
          </Link>
          <Link href="/login" style={{padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:700,
            textDecoration:"none",background:`linear-gradient(135deg,${T.blue},${T.purple})`,color:"#07090F"}}>
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{padding:"80px 32px 72px",maxWidth:1000,margin:"0 auto",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",
          borderRadius:20,border:"1px solid "+T.blue+"30",background:T.blue+"10",
          fontSize:11,color:T.blue,fontWeight:600,marginBottom:28}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:T.blue,animation:"pulse 2s infinite"}}/>
          7-day free trial · No credit card required
        </div>

        <h1 style={{fontSize:"clamp(32px,5.5vw,54px)",fontWeight:800,lineHeight:1.1,
          letterSpacing:-1,marginBottom:20}}>
          The B2B Intelligence Platform<br/>
          <span style={{background:`linear-gradient(135deg,${T.blue},${T.purple})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Built for Global Sales Teams
          </span>
        </h1>

        <p style={{fontSize:17,color:T.muted,maxWidth:560,margin:"0 auto 36px",lineHeight:1.7}}>
          Discover verified decision-makers in 15 countries. AI-powered outreach. Auto-compliance
          for GDPR, CCPA, LGPD & more. Start closing international deals today.
        </p>

        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:52}}>
          <Link href="/login" style={{padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:700,
            textDecoration:"none",background:`linear-gradient(135deg,${T.blue},${T.purple})`,color:"#07090F"}}>
            Start 7-Day Free Trial →
          </Link>
          <Link href="/login" style={{padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:600,
            textDecoration:"none",background:T.surface,color:T.text,
            border:"1px solid "+T.border}}>
            View Live Demo
          </Link>
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:0,justifyContent:"center",borderRadius:14,
          border:"1px solid "+T.border,background:T.surface,overflow:"hidden",
          maxWidth:600,margin:"0 auto"}}>
          {STATS.map(function(s,i){
            return (
              <div key={s.n} style={{flex:1,padding:"20px 16px",textAlign:"center",
                borderRight: i<STATS.length-1 ? "1px solid "+T.border : "none"}}>
                <div style={{fontSize:26,fontWeight:800,color:T.blue,letterSpacing:-0.5}}>{s.n}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:3,fontWeight:500}}>{s.l}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Product Preview (ZoomInfo-like table mock) ── */}
      <section style={{padding:"0 32px 72px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{borderRadius:14,border:"1px solid "+T.border,overflow:"hidden",background:T.surface}}>
          {/* Mock header bar */}
          <div style={{background:T.sidebar,padding:"10px 16px",borderBottom:"1px solid "+T.border,
            display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#FF3B5C"}}/>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#FF8C42"}}/>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#00D97E"}}/>
            <span style={{fontSize:10,color:T.muted,marginLeft:8}}>nanoneuron.ai/dashboard</span>
          </div>
          {/* Mock table */}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:T.bg}}>
                  {["Company","Contact","Title","Score","Email","Country","Compliance"].map(function(h){
                    return <th key={h} style={{padding:"10px 14px",fontSize:10,fontWeight:700,
                      color:T.muted,textTransform:"uppercase",letterSpacing:0.8,
                      textAlign:"left",borderBottom:"1px solid "+T.border,whiteSpace:"nowrap"}}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  {co:"TechFlow Inc",cc:"US",name:"Sarah Chen",title:"CTO",score:89,email:"s****@techflow.io",law:"CCPA",risk:"medium"},
                  {co:"NexGen Solutions",cc:"IN",name:"Amit Gupta",title:"CEO",score:92,email:"a***@nexgensol.in",law:"DPDPA",risk:"medium"},
                  {co:"BrightWave Software",cc:"GB",name:"Oliver Hughes",title:"CEO",score:90,email:"o*****@brightwave.co.uk",law:"UK GDPR",risk:"high"},
                  {co:"TechHaus GmbH",cc:"DE",name:"Felix Mueller",title:"CEO",score:87,email:"f***@techhaus.de",law:"EU GDPR",risk:"high"},
                  {co:"PayNow Asia",cc:"SG",name:"Kenneth Ng",title:"CEO",score:88,email:"k******@paynowasia.sg",law:"PDPA",risk:"medium"},
                ].map(function(r,i){
                  var hot = r.score >= 75;
                  var scoreColor = hot ? T.red : T.orange;
                  var riskColor = r.risk==="high" ? T.red : T.teal;
                  return (
                    <tr key={i} style={{borderBottom:"1px solid "+T.border,
                      background: i%2===0 ? "transparent" : T.sidebar+"60"}}>
                      <td style={{padding:"11px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:26,height:26,borderRadius:"50%",
                            background:T.blue+"20",border:"1px solid "+T.blue+"30",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:10,fontWeight:700,color:T.blue}}>
                            {r.co[0]}
                          </div>
                          <span style={{fontSize:12,fontWeight:600}}>{r.co}</span>
                        </div>
                      </td>
                      <td style={{padding:"11px 14px",fontSize:12,fontWeight:500}}>{r.name}</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:T.muted}}>{r.title}</td>
                      <td style={{padding:"11px 14px"}}>
                        <span style={{padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,
                          background:scoreColor+"15",color:scoreColor}}>
                          ● {r.score} HOT
                        </span>
                      </td>
                      <td style={{padding:"11px 14px",fontSize:11,color:T.muted,fontFamily:"monospace"}}>{r.email}</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:T.muted}}>{r.cc}</td>
                      <td style={{padding:"11px 14px"}}>
                        <div style={{display:"flex",flexDirection:"column",gap:3}}>
                          <span style={{fontSize:9,color:T.muted}}>{r.law}</span>
                          <span style={{fontSize:8,padding:"1px 6px",borderRadius:4,display:"inline-block",
                            background:riskColor+"15",color:riskColor,fontWeight:600}}>
                            {r.risk.toUpperCase()} RISK
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:"10px 16px",borderTop:"1px solid "+T.border,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:T.muted}}>Showing 5 of 200+ contacts</span>
            <div style={{display:"flex",gap:8}}>
              <span style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,
                background:T.teal+"15",color:T.teal,cursor:"pointer"}}>Unlock Email</span>
              <span style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,
                background:T.blue+"15",color:T.blue,cursor:"pointer"}}>+ Pipeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{padding:"60px 32px",maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{fontSize:32,fontWeight:800,textAlign:"center",letterSpacing:-0.5,marginBottom:8}}>
          Everything You Need to Close International Deals
        </h2>
        <p style={{textAlign:"center",fontSize:14,color:T.muted,marginBottom:48}}>
          Built for B2B sales teams targeting global markets.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
          {FEATURES.map(function(f){
            return (
              <div key={f.title} style={{background:T.surface,borderRadius:12,
                border:"1px solid "+T.border,padding:22,
                transition:"border-color 0.2s"}}
                onMouseEnter={function(e){e.currentTarget.style.borderColor=T.blue+"40"}}
                onMouseLeave={function(e){e.currentTarget.style.borderColor=T.border}}>
                <div style={{fontSize:22,marginBottom:10}}>{f.icon}</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{f.title}</div>
                <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Compliance ── */}
      <section id="compliance" style={{padding:"60px 32px",background:T.surface,borderTop:"1px solid "+T.border,borderBottom:"1px solid "+T.border}}>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:28,fontWeight:800,marginBottom:8,letterSpacing:-0.3}}>
            Compliance Checked Automatically
          </h2>
          <p style={{fontSize:13,color:T.muted,marginBottom:32}}>
            We check the compliance requirements for every country before you reach out.
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            {[
              {law:"GDPR",cc:"EU",color:T.blue},{law:"UK GDPR",cc:"GB",color:T.purple},
              {law:"CCPA",cc:"US",color:T.teal},{law:"DPDPA 2023",cc:"IN",color:T.orange},
              {law:"LGPD",cc:"BR",color:T.red},{law:"APPI",cc:"JP",color:T.green},
              {law:"PDPA",cc:"SG",color:T.blue},{law:"PIPEDA",cc:"CA",color:T.purple},
              {law:"Privacy Act",cc:"AU",color:T.teal},{law:"DIFC-DP",cc:"AE",color:T.orange},
            ].map(function(c){
              return (
                <div key={c.law} style={{padding:"8px 16px",borderRadius:8,
                  background:c.color+"12",border:"1px solid "+c.color+"25",
                  fontSize:12,fontWeight:600,color:c.color}}>
                  {c.law} <span style={{fontSize:10,opacity:0.7}}>({c.cc})</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{padding:"72px 32px",maxWidth:960,margin:"0 auto"}}>
        <h2 style={{fontSize:32,fontWeight:800,textAlign:"center",letterSpacing:-0.5,marginBottom:6}}>
          Simple, Transparent Pricing
        </h2>
        <p style={{textAlign:"center",fontSize:13,color:T.muted,marginBottom:48}}>
          7-day free trial. Then choose the plan that fits your team.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
          {PLANS.map(function(p){
            return (
              <div key={p.id} style={{background:T.surface,borderRadius:16,
                border:"1px solid "+(p.pop?p.color+"40":T.border),padding:28,
                position:"relative",transform:p.pop?"scale(1.02)":"none"}}>
                {p.pop && (
                  <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",
                    padding:"3px 16px",borderRadius:20,fontSize:10,fontWeight:700,
                    background:p.color,color:"#07090F"}}>Most Popular</div>
                )}
                <div style={{fontSize:13,fontWeight:700,color:p.color,marginBottom:10}}>{p.name}</div>
                <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,marginBottom:2}}>
                  ${p.usd}<span style={{fontSize:13,color:T.muted,fontWeight:400}}>/month</span>
                </div>
                <div style={{fontSize:12,color:T.muted,marginBottom:20}}>₹{p.inr.toLocaleString()}/month</div>
                {p.features.map(function(f){
                  return (
                    <div key={f} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 0",fontSize:12,color:T.muted}}>
                      <span style={{color:T.green,fontSize:11,flexShrink:0}}>✓</span>{f}
                    </div>
                  );
                })}
                <Link href="/login" style={{display:"block",marginTop:20,padding:"12px",borderRadius:9,
                  textAlign:"center",fontSize:13,fontWeight:700,textDecoration:"none",
                  background:p.pop?`linear-gradient(135deg,${T.blue},${T.purple})`:"rgba(255,255,255,0.07)",
                  color:p.pop?"#07090F":T.text,border:p.pop?"none":"1px solid "+T.border}}>
                  Get Started →
                </Link>
              </div>
            );
          })}
        </div>
        <p style={{textAlign:"center",fontSize:11,color:T.faint,marginTop:24}}>
          Payment via SWIFT (USD/GBP/EUR) · NEFT/UPI (INR) · Direct to Axis Bank · billing@nanoneuron.ai
        </p>
      </section>

      {/* ── CTA ── */}
      <section style={{padding:"64px 32px",textAlign:"center",background:T.surface,
        borderTop:"1px solid "+T.border}}>
        <h2 style={{fontSize:30,fontWeight:800,marginBottom:12,letterSpacing:-0.5}}>
          Ready to Find Your Next Client?
        </h2>
        <p style={{fontSize:14,color:T.muted,marginBottom:28,maxWidth:400,margin:"0 auto 28px"}}>
          Join sales teams using Nanoneuron to discover and close international B2B deals.
        </p>
        <Link href="/login" style={{display:"inline-block",padding:"14px 36px",borderRadius:10,
          fontSize:15,fontWeight:700,textDecoration:"none",
          background:`linear-gradient(135deg,${T.blue},${T.purple})`,color:"#07090F"}}>
          Start Your Free Trial →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{padding:"24px 32px",borderTop:"1px solid "+T.border,
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,borderRadius:6,
            background:`linear-gradient(135deg,${T.blue},${T.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:12,fontWeight:900,color:"#07090F"}}>N</div>
          <span style={{fontSize:12,fontWeight:700}}>Nanoneuron</span>
          <span style={{fontSize:10,color:T.faint}}>· GST Registered Proprietorship · India · © 2026</span>
        </div>
        <div style={{display:"flex",gap:20}}>
          {["billing@nanoneuron.ai","support@nanoneuron.ai"].map(function(e){
            return <a key={e} href={"mailto:"+e} style={{fontSize:11,color:T.muted,textDecoration:"none"}}>{e}</a>;
          })}
        </div>
      </footer>
    </div>
  );
}
