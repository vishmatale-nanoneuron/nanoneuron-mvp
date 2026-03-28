"""
═══ Nanoneuron — Founder Dashboard API ═══
TRIPLE-LOCKED: JWT auth + founder email match + founder secret header
No other user can access any endpoint here, ever.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Deal, SavedLead, Note, EmailTemplate
from app.auth import get_current_user
from app.config import get_settings

founder_router = APIRouter(prefix="/founder", tags=["Founder"])
settings = get_settings()


# ═══ TRIPLE-LOCK DEPENDENCY ══════════════════════════════════════════════════
async def get_founder(
    x_founder_secret: Optional[str] = Header(None, alias="x-founder-secret"),
    user: User = Depends(get_current_user),
):
    """
    Three independent checks — ALL must pass:
    1. Valid JWT (get_current_user handles this)
    2. Email must exactly match FOUNDER_EMAIL env var
    3. x-founder-secret header must match FOUNDER_SECRET env var
    Any failure → generic 403, no info leaked.
    """
    if not settings.FOUNDER_EMAIL:
        raise HTTPException(403, "Forbidden")
    if user.email.lower().strip() != settings.FOUNDER_EMAIL.lower().strip():
        raise HTTPException(403, "Forbidden")
    if settings.FOUNDER_SECRET:
        if not x_founder_secret or x_founder_secret != settings.FOUNDER_SECRET:
            raise HTTPException(403, "Forbidden")
    return user


# ═══ STATS OVERVIEW ══════════════════════════════════════════════════════════
@founder_router.get("/stats")
async def founder_stats(founder: User = Depends(get_founder), db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total_users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    active_trials = (await db.execute(select(func.count()).where(User.plan == "trial", User.is_active == True))).scalar() or 0
    paid_users = (await db.execute(select(func.count()).where(User.is_paid == True))).scalar() or 0
    blocked_users = (await db.execute(select(func.count()).where(User.plan == "blocked"))).scalar() or 0

    signups_today = (await db.execute(select(func.count()).where(User.created_at >= today))).scalar() or 0
    signups_week = (await db.execute(select(func.count()).where(User.created_at >= week_ago))).scalar() or 0
    signups_month = (await db.execute(select(func.count()).where(User.created_at >= month_ago))).scalar() or 0

    total_deals = (await db.execute(select(func.count()).select_from(Deal))).scalar() or 0
    won_deals = (await db.execute(select(func.count()).where(Deal.stage == "won"))).scalar() or 0
    total_pipeline = (await db.execute(select(func.sum(Deal.value)).where(Deal.stage != "lost"))).scalar() or 0
    total_won_value = (await db.execute(select(func.sum(Deal.value)).where(Deal.stage == "won"))).scalar() or 0

    total_contacts = (await db.execute(select(func.count()).select_from(SavedLead))).scalar() or 0
    total_notes = (await db.execute(select(func.count()).select_from(Note))).scalar() or 0
    total_templates = (await db.execute(select(func.count()).select_from(EmailTemplate))).scalar() or 0

    credits_given = (await db.execute(select(func.sum(User.credits)).select_from(User))).scalar() or 0

    plan_dist = {}
    for plan in ["trial", "starter", "pro", "business", "blocked"]:
        cnt = (await db.execute(select(func.count()).where(User.plan == plan))).scalar() or 0
        plan_dist[plan] = cnt

    revenue_usd = (await db.execute(
        select(func.sum(User.payment_amount)).where(User.payment_currency == "USD", User.is_paid == True)
    )).scalar() or 0
    revenue_inr = (await db.execute(
        select(func.sum(User.payment_amount)).where(User.payment_currency == "INR", User.is_paid == True)
    )).scalar() or 0

    return {
        "success": True,
        "overview": {
            "total_users": total_users,
            "active_trials": active_trials,
            "paid_users": paid_users,
            "blocked_users": blocked_users,
            "signups_today": signups_today,
            "signups_week": signups_week,
            "signups_month": signups_month,
        },
        "revenue": {
            "usd": float(revenue_usd),
            "inr": float(revenue_inr),
            "paid_count": paid_users,
            "plan_distribution": plan_dist,
        },
        "product": {
            "total_deals": total_deals,
            "won_deals": won_deals,
            "total_pipeline_usd": float(total_pipeline),
            "total_won_usd": float(total_won_value),
            "total_contacts_unlocked": total_contacts,
            "total_notes": total_notes,
            "total_templates": total_templates,
            "credits_in_system": int(credits_given),
        },
    }


# ═══ USER LIST ════════════════════════════════════════════════════════════════
@founder_router.get("/users")
async def list_users(
    plan: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 100,
    founder: User = Depends(get_founder),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).order_by(User.created_at.desc())
    if plan:
        stmt = stmt.where(User.plan == plan)
    if q:
        stmt = stmt.where(User.email.ilike(f"%{q}%") | User.name.ilike(f"%{q}%"))
    stmt = stmt.limit(limit)
    users = (await db.execute(stmt)).scalars().all()

    result = []
    for u in users:
        deal_count = (await db.execute(select(func.count()).where(Deal.user_id == u.id))).scalar() or 0
        contact_count = (await db.execute(select(func.count()).where(SavedLead.user_id == u.id))).scalar() or 0
        won = (await db.execute(select(func.count()).where(Deal.user_id == u.id, Deal.stage == "won"))).scalar() or 0
        pipeline_val = (await db.execute(select(func.sum(Deal.value)).where(Deal.user_id == u.id, Deal.stage != "lost"))).scalar() or 0
        trial_days_left = 0
        if u.trial_end:
            delta = u.trial_end - datetime.utcnow()
            trial_days_left = max(0, delta.days)
        result.append({
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "company": u.company_name or "",
            "plan": u.plan,
            "credits": u.credits,
            "is_active": u.is_active,
            "is_paid": u.is_paid,
            "payment_amount": u.payment_amount,
            "payment_currency": u.payment_currency,
            "trial_days_left": trial_days_left,
            "deals": deal_count,
            "contacts": contact_count,
            "won": won,
            "pipeline_usd": float(pipeline_val),
            "joined": str(u.created_at)[:10],
            "last_payment": str(u.payment_date)[:10] if u.payment_date else None,
            "blocked_reason": u.blocked_reason,
        })
    return {"success": True, "users": result, "total": len(result)}


# ═══ USER MANAGEMENT ═════════════════════════════════════════════════════════
class UserAction(BaseModel):
    plan: Optional[str] = None
    credits: Optional[int] = None
    is_active: Optional[bool] = None
    blocked_reason: Optional[str] = None
    add_credits: Optional[int] = None
    payment_amount: Optional[float] = None
    payment_currency: Optional[str] = None

@founder_router.patch("/users/{user_id}")
async def manage_user(
    user_id: str,
    req: UserAction,
    founder: User = Depends(get_founder),
    db: AsyncSession = Depends(get_db),
):
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    if req.plan is not None:
        u.plan = req.plan
        if req.plan not in ("trial", "blocked"):
            u.is_paid = True
    if req.credits is not None:
        u.credits = req.credits
    if req.add_credits is not None:
        u.credits = (u.credits or 0) + req.add_credits
    if req.is_active is not None:
        u.is_active = req.is_active
    if req.blocked_reason is not None:
        u.blocked_reason = req.blocked_reason
        if req.blocked_reason:
            u.plan = "blocked"
            u.is_active = False
    if req.payment_amount is not None:
        u.payment_amount = req.payment_amount
        u.payment_date = datetime.utcnow()
        u.is_paid = True
    if req.payment_currency is not None:
        u.payment_currency = req.payment_currency
    await db.commit()
    return {"success": True, "email": u.email, "plan": u.plan, "credits": u.credits, "is_active": u.is_active}


@founder_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    founder: User = Depends(get_founder),
    db: AsyncSession = Depends(get_db),
):
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    if u.email == settings.FOUNDER_EMAIL:
        raise HTTPException(403, "Cannot delete founder account")
    await db.delete(u)
    await db.commit()
    return {"success": True}


# ═══ RECENT ACTIVITY ═════════════════════════════════════════════════════════
@founder_router.get("/activity")
async def founder_activity(founder: User = Depends(get_founder), db: AsyncSession = Depends(get_db)):
    recent_signups = (await db.execute(
        select(User).order_by(User.created_at.desc()).limit(10)
    )).scalars().all()

    recent_deals = (await db.execute(
        select(Deal).order_by(Deal.created_at.desc()).limit(10)
    )).scalars().all()

    return {
        "success": True,
        "recent_signups": [{"email": u.email, "name": u.name, "plan": u.plan, "joined": str(u.created_at)[:16]} for u in recent_signups],
        "recent_deals": [{"title": d.title, "stage": d.stage, "value": d.value, "created": str(d.created_at)[:16]} for d in recent_deals],
    }


# ═══ QUICK ACTIONS ════════════════════════════════════════════════════════════
@founder_router.post("/activate/{user_id}")
async def activate_user(
    user_id: str,
    plan: str = "starter",
    credits: int = 100,
    founder: User = Depends(get_founder),
    db: AsyncSession = Depends(get_db),
):
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    u.plan = plan
    u.credits = credits
    u.is_paid = True
    u.is_active = True
    u.blocked_reason = None
    u.payment_date = datetime.utcnow()
    await db.commit()
    return {"success": True, "email": u.email, "plan": plan, "credits": credits}


@founder_router.post("/block/{user_id}")
async def block_user(
    user_id: str,
    reason: str = "Payment not received",
    founder: User = Depends(get_founder),
    db: AsyncSession = Depends(get_db),
):
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    if u.email == settings.FOUNDER_EMAIL:
        raise HTTPException(403, "Cannot block founder account")
    u.plan = "blocked"
    u.is_active = False
    u.blocked_reason = reason
    await db.commit()
    return {"success": True, "email": u.email, "blocked": True, "reason": reason}
