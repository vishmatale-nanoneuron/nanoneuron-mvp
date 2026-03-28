"""
═══ Nanoneuron CRM — Notes + Email Templates API ═══
Activity logs on deals · Save & reuse email templates
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Note, EmailTemplate, Deal, SavedLead
from app.auth import get_current_user

notes_router = APIRouter(prefix="/notes", tags=["Notes"])
templates_router = APIRouter(prefix="/templates", tags=["Email Templates"])


# ═══ NOTES ═══════════════════════════════════════════════════════════

class NoteCreate(BaseModel):
    content: str
    note_type: str = "note"   # note | call | email | meeting | task
    deal_id: Optional[str] = None
    saved_lead_id: Optional[str] = None

class NoteUpdate(BaseModel):
    content: str

@notes_router.post("/")
async def create_note(req: NoteCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not req.deal_id and not req.saved_lead_id:
        raise HTTPException(400, "Provide deal_id or saved_lead_id")
    note = Note(
        user_id=user.id, content=req.content, note_type=req.note_type,
        deal_id=req.deal_id or None, saved_lead_id=req.saved_lead_id or None,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return {"success": True, "note": {
        "id": str(note.id), "content": note.content, "note_type": note.note_type,
        "deal_id": str(note.deal_id) if note.deal_id else None,
        "saved_lead_id": str(note.saved_lead_id) if note.saved_lead_id else None,
        "created_at": str(note.created_at),
    }}


@notes_router.get("/deal/{deal_id}")
async def get_deal_notes(deal_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(Note).where(Note.user_id == user.id, Note.deal_id == deal_id).order_by(Note.created_at.desc())
    )).scalars().all()
    return {"success": True, "notes": [{
        "id": str(n.id), "content": n.content, "note_type": n.note_type,
        "created_at": str(n.created_at),
    } for n in rows]}


@notes_router.get("/contact/{saved_lead_id}")
async def get_contact_notes(saved_lead_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(Note).where(Note.user_id == user.id, Note.saved_lead_id == saved_lead_id).order_by(Note.created_at.desc())
    )).scalars().all()
    return {"success": True, "notes": [{
        "id": str(n.id), "content": n.content, "note_type": n.note_type,
        "created_at": str(n.created_at),
    } for n in rows]}


@notes_router.patch("/{note_id}")
async def update_note(note_id: str, req: NoteUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    note = (await db.execute(select(Note).where(Note.id == note_id, Note.user_id == user.id))).scalar_one_or_none()
    if not note: raise HTTPException(404, "Note not found")
    note.content = req.content
    await db.commit()
    return {"success": True}


@notes_router.delete("/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    note = (await db.execute(select(Note).where(Note.id == note_id, Note.user_id == user.id))).scalar_one_or_none()
    if not note: raise HTTPException(404, "Note not found")
    await db.delete(note)
    await db.commit()
    return {"success": True}


@notes_router.get("/recent")
async def recent_activity(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Last 20 activity notes across all deals/contacts"""
    rows = (await db.execute(
        select(Note).where(Note.user_id == user.id).order_by(Note.created_at.desc()).limit(20)
    )).scalars().all()
    return {"success": True, "activity": [{
        "id": str(n.id), "content": n.content, "note_type": n.note_type,
        "deal_id": str(n.deal_id) if n.deal_id else None,
        "saved_lead_id": str(n.saved_lead_id) if n.saved_lead_id else None,
        "created_at": str(n.created_at),
    } for n in rows]}


# ═══ EMAIL TEMPLATES ══════════════════════════════════════════════════

class TemplateCreate(BaseModel):
    name: str
    subject: str
    body: str
    language: str = "en"

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None

@templates_router.post("/")
async def save_template(req: TemplateCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tmpl = EmailTemplate(
        user_id=user.id, name=req.name, subject=req.subject,
        body=req.body, language=req.language,
    )
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return {"success": True, "template": {
        "id": str(tmpl.id), "name": tmpl.name, "subject": tmpl.subject,
        "language": tmpl.language, "use_count": 0, "created_at": str(tmpl.created_at),
    }}


@templates_router.get("/")
async def list_templates(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(EmailTemplate).where(EmailTemplate.user_id == user.id).order_by(EmailTemplate.use_count.desc())
    )).scalars().all()
    return {"success": True, "templates": [{
        "id": str(t.id), "name": t.name, "subject": t.subject,
        "body": t.body, "language": t.language, "use_count": t.use_count,
        "created_at": str(t.created_at),
    } for t in rows]}


@templates_router.get("/{template_id}")
async def get_template(template_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = (await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id, EmailTemplate.user_id == user.id))).scalar_one_or_none()
    if not t: raise HTTPException(404, "Template not found")
    # Increment use count
    t.use_count += 1
    await db.commit()
    return {"success": True, "template": {
        "id": str(t.id), "name": t.name, "subject": t.subject,
        "body": t.body, "language": t.language, "use_count": t.use_count,
    }}


@templates_router.patch("/{template_id}")
async def update_template(template_id: str, req: TemplateUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = (await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id, EmailTemplate.user_id == user.id))).scalar_one_or_none()
    if not t: raise HTTPException(404, "Template not found")
    if req.name: t.name = req.name
    if req.subject: t.subject = req.subject
    if req.body: t.body = req.body
    await db.commit()
    return {"success": True}


@templates_router.delete("/{template_id}")
async def delete_template(template_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = (await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id, EmailTemplate.user_id == user.id))).scalar_one_or_none()
    if not t: raise HTTPException(404, "Template not found")
    await db.delete(t)
    await db.commit()
    return {"success": True}
