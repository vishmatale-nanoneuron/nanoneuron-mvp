"""
═══════════════════════════════════════════════════════════════
Nanoneuron CRM — Full Claude AI Engine
Powered by claude-sonnet-4-6 (Anthropic)

Features:
  1.  Draft Email           — personalized outreach in any language
  2.  Email Sequence        — 3-step follow-up campaign
  3.  Deal Coach            — real-time deal strategy advice
  4.  Company Research      — sales intelligence brief
  5.  Proposal Writer       — full business proposal
  6.  Call Script           — phone outreach script
  7.  Objection Handler     — responses to any sales objection
  8.  Subject Lines         — 5 high-converting subject options
  9.  Translate             — any text → any language
  10. Meeting Prep          — pre-meeting intelligence brief
  11. LinkedIn Message      — personalized connection note
  12. Compliance Advisor    — country-specific compliance guidance
  13. Deal Scorer           — AI win probability + recommended actions
  14. Daily Brief           — AI summary of your pipeline
  15. Chat                  — streaming CRM-aware conversation
═══════════════════════════════════════════════════════════════
"""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models import User, Deal, SavedLead
from app.auth import get_current_user
from app.config import get_settings

settings = get_settings()
claude = APIRouter(prefix="/claude", tags=["Claude AI"])

MODEL = "claude-sonnet-4-6"

# ─── Core Claude caller ────────────────────────────────────────────────────────
async def ask_claude(system: str, prompt: str, max_tokens: int = 800) -> str:
    """Call Claude API. Falls back to structured template on error."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured. Add it to Railway environment variables.")
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        msg = await client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text
    except ImportError:
        # Fallback to httpx if anthropic package not installed
        import httpx
        async with httpx.AsyncClient(timeout=60) as http:
            r = await http.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": MODEL,
                    "max_tokens": max_tokens,
                    "system": system,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            if r.status_code == 200:
                return r.json()["content"][0]["text"]
            raise HTTPException(502, f"Claude API error: {r.status_code} {r.text}")
    except Exception as e:
        raise HTTPException(502, f"Claude API error: {str(e)}")


# ─── 1. Draft Email ────────────────────────────────────────────────────────────
class EmailReq(BaseModel):
    contact_name: str
    contact_title: str = ""
    company_name: str = ""
    language: str = "en"
    context: str = ""
    tone: str = "professional"   # professional, friendly, urgent, consultative

@claude.post("/draft-email")
async def draft_email(req: EmailReq, user: User = Depends(get_current_user)):
    lang_map = {"en":"English","ja":"Japanese","de":"German","hi":"Hindi",
                "fr":"French","es":"Spanish","pt":"Portuguese","ar":"Arabic","zh":"Chinese"}
    lang_name = lang_map.get(req.language, "English")

    result = await ask_claude(
        system=f"""You are an elite B2B sales copywriter. Write a {lang_name} cold outreach email.
Rules:
- Under 120 words
- {req.tone.capitalize()} tone
- Specific to their role and company
- One clear CTA (15-minute call)
- NO fluff, NO "I hope this finds you well"
- Sign off with the sender's name only
Output ONLY the email text, nothing else.""",
        prompt=f"Write to: {req.contact_name} ({req.contact_title}) at {req.company_name}\n"
               f"From: {user.name} ({user.company_name or 'Nanoneuron CRM'})\n"
               f"Context: {req.context or 'Cold outreach — our CRM helps B2B teams find leads in 15+ countries with auto-compliance'}",
        max_tokens=400,
    )
    return {"success": True, "engine": "claude-sonnet-4-6", "email": result,
            "language": req.language, "tone": req.tone}


# ─── 2. Email Sequence ─────────────────────────────────────────────────────────
class SequenceReq(BaseModel):
    contact_name: str
    contact_title: str = ""
    company_name: str = ""
    context: str = ""
    days: List[int] = [1, 4, 9]   # Send on day 1, 4, 9

@claude.post("/email-sequence")
async def email_sequence(req: SequenceReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are a B2B sales expert. Write a 3-email cold outreach sequence.
Format your response as valid JSON:
{
  "emails": [
    {"day": 1, "subject": "...", "body": "..."},
    {"day": 4, "subject": "...", "body": "..."},
    {"day": 9, "subject": "...", "body": "..."}
  ]
}
Rules: Each email under 100 words. Different angle per email. Day 1=value, Day 4=social proof, Day 9=final breakup.
Output ONLY valid JSON.""",
        prompt=f"Sequence for: {req.contact_name} ({req.contact_title}) at {req.company_name}\n"
               f"From: {user.name} at {user.company_name or 'Nanoneuron'}\n"
               f"Context: {req.context or 'B2B CRM for global lead discovery + compliance'}",
        max_tokens=800,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result,
                "emails": [{"day": d, "subject": "Follow-up", "body": result} for d in req.days]}


