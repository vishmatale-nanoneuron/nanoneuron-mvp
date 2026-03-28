"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{minHeight:"100vh",background:"#06080D",color:"#fff",fontFamily:"system-ui"}}>
      <nav style={{padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#00F0FF,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#06080D"}}>N</div>
          <span style={{fontSize:14,fontWeight:800}}>Nanoneuron</span>
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <a href="#features" style={{fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"none"}}>Features</a>
          <a href="#pricing" style={{fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"none"}}>Pricing</a>
          <Link href="/login" style={{fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"none"}}>Login</Link>
          <Link href="/login" style={{padding:"7px 16px",borderRadius:7,fontSize:12,fontWeight:700,textDecoration:"none",background:"linear-gradient(135deg,#00F0FF,#A855F7)",color:"#06080D"}}>Start Free</Link>
        </div>
      </nav>

      <section style={{padding:"80px 24px 60px",textAlign:"center",maxWidth:700,margin:"0 auto"}}>
        <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#00F0FF,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#06080D",margin:"0 auto 20px"}}>N</div>
        <h1 style={{fontSize:"clamp(30px,5vw,46px)",fontWeight:800,lineHeight:1.1}}>
          Find leads. Track deals.{" "}<span style={{background:"linear-gradient(135deg,#00F0FF,#A855F7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Stay compliant.</span>
        </h1>
        <p style={{fontSize:16,color:"rgba(255,255,255,0.4)",maxWidth:500,margin:"16px auto 28px",lineHeight:1.6}}>
          Discover verified contacts in 20+ countries. AI-powered emails. GDPR, CCPA, LGPD auto-checked. 7-day free trial. Then ₹4,067/month.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <Link href="/login" style={{padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none",background:"linear-gradient(135deg,#00F0FF,#A855F7)",color:"#06080D"}}>Start 7-Day Free Trial</Link>
          <Link href="/login" style={{padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:600,textDecoration:"none",background:"rgba(255,255,255,0.06)",color:"#fff",border:"1px solid rgba(255,255,255,0.08)"}}>Watch Demo</Link>
        </div>
        <div style={{display:"flex",gap:24,justifyContent:"center",marginTop:48,flexWrap:"wrap"}}>
          {[{n:"1. Search",d:"Industry + Country",i:"\uD83D\uDD0D"},{n:"2. Discover",d:"Masked emails",i:"\uD83D\uDC64"},{n:"3. Unlock",d:"1 credit = verified",i:"\uD83D\uDD13"},{n:"4. AI Email",d:"Any language",i:"\uD83E\uDD16"},{n:"5. Close",d:"Track pipeline",i:"\uD83D\uDCCA"}].map(function(s){return(
            <div key={s.n} style={{textAlign:"center",width:110}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.i}</div>
              <div style={{fontSize:12,fontWeight:700}}>{s.n}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{s.d}</div>
            </div>
          )})}
        </div>
      </section>

      <section id="features" style={{padding:"60px 24px",maxWidth:900,margin:"0 auto"}}>
        <h2 style={{fontSize:26,fontWeight:800,textAlign:"center",marginBottom:28}}>Why Sales Teams Choose Nanoneuron</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:12}}>
          {[
            {i:"\uD83D\uDD0D",t:"Lead Discovery",d:"Search 20+ countries, 10 industries. Verified emails at target companies."},
            {i:"\uD83E\uDD16",t:"AI Email Drafting",d:"Claude AI writes personalized outreach in English, Japanese, German, Hindi."},
            {i:"\uD83D\uDCCA",t:"AI Lead Scoring",d:"Every lead scored 0-100. Focus on hot leads. Skip cold ones."},
            {i:"\uD83D\uDCCB",t:"Deal Pipeline",d:"Lead \u2192 Qualified \u2192 Proposal \u2192 Negotiation \u2192 Won. Track everything."},
            {i:"\uD83D\uDEE1\uFE0F",t:"Auto Compliance",d:"GDPR, CCPA, LGPD, DPDPA checked automatically per country."},
            {i:"\u2709\uFE0F",t:"Send Emails",d:"Outreach directly from CRM. Track opens. Never leave the dashboard."},
            {i:"\uD83C\uDF0D",t:"20+ Countries",d:"US, India, UK, Germany, UAE, Singapore, Japan, Brazil, and more."},
            {i:"\uD83D\uDD10",t:"Credit System",d:"7-day free trial. Then choose your plan. 7-day free trial with 10 credits."},
            {i:"\u26A1",t:"Fast & Simple",d:"3 screens: Search, Pipeline, Email. That's it. That's enough."},
          ].map(function(f){return(
            <div key={f.t} style={{background:"rgba(255,255,255,0.012)",borderRadius:12,border:"1px solid rgba(255,255,255,0.04)",padding:20}}>
              <div style={{fontSize:20,marginBottom:6}}>{f.i}</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{f.t}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.6}}>{f.d}</div>
            </div>
          )})}
        </div>
      </section>

      <section id="pricing" style={{padding:"60px 24px",maxWidth:800,margin:"0 auto"}}>
        <h2 style={{fontSize:26,fontWeight:800,textAlign:"center",marginBottom:6}}>Simple Pricing</h2>
        <p style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:28}}>7-day free trial. Then choose your plan.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
          {[
            {plan:"Starter",price:"$49/mo",sub:"\u20B94,067/mo",features:["100 credits/month","Deal pipeline","AI email","Compliance","1 user"],c:"#00F0FF",pop:false},
            {plan:"Pro",price:"$199/mo",sub:"\u20B916,517/mo",features:["500 credits/month","Unlimited deals","All languages","Priority support","5 users"],c:"#A855F7",pop:true},
            {plan:"Business",price:"$499/mo",sub:"\u20B941,417/mo",features:["2,500 credits/month","Unlimited everything","API access","Team features","Dedicated support"],c:"#00FF94",pop:false},
          ].map(function(p){return(
            <div key={p.plan} style={{background:"rgba(255,255,255,0.012)",borderRadius:14,border:"1px solid "+(p.pop?p.c+"40":"rgba(255,255,255,0.04)"),padding:24,position:"relative"}}>
              {p.pop&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",padding:"2px 12px",borderRadius:12,fontSize:9,fontWeight:700,background:p.c+"20",color:p.c}}>Popular</div>}
              <div style={{fontSize:13,fontWeight:700,color:p.c}}>{p.plan}</div>
              <div style={{fontSize:30,fontWeight:800,marginTop:4}}>{p.price}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginBottom:14}}>{p.sub}</div>
              {p.features.map(function(f){return <div key={f} style={{fontSize:11,color:"rgba(255,255,255,0.4)",padding:"2px 0"}}><span style={{color:"#00FF94",marginRight:6}}>{"\u2713"}</span>{f}</div>})}
              <Link href="/login" style={{display:"block",marginTop:14,padding:"10px",borderRadius:8,textAlign:"center",fontSize:12,fontWeight:700,textDecoration:"none",background:p.pop?"linear-gradient(135deg,#00F0FF,#A855F7)":"rgba(255,255,255,0.06)",color:p.pop?"#06080D":"#fff"}}>Get Started</Link>
            </div>
          )})}
        </div>
        <p style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.12)",marginTop:16}}>{"\uD83C\uDFE6 SWIFT (USD/GBP/EUR) \u2022 NEFT/UPI (INR) \u2022 Direct to Axis Bank"}</p>
      </section>

      <section style={{padding:"24px",display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        {["\uD83C\uDDEA\uD83C\uDDFA GDPR","\uD83C\uDDFA\uD83C\uDDF8 CCPA","\uD83C\uDDE7\uD83C\uDDF7 LGPD","\uD83C\uDDEE\uD83C\uDDF3 DPDPA","\uD83C\uDDEF\uD83C\uDDF5 APPI","\uD83C\uDDF8\uD83C\uDDEC PDPA"].map(function(l){return <span key={l} style={{fontSize:9,color:"rgba(255,255,255,0.15)",fontWeight:600,padding:"3px 8px",borderRadius:16,border:"1px solid rgba(255,255,255,0.05)"}}>{l}</span>})}
      </section>

      <section style={{padding:"40px 24px",textAlign:"center"}}>
        <h2 style={{fontSize:22,fontWeight:800,marginBottom:10}}>Stop Guessing. Start Closing.</h2>
        <Link href="/login" style={{display:"inline-block",padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:700,textDecoration:"none",background:"linear-gradient(135deg,#00F0FF,#A855F7)",color:"#06080D"}}>Start 7-Day Free Trial</Link>
      </section>

      <footer style={{padding:"20px",borderTop:"1px solid rgba(255,255,255,0.04)",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700}}>Nanoneuron Services</div>
        <div style={{fontSize:8,color:"rgba(255,255,255,0.1)",marginTop:3}}>Proprietorship \u2022 GST Registered \u2022 India \u2022 nanoneuron.ai \u2022 \u00A9 2026</div>
      </footer>
    </div>
  );
}
