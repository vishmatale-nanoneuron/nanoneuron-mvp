"""
═══ Nanoneuron CRM — Auth + STRICT 7-Day Trial ═══

Rules:
1. Client registers → gets 7 days trial + 10 credits
2. Day 1-7: Full access, limited credits
3. Day 8+: BLOCKED. Zero access. Pay first.
4. After payment confirmed: Full access restored
5. No exceptions. No extensions. Software is precious.
"""
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.config import get_settings
from app.database import get_db
from app.models import User

settings = get_settings()
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
bearer = HTTPBearer(auto_error=False)

TRIAL_DAYS = 7
TRIAL_CREDITS = 10

auth = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str = ""

class LoginReq(BaseModel):
    email: EmailStr
    password: str


def create_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(hours=24)},
        settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )


def check_trial_status(user: User) -> dict:
    """Check if trial is active, expired, or paid"""
    now = datetime.utcnow()

    # Already paid — full access
    if user.is_paid:
        return {"status": "active", "plan": user.plan, "paid": True, "message": "Full access"}

    # Check trial
    if not user.trial_end:
        return {"status": "blocked", "paid": False, "message": "No trial period set. Contact support."}

    days_left = (user.trial_end - now).days
    hours_left = int((user.trial_end - now).total_seconds() / 3600)

    if now < user.trial_end:
        return {
            "status": "trial",
            "paid": False,
            "days_left": max(0, days_left),
            "hours_left": max(0, hours_left),
            "trial_end": user.trial_end.strftime("%Y-%m-%d %H:%M"),
            "message": f"Trial active. {max(0, days_left)} days remaining. Pay before trial ends to keep access.",
        }
    else:
        return {
            "status": "expired",
            "paid": False,
            "days_left": 0,
            "expired_days_ago": abs(days_left),
            "message": "Trial expired. Pay now to restore access. All your data is safe.",
        }


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: AsyncSession = Depends(get_db)) -> User:
    """Get current user AND enforce trial/payment"""
    if not creds:
        raise HTTPException(401, "Login required")
    try:
        payload = jwt.decode(creds.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        r = await db.execute(select(User).where(User.id == payload["sub"]))
        user = r.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(401, "Account deactivated")

        # ═══ STRICT TRIAL ENFORCEMENT ═══
        trial = check_trial_status(user)

        if trial["status"] == "expired":
            raise HTTPException(
                403,
                {
                    "error": "trial_expired",
                    "message": "Your 7-day trial has expired. Pay now to continue using Nanoneuron CRM.",
                    "payment_url": "/api/payment/methods",
                    "plans_url": "/api/payment/plans",
                    "data_safe": True,
                    "note": "Your data is safe. It will be available immediately after payment.",
                }
            )

        if trial["status"] == "blocked":
            raise HTTPException(403, "Account blocked. Contact support@nanoneuron.ai")

        return user
    except JWTError:
        raise HTTPException(401, "Invalid or expired token. Login again.")


async def get_user_no_trial_check(creds: HTTPAuthorizationCredentials = Depends(bearer), db: AsyncSession = Depends(get_db)) -> User:
    """Get user WITHOUT trial check — for payment and status endpoints only"""
    if not creds:
        raise HTTPException(401, "Login required")
    try:
        payload = jwt.decode(creds.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        r = await db.execute(select(User).where(User.id == payload["sub"]))
        user = r.scalar_one_or_none()
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except JWTError:
        raise HTTPException(401, "Invalid token")


# ═══ REGISTER ═══
@auth.post("/register")
async def register(req: RegisterReq, db: AsyncSession = Depends(get_db)):
    """Register new client — gets 7-day trial + 10 credits. No more."""
    # Check existing
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered. Login instead.")

    # Validate password
    if len(req.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if not req.name.strip():
        raise HTTPException(400, "Name is required")

    now = datetime.utcnow()
    user = User(
        email=req.email,
        password_hash=pwd.hash(req.password),
        name=req.name.strip(),
        company_name=req.company_name.strip(),
        credits=TRIAL_CREDITS,
        plan="trial",
        is_paid=False,
        trial_start=now,
        trial_end=now + timedelta(days=TRIAL_DAYS),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "token": create_token(user.id),
        "user": {
            "id": str(user.id), "name": user.name, "email": user.email,
            "credits": user.credits, "plan": user.plan,
        },
        "trial": {
            "days": TRIAL_DAYS,
            "credits": TRIAL_CREDITS,
            "starts": now.strftime("%Y-%m-%d"),
            "ends": (now + timedelta(days=TRIAL_DAYS)).strftime("%Y-%m-%d"),
        },
        "message": f"Welcome! You have {TRIAL_DAYS} days to try Nanoneuron CRM with {TRIAL_CREDITS} credits. After that, payment is required.",
        "warning": f"Your trial expires on {(now + timedelta(days=TRIAL_DAYS)).strftime('%B %d, %Y')}. Subscribe before then to keep access.",
    }


# ═══ LOGIN ═══
@auth.post("/login")
async def login(req: LoginReq, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(User).where(User.email == req.email))
    user = r.scalar_one_or_none()
    if not user or not pwd.verify(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    trial = check_trial_status(user)

    return {
        "success": True,
        "token": create_token(user.id),
        "user": {
            "id": str(user.id), "name": user.name, "email": user.email,
            "credits": user.credits, "plan": user.plan, "is_paid": user.is_paid,
        },
        "trial": trial,
    }


# ═══ MY ACCOUNT STATUS ═══
@auth.get("/me")
async def me(user: User = Depends(get_user_no_trial_check)):
    """Account status — works even when trial expired (so they can see payment info)"""
    trial = check_trial_status(user)
    return {
        "success": True,
        "user": {
            "id": str(user.id), "name": user.name, "email": user.email,
            "credits": user.credits, "plan": user.plan, "is_paid": user.is_paid,
            "company": user.company_name,
        },
        "trial": trial,
        "payment_required": trial["status"] == "expired",
        "payment_url": "/api/payment/methods" if trial["status"] == "expired" else None,
    }


# ═══ TRIAL STATUS (public for UI) ═══
@auth.get("/trial-status")
async def trial_status(user: User = Depends(get_user_no_trial_check)):
    """Check trial status — works even when expired"""
    trial = check_trial_status(user)

    response = {
        "success": True,
        "status": trial["status"],
        "is_paid": user.is_paid,
        "credits": user.credits,
        "plan": user.plan,
    }

    if trial["status"] == "trial":
        response["days_left"] = trial["days_left"]
        response["hours_left"] = trial["hours_left"]
        response["trial_end"] = trial["trial_end"]
        response["warning"] = f"{trial['days_left']} days left. Subscribe at /api/payment/plans to avoid losing access."

    elif trial["status"] == "expired":
        response["message"] = "Trial expired. Your data is safe. Pay to restore full access."
        response["payment_plans"] = "/api/payment/plans"
        response["payment_methods"] = "/api/payment/methods"

    elif trial["status"] == "active":
        response["message"] = "Full access. Thank you for your payment."

    return response
