"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../lib/api";

var T = {
  bg:"#050710", sidebar:"#080A18", surface:"#0C0F1E", surface2:"#101425",
  border:"rgba(255,255,255,0.06)", borderBright:"rgba(255,255,255,0.12)",
  blue:"#4F8EF7", teal:"#00D4AA", purple:"#A855F7", green:"#00D97E",
  red:"#FF3B5C", orange:"#FF8C42", gold:"#F59E0B",
  text:"#E2E8F0", muted:"rgba(226,232,240,0.5)", faint:"rgba(226,232,240,0.2)",
};

var PLAN_COLORS = {trial:T.blue,starter:T.teal,pro:T.purple,business:T.gold,blocked:T.red};
var PLAN_ICONS  = {trial:"🔬",starter:"🚀",pro:"⭐",business:"💎",blocked:"🔒"};

// ─── Secret is stored in localStorage so you don't type it every session ─────
function getSecret() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem("f_secret") || "";
}
function setSecret(s) {
  if (typeof localStorage !== "undefined") localStorage.setItem("f_secret", s);
}

export default function FounderDashboard() {
  var [authed, setAuthed]   = useState(false);
  var [checking, setChecking] = useState(true);
  var [secretInput, setSecretInput] = useState("");
  var [loginErr, setLoginErr] = useState("");
  var [stats, setStats]     = useState(null);
  var [users, setUsers]     = useState([]);
  var [activity, setActivity] = useState(null);
  var [tab, setTab]         = useState("overview");
  var [userFilter, setUserFilter] = useState("");
  var [planFilter, setPlanFilter] = useState("");
  var [loading, setLoading] = useState(false);
  var [msg, setMsg]         = useState("");
  var [editing, setEditing] = useState(null);   // user being edited
  var [editCredits, setEditCredits] = useState(0);
  var [editPlan, setEditPlan] = useState("");

  // ── Auth check on mount ────────────────────────────────────────────────────
  useEffect(function() {
    var token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { setChecking(false); return; }
    apiFetch("/founder/stats", {headers:{"x-founder-secret": getSecret()}})
      .then(function(r) {
        if (r.success) { setStats(r); setAuthed(true); }
        setChecking(false);
      })
      .catch(function() { setChecking(false); });
  }, []);

  // ── Verify secret + token ──────────────────────────────────────────────────
  async function tryLogin() {
    setLoginErr("");
    var token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { setLoginErr("Sign in to nanoneuron.ai first, then come back here."); return; }
    var r = await apiFetch("/founder/stats", {headers:{"x-founder-secret": secretInput}}).catch(()=>null);
    if (r && r.success) {
      setSecret(secretInput);
      setStats(r);
      setAuthed(true);
    } else {
      setLoginErr("Access denied.");
    }
  }

  // ── Data loaders ──────────────────────────────────────────────────────────
  var loadUsers = useCallback(async function() {
    setLoading(true);
    var params = new URLSearchParams();
    if (planFilter) params.set("plan", planFilter);
    if (userFilter) params.set("q", userFilter);
    params.set("limit", "200");
    var r = await apiFetch("/founder/users?" + params.toString(),
      {headers:{"x-founder-secret": getSecret()}}).catch(()=>({}));
    setUsers(r.users || []);
    setLoading(false);
  }, [planFilter, userFilter]);

  var loadActivity = useCallback(async function() {
    var r = await apiFetch("/founder/activity",
      {headers:{"x-founder-secret": getSecret()}}).catch(()=>({}));
    setActivity(r);
  }, []);

  useEffect(function() {
    if (!authed) return;
    if (tab === "users") loadUsers();
    if (tab === "activity") loadActivity();
  }, [authed, tab, loadUsers, loadActivity]);

  // ── User actions ──────────────────────────────────────────────────────────
  async function patchUser(userId, body) {
    var r = await apiFetch("/founder/users/" + userId,
      {method:"PATCH", body:JSON.stringify(body),
       headers:{"x-founder-secret": getSecret()}}).catch(()=>({}));
    if (r.success) { flash("✅ Updated"); loadUsers(); } else flash("❌ Error");
  }

  async function activateUser(userId, plan, credits) {
    var r = await apiFetch("/founder/activate/" + userId + "?plan=" + plan + "&credits=" + credits,
      {method:"POST", headers:{"x-founder-secret": getSecret()}}).catch(()=>({}));
    if (r.success) { flash("✅ Activated: " + r.email + " → " + plan + " / " + credits + " credits"); loadUsers(); }
    else flash("❌ Error");
  }

  async function blockUser(userId, email) {
    if (!confirm("Block " + email + "?")) return;
    var r = await apiFetch("/founder/block/" + userId + "?reason=Payment%20not%20received",
      {method:"POST", headers:{"x-founder-secret": getSecret()}}).catch(()=>({}));
    if (r.success) { flash("🔒 Blocked: " + email); loadUsers(); } else flash("❌ Error");
  }

  async function deleteUser(userId, email) {
    if (!confirm("DELETE " + email + " permanently?")) return;
    var r = await apiFetch("/founder/users/" + userId,
      {method:"DELETE", headers:{"x-founder-secret": getSecret()}}).catch(()=>({}));
    if (r.success) { flash("🗑️ Deleted: " + email); loadUsers(); } else flash("❌ Error");
  }

  function flash(m) {
    setMsg(m);
    setTimeout(function() { setMsg(""); }, 4000);
  }

  // ── GATE: login screen ────────────────────────────────────────────────────
  if (checking) {
    return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",
      justifyContent:"center",color:T.muted,fontSize:14}}>Checking access…</div>;
  }

  if (!authed) {
    return (
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",
        justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{width:360,background:T.surface,border:"1px solid "+T.border,borderRadius:16,
          padding:36,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>🔐</div>
          <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:6}}>Founder Access</div>
          <div style={{fontSize:13,color:T.muted,marginBottom:28}}>This page is private.</div>
          <input
            type="password"
            value={secretInput}
            onChange={function(e){setSecretInput(e.target.value)}}
            onKeyDown={function(e){if(e.key==="Enter") tryLogin();}}
            placeholder="Enter founder secret"
            autoFocus
            style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.04)",
              border:"1px solid "+T.border,borderRadius:8,padding:"10px 14px",
              color:T.text,fontSize:14,outline:"none",marginBottom:12}}
          />
          {loginErr && <div style={{fontSize:12,color:T.red,marginBottom:10}}>{loginErr}</div>}
          <button onClick={tryLogin} style={{width:"100%",padding:"11px",borderRadius:8,
            border:"none",cursor:"pointer",background:T.blue,color:"#fff",
            fontSize:14,fontWeight:700}}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN DASHBOARD ────────────────────────────────────────────────────────
  var ov = stats?.overview || {};
  var rv = stats?.revenue  || {};
  var pr = stats?.product  || {};

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* Header */}
      <header style={{height:54,background:T.sidebar,borderBottom:"1px solid "+T.border,
        display:"flex",alignItems:"center",padding:"0 24px",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,
            background:"linear-gradient(135deg,"+T.gold+","+T.orange+")",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👑</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,letterSpacing:-0.3}}>Founder Dashboard</div>
            <div style={{fontSize:10,color:T.muted}}>nanoneuron.ai — private</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {msg && <div style={{fontSize:12,padding:"5px 12px",borderRadius:20,
            background:"rgba(0,217,126,0.15)",color:T.green,border:"1px solid "+T.green+"30"}}>{msg}</div>}
          {["overview","users","activity"].map(function(t){
            return <button key={t} onClick={function(){setTab(t)}} style={{
              padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background: tab===t ? T.blue : "rgba(255,255,255,0.06)",
              color: tab===t ? "#fff" : T.muted,textTransform:"capitalize"
            }}>{t}</button>;
          })}
          <button onClick={function(){setStats(null);setAuthed(false);setMsg("");}}
            style={{padding:"6px 12px",borderRadius:7,border:"1px solid "+T.border,background:"none",
              cursor:"pointer",fontSize:12,color:T.muted}}>Sign Out</button>
        </div>
      </header>

      <div style={{padding:24,maxWidth:1300,margin:"0 auto"}}>

        {/* ── OVERVIEW ───────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            {/* KPI row 1 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:16}}>
              {[
                {label:"Total Users",     value:ov.total_users||0,        icon:"👤", color:T.blue},
                {label:"Paid Users",      value:ov.paid_users||0,         icon:"💰", color:T.gold},
                {label:"Active Trials",   value:ov.active_trials||0,      icon:"🔬", color:T.teal},
                {label:"Blocked",         value:ov.blocked_users||0,      icon:"🔒", color:T.red},
                {label:"Signups Today",   value:ov.signups_today||0,      icon:"📈", color:T.green},
                {label:"Signups 7d",      value:ov.signups_week||0,       icon:"📅", color:T.purple},
              ].map(function(k){
                return (
                  <div key={k.label} style={{background:T.surface,border:"1px solid "+T.border,
                    borderRadius:12,padding:"16px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:18}}>{k.icon}</span>
                      <span style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{k.label}</span>
                    </div>
                    <div style={{fontSize:28,fontWeight:900,color:k.color,letterSpacing:-1}}>{k.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Revenue + Product row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              {/* Revenue */}
              <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:20}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:16}}>💰 Revenue</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  <div style={{background:"rgba(245,158,11,0.08)",borderRadius:8,padding:12,border:"1px solid rgba(245,158,11,0.15)"}}>
                    <div style={{fontSize:10,color:T.muted,marginBottom:4}}>USD RECEIVED</div>
                    <div style={{fontSize:24,fontWeight:800,color:T.gold}}>${(rv.usd||0).toLocaleString()}</div>
                  </div>
                  <div style={{background:"rgba(0,212,170,0.08)",borderRadius:8,padding:12,border:"1px solid rgba(0,212,170,0.15)"}}>
                    <div style={{fontSize:10,color:T.muted,marginBottom:4}}>INR RECEIVED</div>
                    <div style={{fontSize:24,fontWeight:800,color:T.teal}}>₹{(rv.inr||0).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:10}}>Plan Distribution</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {Object.entries(rv.plan_distribution||{}).map(function([plan,count]){
                    var total = ov.total_users||1;
                    var pct = Math.round((count/total)*100);
                    return (
                      <div key={plan} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:12,width:24,textAlign:"center"}}>{PLAN_ICONS[plan]||"?"}</span>
                        <span style={{fontSize:11,color:T.muted,width:60,textTransform:"capitalize"}}>{plan}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:"rgba(255,255,255,0.06)"}}>
                          <div style={{height:"100%",borderRadius:3,width:pct+"%",
                            background:PLAN_COLORS[plan]||T.blue,transition:"width 0.5s"}}/>
                        </div>
                        <span style={{fontSize:11,color:PLAN_COLORS[plan]||T.blue,fontWeight:700,width:20,textAlign:"right"}}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product */}
              <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:20}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:16}}>📊 Product Usage</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {label:"Deals created",   value:pr.total_deals||0,           color:T.blue},
                    {label:"Deals won",        value:pr.won_deals||0,             color:T.green},
                    {label:"Pipeline ($)",     value:"$"+Math.round((pr.total_pipeline_usd||0)/1000)+"K", color:T.teal},
                    {label:"Won value ($)",    value:"$"+Math.round((pr.total_won_usd||0)/1000)+"K",      color:T.gold},
                    {label:"Contacts unlocked",value:pr.total_contacts_unlocked||0, color:T.purple},
                    {label:"Notes logged",     value:pr.total_notes||0,           color:T.orange},
                    {label:"Email templates",  value:pr.total_templates||0,       color:T.teal},
                    {label:"Credits in system",value:pr.credits_in_system||0,     color:T.muted},
                  ].map(function(s){
                    return (
                      <div key={s.label} style={{background:T.surface2,borderRadius:8,padding:"10px 12px",
                        border:"1px solid rgba(255,255,255,0.04)"}}>
                        <div style={{fontSize:10,color:T.muted,marginBottom:4}}>{s.label}</div>
                        <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Signups trend */}
            <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:16}}>📈 Signup Velocity</div>
              <div style={{display:"flex",gap:16,alignItems:"flex-end"}}>
                {[
                  {label:"Today",   value:ov.signups_today||0, color:T.green},
                  {label:"7 days",  value:ov.signups_week||0,  color:T.blue},
                  {label:"30 days", value:ov.signups_month||0, color:T.purple},
                  {label:"Total",   value:ov.total_users||0,   color:T.gold},
                ].map(function(s){
                  var maxVal = Math.max(ov.total_users||1, 1);
                  var pct = Math.max(8, Math.round((s.value/maxVal)*200));
                  return (
                    <div key={s.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      <div style={{fontSize:18,fontWeight:900,color:s.color}}>{s.value}</div>
                      <div style={{width:"100%",height:pct,borderRadius:"6px 6px 0 0",
                        background:s.color+"25",border:"1px solid "+s.color+"40"}}/>
                      <div style={{fontSize:10,color:T.muted}}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ──────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
              <input value={userFilter} onChange={function(e){setUserFilter(e.target.value)}}
                placeholder="Search email or name..."
                style={{flex:1,minWidth:200,maxWidth:300,background:T.surface,
                  border:"1px solid "+T.border,borderRadius:8,padding:"8px 12px",
                  color:T.text,fontSize:13,outline:"none"}}/>
              <select value={planFilter} onChange={function(e){setPlanFilter(e.target.value)}}
                style={{background:T.surface,border:"1px solid "+T.border,borderRadius:8,
                  padding:"8px 10px",color:T.text,fontSize:13,outline:"none"}}>
                <option value="">All Plans</option>
                {["trial","starter","pro","business","blocked"].map(function(p){
                  return <option key={p} value={p}>{p}</option>;
                })}
              </select>
              <button onClick={loadUsers} style={{padding:"8px 16px",borderRadius:8,border:"none",
                cursor:"pointer",background:T.blue,color:"#fff",fontSize:13,fontWeight:600}}>
                Search
              </button>
              <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{users.length} users</span>
            </div>

            {loading ? (
              <div style={{textAlign:"center",padding:40,color:T.muted}}>Loading users…</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {users.map(function(u){
                  var pc = PLAN_COLORS[u.plan]||T.muted;
                  var isEditing = editing === u.id;
                  return (
                    <div key={u.id} style={{background:T.surface,border:"1px solid "+T.border,
                      borderRadius:10,padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        {/* Identity */}
                        <div style={{flex:2,minWidth:200}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:16}}>{PLAN_ICONS[u.plan]||"👤"}</span>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:T.text}}>{u.name}</div>
                              <div style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{u.email}</div>
                              {u.company && <div style={{fontSize:10,color:T.faint}}>{u.company}</div>}
                            </div>
                          </div>
                        </div>

                        {/* Plan + credits */}
                        <div style={{display:"flex",gap:8,alignItems:"center",flex:1,minWidth:140}}>
                          <span style={{padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:700,
                            background:pc+"18",color:pc,border:"1px solid "+pc+"30",textTransform:"capitalize"}}>
                            {u.plan}
                          </span>
                          <span style={{fontSize:12,color:T.teal,fontWeight:600}}>{u.credits} cr</span>
                        </div>

                        {/* Stats */}
                        <div style={{display:"flex",gap:12,fontSize:11,color:T.muted,flex:1,minWidth:160}}>
                          <span>📋 {u.deals} deals</span>
                          <span>👥 {u.contacts} contacts</span>
                          <span>🏆 {u.won} won</span>
                        </div>

                        {/* Trial / payment */}
                        <div style={{fontSize:11,color:T.muted,flex:1,minWidth:120}}>
                          <div>Joined: {u.joined}</div>
                          {u.plan==="trial" && <div style={{color:u.trial_days_left<2?T.red:T.orange}}>
                            Trial: {u.trial_days_left}d left
                          </div>}
                          {u.is_paid && <div style={{color:T.green}}>Paid ✓ {u.payment_amount} {u.payment_currency}</div>}
                          {u.blocked_reason && <div style={{color:T.red}}>⛔ {u.blocked_reason}</div>}
                        </div>

                        {/* Actions */}
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {u.plan !== "blocked" && (
                            <>
                              <button onClick={function(){activateUser(u.id,"starter",100)}} style={{
                                padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
                                background:"rgba(0,217,126,0.15)",color:T.green,fontSize:11,fontWeight:600}}>
                                ✅ Starter
                              </button>
                              <button onClick={function(){activateUser(u.id,"pro",500)}} style={{
                                padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
                                background:"rgba(168,85,247,0.15)",color:T.purple,fontSize:11,fontWeight:600}}>
                                ⭐ Pro
                              </button>
                              <button onClick={function(){setEditing(isEditing?null:u.id); setEditCredits(u.credits); setEditPlan(u.plan);}} style={{
                                padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
                                background:"rgba(79,142,247,0.15)",color:T.blue,fontSize:11,fontWeight:600}}>
                                ✏️ Edit
                              </button>
                              <button onClick={function(){blockUser(u.id,u.email)}} style={{
                                padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
                                background:"rgba(255,59,92,0.12)",color:T.red,fontSize:11,fontWeight:600}}>
                                🔒 Block
                              </button>
                            </>
                          )}
                          {u.plan === "blocked" && (
                            <button onClick={function(){activateUser(u.id,"trial",10)}} style={{
                              padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
                              background:"rgba(0,212,170,0.15)",color:T.teal,fontSize:11,fontWeight:600}}>
                              🔓 Unblock
                            </button>
                          )}
                          <button onClick={function(){deleteUser(u.id,u.email)}} style={{
                            padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
                            background:"rgba(255,59,92,0.08)",color:T.red+"AA",fontSize:11,fontWeight:600}}>
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Inline editor */}
                      {isEditing && (
                        <div style={{marginTop:12,padding:12,background:T.surface2,borderRadius:8,
                          border:"1px solid "+T.borderBright,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                          <select value={editPlan} onChange={function(e){setEditPlan(e.target.value)}}
                            style={{background:T.surface,border:"1px solid "+T.border,borderRadius:6,
                              padding:"6px 10px",color:T.text,fontSize:13,outline:"none"}}>
                            {["trial","starter","pro","business","blocked"].map(function(p){
                              return <option key={p} value={p}>{p}</option>;
                            })}
                          </select>
                          <input type="number" value={editCredits} onChange={function(e){setEditCredits(+e.target.value)}}
                            placeholder="Credits"
                            style={{width:80,background:T.surface,border:"1px solid "+T.border,borderRadius:6,
                              padding:"6px 10px",color:T.text,fontSize:13,outline:"none"}}/>
                          <button onClick={function(){patchUser(u.id,{plan:editPlan,credits:editCredits});setEditing(null);}}
                            style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",
                              background:T.blue,color:"#fff",fontSize:12,fontWeight:700}}>
                            Save
                          </button>
                          <button onClick={function(){setEditing(null)}}
                            style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",
                              background:"rgba(255,255,255,0.06)",color:T.muted,fontSize:12}}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {users.length === 0 && (
                  <div style={{textAlign:"center",padding:60,color:T.faint,fontSize:14}}>No users found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY ───────────────────────────────────────────────────── */}
        {tab === "activity" && activity && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>🆕 Recent Signups</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {(activity.recent_signups||[]).map(function(u,i){
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                      background:T.surface2,borderRadius:8,border:"1px solid rgba(255,255,255,0.04)"}}>
                      <span style={{fontSize:14}}>{PLAN_ICONS[u.plan]||"👤"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                        <div style={{fontSize:10,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                      </div>
                      <span style={{fontSize:10,color:PLAN_COLORS[u.plan]||T.muted,fontWeight:600,textTransform:"capitalize"}}>{u.plan}</span>
                      <span style={{fontSize:10,color:T.faint,whiteSpace:"nowrap"}}>{u.joined?.slice(5)}</span>
                    </div>
                  );
                })}
                {!(activity.recent_signups||[]).length && <div style={{color:T.faint,fontSize:13,textAlign:"center",padding:20}}>No signups yet</div>}
              </div>
            </div>

            <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>📋 Recent Deals</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {(activity.recent_deals||[]).map(function(d,i){
                  var sc = PLAN_COLORS[d.stage] || T.blue;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                      background:T.surface2,borderRadius:8,border:"1px solid rgba(255,255,255,0.04)"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</div>
                        <div style={{fontSize:10,color:T.muted}}>{d.created?.slice(0,16)}</div>
                      </div>
                      <span style={{fontSize:10,color:sc,fontWeight:700,textTransform:"capitalize",padding:"2px 8px",
                        background:sc+"15",borderRadius:8,border:"1px solid "+sc+"25"}}>{d.stage}</span>
                      {d.value > 0 && <span style={{fontSize:11,color:T.teal,fontWeight:700,fontFamily:"monospace"}}>${Math.round(d.value/1000)}K</span>}
                    </div>
                  );
                })}
                {!(activity.recent_deals||[]).length && <div style={{color:T.faint,fontSize:13,textAlign:"center",padding:20}}>No deals yet</div>}
              </div>
            </div>
          </div>
        )}
        {tab === "activity" && !activity && (
          <div style={{textAlign:"center",padding:60,color:T.muted,fontSize:14}}>Loading activity…</div>
        )}

      </div>
    </div>
  );
}
