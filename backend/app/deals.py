"""Nanoneuron CRM MVP — Deals + AI Email + Dashboard + Payment"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Deal, SavedLead
from app.auth import get_current_user
from app.config import get_settings

settings = get_settings()

deals = APIRouter(prefix="/deals", tags=["Pipeline"])
ai = APIRouter(prefix="/ai", tags=["AI"])
dashboard = APIRouter(prefix="/dashboard", tags=["Dashboard"])
payment = APIRouter(prefix="/payment", tags=["Payment"])


# ═══ DEALS ═══
@deals.get("/")
async def get_deals(stage: str = None, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(Deal).where(Deal.user_id == user.id)
    if stage: q = q.where(Deal.stage == stage)
    r = await db.execute(q.order_by(desc(Deal.created_at)))
    return {"success": True, "data": [{"id":str(d.id),"title":d.title,"value":d.value,"currency":d.currency,"stage":d.stage,"country":d.country,"compliance_status":d.compliance_status,"compliance_notes":d.compliance_notes,"notes":d.notes,"created_at":str(d.created_at)} for d in r.scalars().all()]}

@deals.get("/pipeline")
async def pipeline(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stages = ["lead","qualified","proposal","negotiation","won","lost"]
    p = {}
    for s in stages:
        count = (await db.execute(select(func.count()).where(Deal.user_id == user.id, Deal.stage == s))).scalar() or 0
        value = (await db.execute(select(func.sum(Deal.value)).where(Deal.user_id == user.id, Deal.stage == s))).scalar() or 0
        p[s] = {"count": count, "value": float(value)}
    return {"success": True, "pipeline": p, "total": sum(s["value"] for k,s in p.items() if k != "lost")}

class CreateDeal(BaseModel):
    title: str
    value: float = 0
    currency: str = "USD"
    stage: str = "lead"
    country: str = "US"
    notes: Optional[str] = None
    company_name: Optional[str] = None
    contact_name: Optional[str] = None

@deals.post("/")
async def create_deal(req: CreateDeal, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stage_prob = {"lead":10,"qualified":25,"proposal":40,"negotiation":65,"won":100,"lost":0}
    d = Deal(
        user_id=user.id,
        title=req.title,
        value=req.value,
        currency=req.currency.upper(),
        stage=req.stage,
        country=req.country.upper(),
        notes=req.notes,
        compliance_status="unchecked",
        probability=stage_prob.get(req.stage, 10),
    )
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return {"success": True, "deal": {
        "id": str(d.id), "title": d.title, "stage": d.stage,
        "value": d.value, "currency": d.currency, "country": d.country,
    }}


class UpdateDeal(BaseModel):
    stage: Optional[str] = None
    value: Optional[float] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None   # ISO date string "2026-04-01" or "" to clear

@deals.patch("/{deal_id}")
async def update_deal(deal_id: str, req: UpdateDeal, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(Deal).where(Deal.id == deal_id, Deal.user_id == user.id))).scalar_one_or_none()
    if not d: raise HTTPException(404, "Deal not found")
    if req.stage: d.stage = req.stage
    if req.value is not None: d.value = req.value
    if req.notes: d.notes = (d.notes or "") + "\n" + req.notes
    if req.follow_up_date is not None:
        if req.follow_up_date == "":
            d.follow_up_date = None
        else:
            from datetime import date
            d.follow_up_date = datetime.strptime(req.follow_up_date, "%Y-%m-%d")
    d.updated_at = datetime.utcnow()
    await db.commit()
    return {"success": True, "stage": d.stage, "value": d.value, "follow_up_date": str(d.follow_up_date)[:10] if d.follow_up_date else None}


@deals.get("/followups")
async def get_followups(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Returns deals with follow-up dates — overdue, today, and upcoming 7 days"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)
    week_end = today_start.replace(hour=23, minute=59, second=59) + timedelta(days=7)

    rows = (await db.execute(
        select(Deal).where(
            Deal.user_id == user.id,
            Deal.follow_up_date != None,
            Deal.stage.notin_(["won", "lost"]),
            Deal.follow_up_date <= week_end,
        ).order_by(Deal.follow_up_date)
    )).scalars().all()

    overdue, today, upcoming = [], [], []
    for d in rows:
        item = {
            "id": str(d.id), "title": d.title, "stage": d.stage,
            "value": d.value, "currency": d.currency,
            "follow_up_date": str(d.follow_up_date)[:10],
            "country": d.country,
        }
        if d.follow_up_date < today_start:
            overdue.append(item)
        elif d.follow_up_date <= today_end:
            today.append(item)
        else:
            upcoming.append(item)

    return {
        "success": True,
        "overdue": overdue,
        "today": today,
        "upcoming": upcoming,
        "total": len(overdue) + len(today) + len(upcoming),
    }

@deals.get("/export-csv")
async def export_deals_csv(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from fastapi.responses import StreamingResponse
    import csv, io
    rows = (await db.execute(
        select(Deal).where(Deal.user_id == user.id).order_by(desc(Deal.created_at))
    )).scalars().all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["Title","Stage","Value","Currency","Country","Compliance","Follow Up Date","Notes","Created"])
    for d in rows:
        w.writerow([
            d.title, d.stage, d.value, d.currency, d.country or "",
            d.compliance_status, str(d.follow_up_date)[:10] if d.follow_up_date else "",
            (d.notes or "").replace("\n"," | "), str(d.created_at)[:10],
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nanoneuron-deals.csv"}
    )


@deals.get("/analytics")
async def get_analytics(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    all_deals = (await db.execute(select(Deal).where(Deal.user_id == user.id))).scalars().all()
    stages = ["lead","qualified","proposal","negotiation","won","lost"]

    # Stage breakdown
    stage_data = {}
    for s in stages:
        sd = [d for d in all_deals if d.stage == s]
        stage_data[s] = {"count": len(sd), "value": round(sum(d.value for d in sd), 2)}

    # Summary metrics
    total = len(all_deals)
    won_count = stage_data["won"]["count"]
    closed = won_count + stage_data["lost"]["count"]
    win_rate = round(won_count / max(closed, 1) * 100, 1)
    avg_value = round(sum(d.value for d in all_deals) / max(total, 1), 0)
    pipeline_value = sum(d.value for d in all_deals if d.stage not in ["won","lost"])

    # Monthly trend — last 6 months
    now = datetime.utcnow()
    monthly = []
    for i in range(5, -1, -1):
        # Start of month i months ago
        m = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i))
        m = m.replace(day=1)
        m_end = (m.replace(day=28) + timedelta(days=4)).replace(day=1)
        md = [d for d in all_deals if m <= d.created_at < m_end]
        monthly.append({
            "month": m.strftime("%b"),
            "count": len(md),
            "value": round(sum(d.value for d in md), 0),
            "won": len([d for d in md if d.stage == "won"]),
        })

    # Country breakdown
    c_map = {}
    for d in all_deals:
        c = d.country or "—"
        if c not in c_map: c_map[c] = {"count": 0, "value": 0}
        c_map[c]["count"] += 1
        c_map[c]["value"] += d.value
    top_countries = [{"country": k, **v} for k, v in
                     sorted(c_map.items(), key=lambda x: x[1]["value"], reverse=True)[:6]]

    # Stage conversion rates (how many move from each stage onward)
    conversions = []
    for i in range(len(stages)-2):  # lead→won funnel, exclude lost
        src = stages[i]
        src_count = sum(stage_data[s]["count"] for s in stages[i:])
        conversions.append({
            "from": src,
            "to": stages[i+1],
            "rate": round(stage_data[stages[i+1]]["count"] / max(src_count, 1) * 100, 0),
        })

    return {
        "success": True,
        "summary": {
            "total_deals": total,
            "won_count": won_count,
            "lost_count": stage_data["lost"]["count"],
            "active_count": total - won_count - stage_data["lost"]["count"],
            "win_rate": win_rate,
            "avg_deal_value": avg_value,
            "total_won_value": stage_data["won"]["value"],
            "pipeline_value": round(pipeline_value, 2),
        },
        "stages": stage_data,
        "monthly": monthly,
        "top_countries": top_countries,
        "conversions": conversions,
    }


@deals.delete("/{deal_id}")
async def delete_deal(deal_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(Deal).where(Deal.id == deal_id, Deal.user_id == user.id))).scalar_one_or_none()
    if not d: raise HTTPException(404)
    await db.delete(d); await db.commit()
    return {"success": True}


# ═══ AI EMAIL ═══
class EmailReq(BaseModel):
    contact_name: str
    contact_title: str = ""
    company_name: str = ""
    language: str = "en"
    context: str = ""

@ai.post("/draft-email")
async def draft_email(req: EmailReq, user: User = Depends(get_current_user)):
    if settings.ANTHROPIC_API_KEY:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post("https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": settings.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                    json={"model": "claude-sonnet-4-6", "max_tokens": 500,
                        "system": f"Write a {req.language} sales outreach email under 100 words. Professional, specific, personal.",
                        "messages": [{"role": "user", "content": f"Email to {req.contact_name} ({req.contact_title}) at {req.company_name}. Context: {req.context or 'Cold outreach for CRM software'}. From: {user.name}"}]})
                if resp.status_code == 200:
                    return {"success": True, "engine": "claude_ai", "email": resp.json()["content"][0]["text"]}
        except: pass

    t = {"en": f"Hi {req.contact_name},\n\nI noticed {req.company_name} is growing internationally. We help companies manage deals and compliance across 73+ countries automatically.\n\nWould you be open to a 15-minute call this week?\n\nBest,\n{user.name}",
         "ja": f"{req.contact_name}\u69D8\n\n{req.company_name}\u304C\u56FD\u969B\u7684\u306B\u6210\u9577\u3055\u308C\u3066\u3044\u308B\u3053\u3068\u306B\u6C17\u3065\u304D\u307E\u3057\u305F\u3002\u5F0A\u793E\u306F73\u30AB\u56FD\u4EE5\u4E0A\u306E\u30B3\u30F3\u30D7\u30E9\u30A4\u30A2\u30F3\u30B9\u3092\u81EA\u52D5\u7684\u306B\u7BA1\u7406\u3059\u308BCRM\u3092\u63D0\u4F9B\u3057\u3066\u3044\u307E\u3059\u3002\n\n\u4ECA\u9031\u304A\u96FB\u8A71\u306F\u53EF\u80FD\u3067\u3057\u3087\u3046\u304B\uFF1F\n\n\u656C\u5177\n{user.name}",
         "de": f"Hallo {req.contact_name},\n\n{req.company_name} w\u00E4chst international. Wir helfen, Deals und Compliance in 73+ L\u00E4ndern automatisch zu verwalten.\n\n15 Minuten diese Woche?\n\nMit freundlichen Gr\u00FC\u00DFen,\n{user.name}",
         "hi": f"\u0928\u092E\u0938\u094D\u0924\u0947 {req.contact_name},\n\n{req.company_name} \u0905\u0902\u0924\u0930\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0938\u094D\u0924\u0930 \u092A\u0930 \u092C\u0922\u093C \u0930\u0939\u093E \u0939\u0948\u0964 \u0939\u092E 73+ \u0926\u0947\u0936\u094B\u0902 \u092E\u0947\u0902 compliance \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0930\u0942\u092A \u0938\u0947 manage \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964\n\n\u0915\u094D\u092F\u093E \u0907\u0938 \u0939\u092B\u094D\u0924\u0947 15 \u092E\u093F\u0928\u091F \u0915\u0940 \u0915\u0949\u0932 \u0939\u094B \u0938\u0915\u0924\u0940 \u0939\u0948?\n\n\u0927\u0928\u094D\u092F\u0935\u093E\u0926,\n{user.name}"}
    return {"success": True, "engine": "template", "email": t.get(req.language, t["en"])}


# ═══ DASHBOARD STATS ═══
@dashboard.get("/stats")
async def stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    td = (await db.execute(select(func.count()).where(Deal.user_id == user.id))).scalar() or 0
    tv = (await db.execute(select(func.sum(Deal.value)).where(Deal.user_id == user.id, Deal.stage != "lost"))).scalar() or 0
    won = (await db.execute(select(func.count()).where(Deal.user_id == user.id, Deal.stage == "won"))).scalar() or 0
    sl = (await db.execute(select(func.count()).where(SavedLead.user_id == user.id))).scalar() or 0
    hot = (await db.execute(select(func.count()).where(Deal.user_id == user.id, Deal.stage.in_(["proposal","negotiation"])))).scalar() or 0

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)
    followups_due = (await db.execute(
        select(func.count()).where(
            Deal.user_id == user.id,
            Deal.follow_up_date != None,
            Deal.follow_up_date <= today_end,
            Deal.stage.notin_(["won","lost"]),
        )
    )).scalar() or 0

    return {"success": True, "stats": {
        "credits": user.credits, "total_deals": td, "pipeline_value": float(tv),
        "won": won, "leads_saved": sl, "hot_deals": hot,
        "followups_due": followups_due,
        "conversion": f"{(won/td*100):.0f}%" if td else "0%",
        "plan": user.plan,
    }}


# ═══ PAYMENT — Strict. Pay first, then service. ═══
@payment.get("/plans")
async def get_plans():
    return {"success": True, "plans": [
        {"id":"starter","name":"Starter","price_usd":49,"price_inr":4067,"credits_monthly":100,"users":1,"features":["100 lead unlocks/month","Deal pipeline","AI email","Compliance check"]},
        {"id":"pro","name":"Pro","price_usd":199,"price_inr":16517,"credits_monthly":500,"users":5,"features":["500 lead unlocks/month","Unlimited deals","All languages","Priority support","CSV export"]},
        {"id":"business","name":"Business","price_usd":499,"price_inr":41417,"credits_monthly":2500,"users":999,"features":["2,500 lead unlocks/month","Unlimited everything","API access","Team features","Dedicated support"]},
    ], "note": "Pay via SWIFT wire or NEFT/RTGS. Access restored within 24 hours of payment confirmation."}

@payment.get("/methods")
async def payment_methods():
    s = get_settings()
    return {"success": True, "methods": [
        {"id": "swift_usd", "name": "Wire Transfer (USD)", "details": {
            "beneficiary": s.SWIFT_BENEFICIARY_NAME,
            "account": s.SWIFT_BENEFICIARY_ACCOUNT,
            "bank": s.SWIFT_BENEFICIARY_BANK,
            "bank_swift": s.SWIFT_BENEFICIARY_BANK_CODE,
            "correspondent": s.SWIFT_USD_CORRESPONDENT,
            "correspondent_swift": s.SWIFT_USD_CORRESPONDENT_SWIFT,
            "nostro": s.SWIFT_USD_NOSTRO,
            "iban": s.SWIFT_USD_IBAN,
        }},
        {"id": "swift_gbp", "name": "Wire Transfer (GBP)", "details": {
            "beneficiary": s.SWIFT_BENEFICIARY_NAME,
            "account": s.SWIFT_BENEFICIARY_ACCOUNT,
            "bank": s.SWIFT_BENEFICIARY_BANK,
            "bank_swift": s.SWIFT_BENEFICIARY_BANK_CODE,
            "correspondent": s.SWIFT_GBP_CORRESPONDENT,
            "correspondent_swift": s.SWIFT_GBP_CORRESPONDENT_SWIFT,
            "nostro": s.SWIFT_GBP_NOSTRO,
            "iban": s.SWIFT_GBP_IBAN,
        }},
        {"id": "swift_eur", "name": "Wire Transfer (EUR)", "details": {
            "beneficiary": s.SWIFT_BENEFICIARY_NAME,
            "account": s.SWIFT_BENEFICIARY_ACCOUNT,
            "bank": s.SWIFT_BENEFICIARY_BANK,
            "bank_swift": s.SWIFT_BENEFICIARY_BANK_CODE,
            "correspondent": s.SWIFT_EUR_CORRESPONDENT,
            "correspondent_swift": s.SWIFT_EUR_CORRESPONDENT_SWIFT,
            "nostro": s.SWIFT_EUR_NOSTRO,
            "iban": s.SWIFT_EUR_IBAN,
        }},
        {"id": "neft", "name": "NEFT / RTGS / IMPS (INR)", "details": {
            "bank": s.BANK_NAME,
            "account_holder": s.BANK_ACCOUNT_HOLDER,
            "account_number": s.BANK_ACCOUNT_NUMBER,
            "ifsc": s.BANK_IFSC,
        }},
    ], "instructions": "1. Choose a plan. 2. Transfer via SWIFT or NEFT/RTGS. 3. Email receipt to service@nanoneuron.ai with your registered email. 4. Access restored within 24 hours."}

class ActivateReq(BaseModel):
    user_email: str
    plan: str
    credits: int = 100
    founder_key: str

@payment.post("/activate")
async def activate_paid_user(req: ActivateReq, db: AsyncSession = Depends(get_db)):
    """FOUNDER ONLY — Activate a user after payment is confirmed in bank"""
    if req.founder_key != settings.JWT_SECRET:
        raise HTTPException(403, "Invalid founder key")

    r = await db.execute(select(User).where(User.email == req.user_email))
    user = r.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_paid = True
    user.plan = req.plan
    user.credits = req.credits
    user.payment_date = datetime.utcnow()
    user.blocked_reason = None
    await db.commit()

    return {
        "success": True,
        "message": f"{req.user_email} activated on {req.plan} plan with {req.credits} credits",
        "user": {"email": user.email, "plan": user.plan, "credits": user.credits, "is_paid": True},
    }

@payment.post("/add-credits")
async def add_credits(body: dict, db: AsyncSession = Depends(get_db)):
    """FOUNDER ONLY — Add credits after payment confirmed"""
    if body.get("founder_key") != settings.JWT_SECRET:
        raise HTTPException(403, "Invalid founder key")
    email = body.get("email")
    amount = body.get("credits", 0)
    if not email or amount <= 0:
        raise HTTPException(400, "Email and credits required")
    r = await db.execute(select(User).where(User.email == email))
    user = r.scalar_one_or_none()
    if not user: raise HTTPException(404, "User not found")
    user.credits += amount
    await db.commit()
    return {"success": True, "email": email, "credits": user.credits, "added": amount}
