"""
═══ Nanoneuron — Invoice Generator ═══
GST invoices for Indian clients (CGST+SGST or IGST)
Export invoices for international clients (0% GST / LUT)
SAC Code: 998314 — Information Technology Services
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Invoice
from app.auth import get_current_user
from app.config import get_settings

invoice_router = APIRouter(prefix="/invoices", tags=["Invoices"])
settings = get_settings()

PLAN_PRICES = {
    "starter":  {"INR": 4066,  "USD": 49,  "GBP": 39,  "EUR": 45},
    "pro":      {"INR": 16517, "USD": 199, "GBP": 157, "EUR": 183},
    "business": {"INR": 41417, "USD": 499, "GBP": 394, "EUR": 459},
}

PLAN_LABELS = {
    "starter": "Starter Plan — CRM + 100 Lead Unlocks/month",
    "pro":     "Pro Plan — CRM + 500 Lead Unlocks/month + Priority Support",
    "business":"Business Plan — CRM + 2,500 Lead Unlocks/month + Team Features + API Access",
}


async def _next_invoice_number(db: AsyncSession) -> str:
    year = datetime.utcnow().year
    count = (await db.execute(
        select(func.count()).select_from(Invoice)
        .where(Invoice.invoice_number.like(f"NN/{year}/%"))
    )).scalar() or 0
    return f"NN/{year}/{str(count + 1).zfill(4)}"


class InvoiceCreate(BaseModel):
    buyer_name: str
    buyer_email: Optional[str] = None
    buyer_company: Optional[str] = None
    buyer_gstin: Optional[str] = None
    buyer_address: Optional[str] = None
    buyer_state: Optional[str] = None
    buyer_country: str = "IN"
    plan: str
    currency: str = "INR"
    custom_amount: Optional[float] = None   # Override plan price if needed
    custom_description: Optional[str] = None
    notes: Optional[str] = None
    seller_state: str = "Maharashtra"       # Nanoneuron Services — state code 27


class InvoiceStatusUpdate(BaseModel):
    status: str  # draft, sent, paid


@invoice_router.get("/seller-info")
async def seller_info(user: User = Depends(get_current_user)):
    """Returns seller (Nanoneuron Services) details for invoice header"""
    return {
        "success": True,
        "seller": {
            "name": settings.COMPANY_NAME,
            "gstin": settings.COMPANY_GSTIN,
            "state": settings.COMPANY_STATE,
            "address": settings.COMPANY_ADDRESS,
            "sac_code": settings.COMPANY_SAC,
            "email": "service@nanoneuron.ai",
            "website": "nanoneuron.ai",
        }
    }


@invoice_router.post("/")
async def create_invoice(
    req: InvoiceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.plan not in PLAN_PRICES:
        raise HTTPException(400, "Invalid plan. Use: starter, pro, business")

    currency = req.currency.upper()
    if currency not in ("INR", "USD", "GBP", "EUR"):
        raise HTTPException(400, "Invalid currency. Use: INR, USD, GBP, EUR")

    is_export = currency != "INR"
    amount = req.custom_amount if req.custom_amount else float(PLAN_PRICES[req.plan][currency])
    description = req.custom_description or PLAN_LABELS[req.plan]

    # Tax calculation
    cgst = sgst = igst = 0.0
    is_igst = False

    if not is_export:
        # INR domestic — determine CGST+SGST (intra-state) vs IGST (inter-state)
        # Intra-state = buyer state matches seller state
        buyer_state = (req.buyer_state or "").strip().lower()
        seller_state = (settings.COMPANY_STATE or req.seller_state).strip().lower()
        if buyer_state and buyer_state == seller_state:
            # Intra-state: CGST 9% + SGST 9%
            cgst = round(amount * 0.09, 2)
            sgst = round(amount * 0.09, 2)
            is_igst = False
        else:
            # Inter-state or unknown state: IGST 18%
            igst = round(amount * 0.18, 2)
            is_igst = True

    total = round(amount + cgst + sgst + igst, 2)
    invoice_number = await _next_invoice_number(db)

    inv = Invoice(
        user_id=user.id,
        invoice_number=invoice_number,
        buyer_name=req.buyer_name,
        buyer_email=req.buyer_email,
        buyer_company=req.buyer_company,
        buyer_gstin=req.buyer_gstin,
        buyer_address=req.buyer_address,
        buyer_state=req.buyer_state,
        buyer_country=req.buyer_country,
        plan=req.plan,
        description=description,
        currency=currency,
        amount_before_tax=amount,
        is_export=is_export,
        is_igst=is_igst,
        cgst_amount=cgst,
        sgst_amount=sgst,
        igst_amount=igst,
        total_amount=total,
        status="draft",
        notes=req.notes,
        invoice_date=datetime.utcnow(),
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return {"success": True, "invoice": _serialize(inv)}


@invoice_router.get("/")
async def list_invoices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(Invoice).where(Invoice.user_id == user.id)
        .order_by(Invoice.invoice_date.desc())
    )).scalars().all()
    return {"success": True, "invoices": [_serialize(r) for r in rows], "total": len(rows)}


@invoice_router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv = (await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user.id)
    )).scalar_one_or_none()
    if not inv:
        raise HTTPException(404, "Invoice not found")
    return {"success": True, "invoice": _serialize(inv)}


@invoice_router.patch("/{invoice_id}")
async def update_invoice_status(
    invoice_id: str,
    req: InvoiceStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv = (await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user.id)
    )).scalar_one_or_none()
    if not inv:
        raise HTTPException(404, "Invoice not found")
    if req.status not in ("draft", "sent", "paid"):
        raise HTTPException(400, "Status must be: draft, sent, paid")
    inv.status = req.status
    await db.commit()
    return {"success": True, "invoice_number": inv.invoice_number, "status": inv.status}


@invoice_router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv = (await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user.id)
    )).scalar_one_or_none()
    if not inv:
        raise HTTPException(404, "Invoice not found")
    await db.delete(inv)
    await db.commit()
    return {"success": True}


def _serialize(inv: Invoice) -> dict:
    return {
        "id": str(inv.id),
        "invoice_number": inv.invoice_number,
        "invoice_date": str(inv.invoice_date)[:10],
        "buyer_name": inv.buyer_name,
        "buyer_email": inv.buyer_email,
        "buyer_company": inv.buyer_company,
        "buyer_gstin": inv.buyer_gstin,
        "buyer_address": inv.buyer_address,
        "buyer_state": inv.buyer_state,
        "buyer_country": inv.buyer_country,
        "plan": inv.plan,
        "description": inv.description,
        "sac_code": inv.sac_code,
        "currency": inv.currency,
        "amount_before_tax": inv.amount_before_tax,
        "is_export": inv.is_export,
        "is_igst": inv.is_igst,
        "cgst_amount": inv.cgst_amount,
        "sgst_amount": inv.sgst_amount,
        "igst_amount": inv.igst_amount,
        "total_amount": inv.total_amount,
        "status": inv.status,
        "notes": inv.notes,
    }