# ─── 3. Deal Coach ─────────────────────────────────────────────────────────────
COUNTRY_CULTURE = {
    "US": {"name":"United States","style":"Direct, data-driven, ROI-focused. Get to the point fast.","best_days":"Tue–Thu","best_time":"10am–12pm EST","lang":"English","compliance":"CCPA","tip":"Lead with ROI numbers. Americans decide fast — don't over-nurture."},
    "GB": {"name":"United Kingdom","style":"Formal but understated. Relationship matters. Avoid hard sell.","best_days":"Tue–Thu","best_time":"10am–12pm GMT","lang":"English","compliance":"UK GDPR","tip":"Be patient — UK deals take 2-3x longer than US. Understatement is valued."},
    "DE": {"name":"Germany","style":"Technical, process-driven, formal. Titles matter (Dr./Prof.).","best_days":"Tue–Thu","best_time":"9am–11am CET","lang":"German preferred","compliance":"EU GDPR + BDSG","tip":"Send a formal written Angebot (proposal). Germans don't buy without seeing specs."},
    "FR": {"name":"France","style":"Hierarchical, relationship-first. Decision maker is rarely your first contact.","best_days":"Tue–Wed","best_time":"10am–12pm CET","lang":"French preferred","compliance":"EU GDPR + CNIL","tip":"Avoid August (everyone on holiday). Find the real decision maker — usually 2 levels up."},
    "IN": {"name":"India","style":"Relationship-first, price-sensitive, negotiation expected.","best_days":"Mon–Fri","best_time":"11am–1pm IST","lang":"English/Hindi","compliance":"DPDP Act 2023","tip":"Build personal rapport first. Price negotiation is expected — build margin in your initial quote."},
    "JP": {"name":"Japan","style":"Consensus-driven, formal, long cycles. Never rush. Meishi (card exchange) matters.","best_days":"Tue–Thu","best_time":"10am–12pm JST","lang":"Japanese required","compliance":"APPI","tip":"Decisions require consensus from many levels. Expect 6-12 month cycles. Patience wins."},
    "AE": {"name":"UAE","style":"Relationship and face-time critical. Hierarchy respected. Avoid Ramadan period.","best_days":"Mon–Thu","best_time":"10am–12pm GST","lang":"Arabic/English","compliance":"DIFC-DP","tip":"Meet in person if possible. Business over coffee/lunch is normal. Friday is weekend."},
    "SG": {"name":"Singapore","style":"English-speaking, fast decisions, global mindset. Very professional.","best_days":"Tue–Thu","best_time":"10am–12pm SGT","lang":"English","compliance":"PDPA","tip":"Singapore is the fastest-closing market in Asia. Be crisp, professional, and data-backed."},
    "AU": {"name":"Australia","style":"Informal, direct, no-nonsense. Tall poppy syndrome — don't oversell.","best_days":"Tue–Thu","best_time":"10am–12pm AEST","lang":"English","compliance":"Privacy Act 1988","tip":"Be genuine and direct. Australians distrust heavy sales tactics. Let the product speak."},
    "CA": {"name":"Canada","style":"Similar to US but more formal. Bilingual in Quebec — French matters there.","best_days":"Tue–Thu","best_time":"10am–12pm EST","lang":"English/French","compliance":"PIPEDA","tip":"Very similar to US approach. Quebec clients prefer French communication."},
    "BR": {"name":"Brazil","style":"Warm, relationship-driven, festive. Personal connection before business.","best_days":"Tue–Thu","best_time":"10am–12pm BRT","lang":"Portuguese required","compliance":"LGPD","tip":"Never rush to business. Ask about family, football. Warm personal bond closes Brazilian deals."},
    "KR": {"name":"South Korea","style":"Hierarchical, fast-moving once trust is built. Samsung/Kakao ecosystem.","best_days":"Mon–Fri","best_time":"9am–11am KST","lang":"Korean preferred","compliance":"PIPA","tip":"Respect hierarchy strictly. Once a senior person is on board, the deal moves very fast."},
    "ZA": {"name":"South Africa","style":"Ubuntu philosophy — community focus. English widely spoken. Relationship first.","best_days":"Tue–Thu","best_time":"9am–11am SAST","lang":"English","compliance":"POPIA","tip":"Reference your community/social impact angle. Ubuntu = 'I am because we are'."},
    "SA": {"name":"Saudi Arabia","style":"Vision 2030 driven. Formal, Arabic first. Government relationships matter.","best_days":"Mon–Thu","best_time":"10am–12pm AST","lang":"Arabic preferred","compliance":"PDPL","tip":"Vision 2030 is a massive buying trigger. Everything is being modernised — position around transformation."},
    "NL": {"name":"Netherlands","style":"Direct, consensus-driven, sustainability-focused. Very English-friendly.","best_days":"Tue–Thu","best_time":"9am–11am CET","lang":"English fine","compliance":"EU GDPR","tip":"Dutch are the most direct in Europe — say what you mean. They appreciate honesty over politeness."},
    "SE": {"name":"Sweden","style":"Flat hierarchy, consensus, sustainability lens on every decision.","best_days":"Tue–Thu","best_time":"9am–11am CET","lang":"English fine","compliance":"EU GDPR","tip":"Sustainability credentials matter to Swedish buyers. Flat structure means anyone can say no."},
    "IL": {"name":"Israel","style":"Direct, startup culture, move fast. Chutzpah is respected.","best_days":"Sun–Thu","best_time":"9am–11am IST","lang":"English/Hebrew","compliance":"Privacy Protection Law","tip":"Israelis appreciate boldness. Don't be shy about your product's strengths. Sunday is a workday."},
    "CN": {"name":"China","style":"Guanxi (relationships) + price competition. Government connections matter.","best_days":"Tue–Thu","best_time":"10am–12pm CST","lang":"Chinese required","compliance":"PIPL","tip":"Guanxi (relationship network) is everything. Find a local partner/introducer. Price pressure will be extreme."},
}

