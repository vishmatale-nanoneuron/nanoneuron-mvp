"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../lib/api";

const inp = {width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"12px 14px",color:"#fff",fontSize:13,marginBottom:10};
const btn = {width:"100%",padding:"13px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#00F0FF,#A855F7)",color:"#06080D"};

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      var endpoint = API_BASE + (isRegister ? "/api/auth/register" : "/api/auth/login");
      var body = isRegister
        ? { name: name, email: email, password: password, company_name: company }
        : { email: email, password: password };

      var res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      var data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.detail || "Login failed");
      }
    } catch (err) {
      setError("Server error. Is the backend running?");
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#00F0FF,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#06080D",margin:"0 auto 12px"}}>N</div>
          <h1 style={{fontSize:22,fontWeight:800}}>Nanoneuron CRM</h1>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:4}}>Find leads. Track deals. Stay compliant.</p>
        </div>

        <form onSubmit={handleSubmit} style={{borderRadius:16,padding:28,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)"}}>
          <h2 style={{fontSize:16,fontWeight:700,marginBottom:16}}>{isRegister ? "Create Account" : "Sign In"}</h2>

          {isRegister && <input value={name} onChange={function(e){setName(e.target.value)}} placeholder="Your Name" required style={inp}/>}
          {isRegister && <input value={company} onChange={function(e){setCompany(e.target.value)}} placeholder="Company Name" style={inp}/>}
          <input value={email} onChange={function(e){setEmail(e.target.value)}} placeholder="Email" type="email" required style={inp}/>
          <input value={password} onChange={function(e){setPassword(e.target.value)}} placeholder="Password" type="password" required style={inp}/>

          {error && <div style={{color:"#FF3B5C",fontSize:12,marginBottom:10}}>{error}</div>}

          <button type="submit" disabled={loading} style={{...btn,opacity:loading?0.5:1}}>
            {loading ? "Please wait..." : isRegister ? "Start 7-Day Free Trial" : "Sign In"}
          </button>

          <div onClick={function(){setIsRegister(!isRegister);setError("")}} style={{textAlign:"center",marginTop:14,fontSize:12,color:"#00F0FF",cursor:"pointer"}}>
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register free"}
          </div>
        </form>
      </div>
    </div>
  );
}
