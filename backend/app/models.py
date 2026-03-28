"""Nanoneuron CRM MVP — Database Models"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def uid(): return uuid.uuid4()

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255))
    credits = Column(Integer, default=10)  # Only 10 free credits — software is precious
    plan = Column(String(50), default="trial")  # trial, starter, pro, business, blocked
    is_active = Column(Boolean, default=True)
    is_paid = Column(Boolean, default=False)  # Has this user EVER paid?
    trial_start = Column(DateTime, default=datetime.utcnow)
    trial_end = Column(DateTime)  # 7 days from signup
    payment_date = Column(DateTime, nullable=True)
    payment_amount = Column(Float, default=0)
    payment_currency = Column(String(5), default="USD")
    blocked_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Company(Base):
    __tablename__ = "companies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uid)
    domain = Column(String(255), unique=True, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100))
    country = Column(String(5))
    city = Column(String(100))
    employee_count = Column(String(50))
    revenue_range = Column(String(100))
    description = Column(Text)
    website = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class Lead(Base):
    __tablename__ = "leads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uid)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255), index=True)
    title = Column(String(200))
    department = Column(String(100))
    linkedin_url = Column(String(500))
    is_verified = Column(Boolean, default=False)
    confidence_score = Column(Integer, default=0)  # 0-100
    potential_earnings_inr = Column(Integer, default=25000)  # ₹ value of this lead
    source = Column(String(100))
    country = Column(String(5))
    phone = Column(String(50))
    is_enriched = Column(Boolean, default=False)
    enriched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SavedLead(Base):
    """Leads a user has unlocked/saved"""
    __tablename__ = "saved_leads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)
    company_name = Column(String(255))
    contact_name = Column(String(255))
    contact_email = Column(String(255))
    contact_title = Column(String(200))
    country = Column(String(5))
    status = Column(String(50), default="discovered")  # discovered, contacted, meeting, won, lost
    notes = Column(Text)
    deal_value = Column(Float, default=0)
    phone = Column(String(50))
    linkedin_url = Column(String(500))
    industry = Column(String(100))
    company_size = Column(String(50))
    lead_score = Column(Integer, default=0)
    last_contacted = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Deal(Base):
    __tablename__ = "deals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    saved_lead_id = Column(UUID(as_uuid=True), ForeignKey("saved_leads.id"), nullable=True)
    title = Column(String(255), nullable=False)
    value = Column(Float, default=0)
    currency = Column(String(5), default="USD")
    stage = Column(String(50), default="lead")  # lead, qualified, proposal, negotiation, won, lost
    country = Column(String(5))
    compliance_status = Column(String(50), default="unchecked")  # unchecked, compliant, action_needed
    compliance_notes = Column(Text)
    notes = Column(Text)
    follow_up_date = Column(DateTime, nullable=True)  # Next follow-up scheduled
    probability = Column(Integer, default=10)  # % chance of closing
    close_date = Column(DateTime, nullable=True)  # Expected close date
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Note(Base):
    """Activity notes on deals or contacts"""
    __tablename__ = "notes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id"), nullable=True, index=True)
    saved_lead_id = Column(UUID(as_uuid=True), ForeignKey("saved_leads.id"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    note_type = Column(String(50), default="note")  # note, call, email, meeting, task
    created_at = Column(DateTime, default=datetime.utcnow)

class EmailTemplate(Base):
    """Saved email templates"""
    __tablename__ = "email_templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(500))
    body = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    use_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