class DealCoachReq(BaseModel):
    deal_title: str
    deal_value: float = 0
    stage: str = "lead"
    country: str = "US"
    notes: str = ""
    contact_title: str = ""
    days_in_stage: int = 0
    company_name: str = ""
    industry: str = ""

@claude.post("/deal-coach")
async def deal_coach(req: DealCoachReq, user: User = Depends(get_current_user)):
    culture = COUNTRY_CULTURE.get(req.country.upper(), COUNTRY_CULTURE["US"])

    result = await ask_claude(
        system=f"""You are an elite global B2B sales coach specialising in deals with {culture['name']}.
You know this country's business culture deeply: {culture['style']}
Compliance requirement: {culture['compliance']}
Language preference: {culture['lang']}
Best contact time: {culture['best_days']}, {culture['best_time']}
Key cultural tip: {culture['tip']}

Analyse this deal and give sharp, specific, actionable advice tailored to {culture['name']} business culture.
Format as JSON exactly:
{{
  "win_probability": 65,
  "deal_health": "green",
  "stage_assessment": "On track",
  "immediate_action": "The single most important thing to do TODAY — be very specific",
  "next_steps": ["specific step 1", "specific step 2", "specific step 3"],
  "country_insight": "One critical cultural fact about selling in {culture['name']} that will change your approach",
  "talk_track": "Exact words to say on the next call — 2-3 sentences tailored to {culture['name']} culture",
  "compliance_alert": "Key compliance point for {culture['compliance']} relevant to this deal",
  "best_contact_time": "{culture['best_days']}, {culture['best_time']}",
  "red_flags": ["flag if any, or empty list"],
  "top_risk": "Biggest risk to this deal right now"
}}
Be brutally honest and hyper-specific. Output ONLY valid JSON.""",
        prompt=f"Deal: {req.deal_title}\n"
               f"Company: {req.company_name or 'Unknown'} | Industry: {req.industry or 'Unknown'}\n"
               f"Value: ${req.deal_value:,.0f} | Stage: {req.stage} | Days in stage: {req.days_in_stage}\n"
               f"Country: {req.country} | Contact: {req.contact_title or 'Unknown'}\n"
               f"Notes: {req.notes or 'No notes yet'}\n"
               f"Seller: {user.name} from {user.company_name or 'Nanoneuron Services'}",
        max_tokens=800,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6",
                "country_name": culture["name"], "country_flag": "",
                "best_contact_time": culture["best_days"]+" · "+culture["best_time"],
                "compliance": culture["compliance"], **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 4. Company Research ───────────────────────────────────────────────────────
class CompanyReq(BaseModel):
    company_name: str
    domain: str = ""
    industry: str = ""
    country: str = ""
    employees: str = ""
    revenue: str = ""

@claude.post("/company-research")
async def company_research(req: CompanyReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are a B2B sales intelligence analyst. Write a sales intelligence brief.
Format as JSON:
{
  "summary": "2-sentence company overview",
  "likely_pain_points": ["pain1", "pain2", "pain3"],
  "buying_triggers": ["trigger1", "trigger2"],
  "decision_makers": ["Who to target and why"],
  "competitor_angle": "What competitors they likely use and how to position",
  "opening_line": "The perfect first sentence for a cold email to this company",
  "value_props": ["Most relevant value prop for this company"],
  "risk": "One sentence on why they might not buy"
}
Output ONLY valid JSON.""",
        prompt=f"Company: {req.company_name} ({req.domain})\n"
               f"Industry: {req.industry} | Country: {req.country}\n"
               f"Size: {req.employees} employees | Revenue: {req.revenue}\n"
               f"Our product: Nanoneuron CRM — global B2B lead discovery + deal pipeline + auto-compliance",
        max_tokens=700,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", "company": req.company_name, **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 5. Proposal Writer ────────────────────────────────────────────────────────
class ProposalReq(BaseModel):
    company_name: str
    contact_name: str
    contact_title: str = ""
    plan: str = "Pro"
    price_usd: float = 199
    context: str = ""

@claude.post("/proposal")
async def write_proposal(req: ProposalReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are a B2B SaaS account executive writing a sales proposal.
Write a professional, persuasive proposal in Markdown format.
Sections: Executive Summary | The Challenge | Our Solution | Key Benefits | Investment | Next Steps
Keep it concise (under 400 words). Be specific about ROI.""",
        prompt=f"Proposal for: {req.company_name}\nAttn: {req.contact_name} ({req.contact_title})\n"
               f"Recommended Plan: {req.plan} — ${req.price_usd}/month\n"
               f"From: {user.name}, {user.company_name or 'Nanoneuron'}\n"
               f"Context: {req.context or 'International B2B lead generation and compliance management'}",
        max_tokens=1000,
    )
    return {"success": True, "engine": "claude-sonnet-4-6", "proposal": result,
            "company": req.company_name, "plan": req.plan}


# ─── 6. Call Script ────────────────────────────────────────────────────────────
class CallScriptReq(BaseModel):
    contact_name: str
    contact_title: str = ""
    company_name: str = ""
    objective: str = "book a demo"
    notes: str = ""

@claude.post("/call-script")
async def call_script(req: CallScriptReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are a top B2B sales trainer. Write a natural-sounding phone call script.
Format as JSON:
{
  "opener": "First 2 sentences to say",
  "value_pitch": "20-second value proposition",
  "qualifying_questions": ["Q1", "Q2", "Q3"],
  "objection_responses": {
    "not interested": "...",
    "send me an email": "...",
    "no budget": "...",
    "using a competitor": "..."
  },
  "close": "How to end the call and get the next step",
  "voicemail": "30-second voicemail script"
}
Sound natural, not robotic. Output ONLY valid JSON.""",
        prompt=f"Calling: {req.contact_name} ({req.contact_title}) at {req.company_name}\n"
               f"Objective: {req.objective}\nCaller: {user.name}\n"
               f"Notes: {req.notes or 'Cold call — selling Nanoneuron CRM for global B2B lead discovery'}",
        max_tokens=800,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 7. Objection Handler ──────────────────────────────────────────────────────
class ObjectionReq(BaseModel):
    objection: str
    contact_title: str = ""
    deal_stage: str = "lead"
    context: str = ""

@claude.post("/objection-handler")
async def handle_objection(req: ObjectionReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are a master B2B sales closer. Handle the objection brilliantly.
Format as JSON:
{
  "acknowledge": "1 sentence to show you heard them",
  "reframe": "Reframe the objection into an opportunity",
  "response": "Your full response (3-5 sentences)",
  "follow_up_question": "Question to re-engage them",
  "email_version": "Email-friendly version of this response",
  "is_deal_killer": false,
  "win_probability_impact": -10
}
Output ONLY valid JSON.""",
        prompt=f"Objection: \"{req.objection}\"\n"
               f"Contact: {req.contact_title} | Stage: {req.deal_stage}\n"
               f"Context: {req.context or 'B2B CRM — global lead discovery + compliance'}",
        max_tokens=600,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", "objection": req.objection, **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 8. Subject Lines ─────────────────────────────────────────────────────────
class SubjectReq(BaseModel):
    contact_name: str
    contact_title: str = ""
    company_name: str = ""
    angle: str = ""   # e.g. "ROI", "curiosity", "pain point"

@claude.post("/subject-lines")
async def subject_lines(req: SubjectReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are a B2B email marketing expert. Generate 5 high-converting email subject lines.
Format as JSON:
{
  "subjects": [
    {"line": "Subject here", "type": "curiosity|ROI|pain|social_proof|direct", "open_rate": "high|medium"},
    ...
  ],
  "best_pick": 0
}
Rules: Under 50 chars each. No spam words. Personalized where possible. Output ONLY valid JSON.""",
        prompt=f"For: {req.contact_name} ({req.contact_title}) at {req.company_name}\n"
               f"Angle: {req.angle or 'B2B lead discovery and compliance automation'}\n"
               f"Product: Nanoneuron CRM — global B2B intelligence platform",
        max_tokens=500,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 9. Translate ─────────────────────────────────────────────────────────────
class TranslateReq(BaseModel):
    text: str
    target_language: str
    preserve_tone: bool = True

@claude.post("/translate")
async def translate_text(req: TranslateReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system=f"""You are a professional B2B translator. Translate the text to {req.target_language}.
{"Preserve the exact tone and intent." if req.preserve_tone else "Adapt for local business culture."}
Output ONLY the translated text, nothing else.""",
        prompt=req.text,
        max_tokens=1000,
    )
    return {"success": True, "engine": "claude-sonnet-4-6",
            "original": req.text, "translated": result, "language": req.target_language}


# ─── 10. Meeting Prep ─────────────────────────────────────────────────────────
class MeetingPrepReq(BaseModel):
    contact_name: str
    contact_title: str = ""
    company_name: str = ""
    meeting_type: str = "discovery"   # discovery, demo, proposal, negotiation, closing
    deal_value: float = 0
    notes: str = ""

@claude.post("/meeting-prep")
async def meeting_prep(req: MeetingPrepReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are an elite B2B sales coach preparing a seller for an important meeting.
Format as JSON:
{
  "opening": "How to start the meeting (first 60 seconds)",
  "discovery_questions": ["Q1", "Q2", "Q3", "Q4"],
  "demo_highlights": ["Feature to emphasize and why"],
  "anticipated_objections": ["objection and how to handle"],
  "success_criteria": "How to know if the meeting went well",
  "closing_move": "How to end the meeting with a clear next step",
  "things_to_research": ["What to Google before the meeting"],
  "power_phrases": ["High-impact phrases to use"],
  "dos": ["Do this"],
  "donts": ["Never do this"]
}
Output ONLY valid JSON.""",
        prompt=f"Meeting with: {req.contact_name} ({req.contact_title}) at {req.company_name}\n"
               f"Type: {req.meeting_type} | Deal value: ${req.deal_value:,.0f}\n"
               f"Notes: {req.notes or 'No notes'}",
        max_tokens=900,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", "meeting_type": req.meeting_type, **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 11. LinkedIn Message ─────────────────────────────────────────────────────
class LinkedInReq(BaseModel):
    contact_name: str
    contact_title: str = ""
    company_name: str = ""
    mutual_context: str = ""
    message_type: str = "connection"   # connection, follow-up, inmail

@claude.post("/linkedin-message")
async def linkedin_message(req: LinkedInReq, user: User = Depends(get_current_user)):
    limit = 300 if req.message_type == "connection" else 1900
    result = await ask_claude(
        system=f"""You are a LinkedIn outreach expert. Write a {req.message_type} message.
Rules:
- Under {limit} characters
- No "I came across your profile"
- Mention something specific about them or their company
- One clear ask
- Genuine, not salesy
Output ONLY the message text.""",
        prompt=f"To: {req.contact_name} ({req.contact_title}) at {req.company_name}\n"
               f"From: {user.name}\nMutual context: {req.mutual_context or 'No mutual connection'}\n"
               f"Goal: Introduce Nanoneuron CRM — B2B intelligence platform",
        max_tokens=300,
    )
    return {"success": True, "engine": "claude-sonnet-4-6", "message": result,
            "char_count": len(result), "limit": limit}


# ─── 12. Compliance Advisor ───────────────────────────────────────────────────
class ComplianceReq(BaseModel):
    country: str
    scenario: str
    industry: str = ""

@claude.post("/compliance-advice")
async def compliance_advice(req: ComplianceReq, user: User = Depends(get_current_user)):
    result = await ask_claude(
        system="""You are a B2B data privacy and compliance expert. Give practical advice.
Format as JSON:
{
  "applicable_law": "Law name",
  "risk_level": "low|medium|high|critical",
  "summary": "2-sentence plain English summary",
  "requirements": ["Requirement 1", "Requirement 2"],
  "what_you_can_do": ["Allowed action 1"],
  "what_you_must_avoid": ["Prohibited action 1"],
  "consent_needed": true,
  "data_residency_required": false,
  "recommended_action": "The single most important thing to do RIGHT NOW",
  "disclaimer": "Always consult a qualified legal professional for binding advice."
}
Output ONLY valid JSON.""",
        prompt=f"Country: {req.country}\nIndustry: {req.industry or 'B2B SaaS'}\n"
               f"Scenario: {req.scenario}",
        max_tokens=700,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", "country": req.country, **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 13. Deal Scorer ──────────────────────────────────────────────────────────
@claude.get("/score-deals")
async def score_all_deals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """AI scores all your deals and surfaces the top opportunities."""
    r = await db.execute(
        select(Deal).where(Deal.user_id == user.id, Deal.stage.notin_(["won","lost"]))
        .order_by(desc(Deal.value))
        .limit(10)
    )
    deals = r.scalars().all()
    if not deals:
        return {"success": True, "message": "No active deals to score.", "deals": []}

    deals_text = "\n".join([
        f"- {d.title} | ${d.value:,.0f} | {d.stage} | {d.country} | {d.compliance_status}"
        for d in deals
    ])

    result = await ask_claude(
        system="""You are a revenue intelligence AI. Score each deal and prioritize them.
Format as JSON:
{
  "scored_deals": [
    {
      "title": "Deal title",
      "win_probability": 70,
      "urgency": "high|medium|low",
      "recommended_action": "What to do next",
      "health": "green|yellow|red"
    }
  ],
  "top_priority": "Title of deal to focus on TODAY",
  "pipeline_health": "Overall assessment in 1 sentence",
  "revenue_at_risk": "Deals that might be lost and why"
}
Output ONLY valid JSON.""",
        prompt=f"Active deals:\n{deals_text}",
        max_tokens=800,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6", "total_deals": len(deals), **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 14. Daily Brief ──────────────────────────────────────────────────────────
@claude.get("/daily-brief")
async def daily_brief(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """AI-generated morning brief of your CRM status."""
    today = datetime.utcnow().strftime("%A, %B %d, %Y")

    total_deals = (await db.execute(select(func.count()).where(Deal.user_id == user.id))).scalar() or 0
    pipeline_val = (await db.execute(
        select(func.sum(Deal.value)).where(Deal.user_id == user.id, Deal.stage.notin_(["lost"]))
    )).scalar() or 0
    won = (await db.execute(select(func.count()).where(Deal.user_id == user.id, Deal.stage == "won"))).scalar() or 0
    hot = (await db.execute(select(func.count()).where(
        Deal.user_id == user.id, Deal.stage.in_(["proposal","negotiation"])
    ))).scalar() or 0
    contacts = (await db.execute(select(func.count()).where(SavedLead.user_id == user.id))).scalar() or 0

    result = await ask_claude(
        system=f"""You are {user.name}'s personal sales AI assistant. Write their morning CRM brief.
Format as JSON:
{{
  "greeting": "Energetic good morning message personalized to them",
  "headline": "One-sentence summary of their pipeline situation",
  "focus_today": ["Top 3 things to do TODAY"],
  "insight": "One sharp sales insight or tip for today",
  "motivation": "One sentence of genuine motivation",
  "date": "{today}"
}}
Be specific, energetic, and actionable. Output ONLY valid JSON.""",
        prompt=f"User: {user.name} | Company: {user.company_name or 'their company'}\n"
               f"Date: {today}\n"
               f"CRM Stats: {total_deals} deals | ${pipeline_val:,.0f} pipeline | "
               f"{won} won | {hot} hot deals | {contacts} contacts | {user.credits} credits left",
        max_tokens=500,
    )
    try:
        data = json.loads(result)
        return {"success": True, "engine": "claude-sonnet-4-6",
                "stats": {"total_deals": total_deals, "pipeline_value": float(pipeline_val),
                          "won": won, "hot": hot, "contacts": contacts, "credits": user.credits},
                **data}
    except:
        return {"success": True, "engine": "claude-sonnet-4-6", "raw": result}


# ─── 15. Chat (Streaming) ─────────────────────────────────────────────────────
class ChatReq(BaseModel):
    message: str
    history: List[dict] = []   # [{"role": "user"|"assistant", "content": "..."}]

@claude.post("/chat")
async def chat_stream(req: ChatReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Streaming CRM-aware chat with Claude."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured.")

    # Fetch live CRM context
    total_deals = (await db.execute(select(func.count()).where(Deal.user_id == user.id))).scalar() or 0
    pipeline_val = (await db.execute(
        select(func.sum(Deal.value)).where(Deal.user_id == user.id, Deal.stage.notin_(["lost"]))
    )).scalar() or 0
    contacts = (await db.execute(select(func.count()).where(SavedLead.user_id == user.id))).scalar() or 0

    system_prompt = f"""You are an expert B2B sales AI assistant embedded in Nanoneuron CRM.
You have full context about the user's CRM:
- User: {user.name} ({user.email})
- Company: {user.company_name or 'Not set'}
- Active deals: {total_deals} | Pipeline: ${pipeline_val:,.0f}
- Contacts saved: {contacts}
- Credits: {user.credits}
- Plan: {user.plan}

Your expertise: B2B sales strategy, lead generation, deal negotiation, compliance (GDPR/CCPA/DPDPA/LGPD),
email copywriting, pricing strategy, objection handling, pipeline management.

Be concise, sharp, and actionable. Use markdown for formatting. If they ask you to draft anything,
do it immediately — don't ask for more info unless absolutely necessary."""

    messages = [{"role": m["role"], "content": m["content"]} for m in req.history[-10:]]
    messages.append({"role": "user", "content": req.message})

    async def stream_response():
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            async with client.messages.stream(
                model=MODEL,
                max_tokens=1500,
                system=system_prompt,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except ImportError:
            # Non-streaming fallback via httpx
            import httpx
            async with httpx.AsyncClient(timeout=60) as http:
                r = await http.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": settings.ANTHROPIC_API_KEY,
                             "anthropic-version": "2023-06-01", "content-type": "application/json"},
                    json={"model": MODEL, "max_tokens": 1500,
                          "system": system_prompt, "messages": messages},
                )
                if r.status_code == 200:
                    text = r.json()["content"][0]["text"]
                    yield f"data: {json.dumps({'text': text})}\n\n"
                    yield "data: [DONE]\n\n"
                else:
                    yield f"data: {json.dumps({'error': f'API error {r.status_code}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
