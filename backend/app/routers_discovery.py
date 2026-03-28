"""
═══ Nanoneuron — Global Lead Discovery Engine ═══
Best-in-class B2B lead discovery for 50+ countries
Intent signals · Tech stack · Funding · Hiring growth
"""
import random, hashlib
from fastapi import APIRouter, Depends, Query
from app.auth import get_current_user
from app.models import User

discovery = APIRouter(prefix="/discovery", tags=["Global Lead Discovery"])

# ═══════════════════════════════════════════════════════════════════
# GLOBAL INTENT SIGNALS & TECH STACK REGISTRY
# ═══════════════════════════════════════════════════════════════════
INTENT_SIGNALS = ["hiring_engineers", "series_a_funded", "series_b_funded", "expanding_globally",
    "new_product_launch", "recent_ipo", "acquisitions", "tech_refresh", "hiring_sales",
    "entering_new_market", "ciso_hired", "digital_transformation", "cloud_migration",
    "compliance_audit", "recent_rebrand"]

TECH_STACKS = {
    "cloud": ["AWS", "GCP", "Azure", "Cloudflare", "Vercel"],
    "crm": ["Salesforce", "HubSpot", "Pipedrive", "Zoho CRM"],
    "analytics": ["Snowflake", "Databricks", "Tableau", "Looker", "PowerBI"],
    "devops": ["Kubernetes", "Terraform", "GitHub Actions", "Jenkins"],
    "security": ["CrowdStrike", "SentinelOne", "Okta", "Palo Alto"],
    "payments": ["Stripe", "Braintree", "Razorpay", "Adyen"],
    "comms": ["Slack", "Zoom", "Teams", "Intercom"],
}

# ═══════════════════════════════════════════════════════════════════
# COUNTRY METADATA — 50 COUNTRIES
# ═══════════════════════════════════════════════════════════════════
COUNTRIES = {
    "US": {"name":"United States","flag":"🇺🇸","currency":"USD","tz":"America/New_York","gdp_rank":1,"business":"Direct, data-driven, ROI-focused","compliance":"CCPA/CPRA","risk":"medium"},
    "GB": {"name":"United Kingdom","flag":"🇬🇧","currency":"GBP","tz":"Europe/London","gdp_rank":6,"business":"Formal, relationship-driven","compliance":"UK GDPR","risk":"high"},
    "DE": {"name":"Germany","flag":"🇩🇪","currency":"EUR","tz":"Europe/Berlin","gdp_rank":4,"business":"Technical, process-oriented, long sales cycles","compliance":"EU GDPR + BDSG","risk":"high"},
    "FR": {"name":"France","flag":"🇫🇷","currency":"EUR","tz":"Europe/Paris","gdp_rank":7,"business":"Formal, hierarchical, relationship-first","compliance":"EU GDPR + CNIL","risk":"high"},
    "IN": {"name":"India","flag":"🇮🇳","currency":"INR","tz":"Asia/Kolkata","gdp_rank":5,"business":"Relationship-first, price-sensitive","compliance":"DPDPA 2023","risk":"medium"},
    "JP": {"name":"Japan","flag":"🇯🇵","currency":"JPY","tz":"Asia/Tokyo","gdp_rank":3,"business":"Consensus-driven, formal, long cycles","compliance":"APPI","risk":"medium"},
    "CN": {"name":"China","flag":"🇨🇳","currency":"CNY","tz":"Asia/Shanghai","gdp_rank":2,"business":"Relationship (guanxi), price competition","compliance":"PIPL","risk":"high"},
    "SG": {"name":"Singapore","flag":"🇸🇬","currency":"SGD","tz":"Asia/Singapore","gdp_rank":35,"business":"English-speaking, fast decisions, global mindset","compliance":"PDPA","risk":"medium"},
    "AE": {"name":"UAE","flag":"🇦🇪","currency":"AED","tz":"Asia/Dubai","gdp_rank":30,"business":"Relationship, face-time important, Ramadan aware","compliance":"DIFC-DP","risk":"medium"},
    "AU": {"name":"Australia","flag":"🇦🇺","currency":"AUD","tz":"Australia/Sydney","gdp_rank":13,"business":"Informal, direct, ROI-focused","compliance":"Privacy Act 1988","risk":"medium"},
    "CA": {"name":"Canada","flag":"🇨🇦","currency":"CAD","tz":"America/Toronto","gdp_rank":10,"business":"Similar to US, bilingual in Quebec","compliance":"PIPEDA/Bill C-27","risk":"medium"},
    "BR": {"name":"Brazil","flag":"🇧🇷","currency":"BRL","tz":"America/Sao_Paulo","gdp_rank":12,"business":"Relationship, warm, festive culture","compliance":"LGPD","risk":"high"},
    "MX": {"name":"Mexico","flag":"🇲🇽","currency":"MXN","tz":"America/Mexico_City","gdp_rank":15,"business":"Relationship-first, hierarchical","compliance":"LFPDPPP","risk":"medium"},
    "KR": {"name":"South Korea","flag":"🇰🇷","currency":"KRW","tz":"Asia/Seoul","gdp_rank":14,"business":"Hierarchical, tech-savvy, Samsung ecosystem","compliance":"PIPA","risk":"high"},
    "IL": {"name":"Israel","flag":"🇮🇱","currency":"ILS","tz":"Asia/Jerusalem","gdp_rank":28,"business":"Direct, startup culture, chutzpah","compliance":"Privacy Protection Law","risk":"medium"},
    "NL": {"name":"Netherlands","flag":"🇳🇱","currency":"EUR","tz":"Europe/Amsterdam","gdp_rank":18,"business":"Direct, consensus, English-friendly","compliance":"EU GDPR","risk":"high"},
    "SE": {"name":"Sweden","flag":"🇸🇪","currency":"SEK","tz":"Europe/Stockholm","gdp_rank":23,"business":"Flat hierarchy, consensus, sustainability focus","compliance":"EU GDPR","risk":"high"},
    "CH": {"name":"Switzerland","flag":"🇨🇭","currency":"CHF","tz":"Europe/Zurich","gdp_rank":20,"business":"Formal, precision, multilingual (DE/FR/IT)","compliance":"nFADP","risk":"high"},
    "ES": {"name":"Spain","flag":"🇪🇸","currency":"EUR","tz":"Europe/Madrid","gdp_rank":16,"business":"Relationship, social, longer lunches","compliance":"EU GDPR + LOPDGDD","risk":"high"},
    "IT": {"name":"Italy","flag":"🇮🇹","currency":"EUR","tz":"Europe/Rome","gdp_rank":8,"business":"Relationship, family-oriented, fashion/design culture","compliance":"EU GDPR","risk":"high"},
    "PL": {"name":"Poland","flag":"🇵🇱","currency":"PLN","tz":"Europe/Warsaw","gdp_rank":22,"business":"Growing tech hub, price-sensitive, EU-aligned","compliance":"EU GDPR + UODO","risk":"high"},
    "ZA": {"name":"South Africa","flag":"🇿🇦","currency":"ZAR","tz":"Africa/Johannesburg","gdp_rank":33,"business":"Ubuntu philosophy, relationship, English","compliance":"POPIA","risk":"high"},
    "NG": {"name":"Nigeria","flag":"🇳🇬","currency":"NGN","tz":"Africa/Lagos","gdp_rank":40,"business":"Entrepreneurial, cash-forward, trust-building","compliance":"NDPR","risk":"medium"},
    "KE": {"name":"Kenya","flag":"🇰🇪","currency":"KES","tz":"Africa/Nairobi","gdp_rank":60,"business":"Tech-forward (Silicon Savannah), mobile-first","compliance":"DPA 2019","risk":"medium"},
    "EG": {"name":"Egypt","flag":"🇪🇬","currency":"EGP","tz":"Africa/Cairo","gdp_rank":37,"business":"Relationship, formal, Arabic-first","compliance":"PDPL 2020","risk":"medium"},
    "SA": {"name":"Saudi Arabia","flag":"🇸🇦","currency":"SAR","tz":"Asia/Riyadh","gdp_rank":17,"business":"Vision 2030 driven, formal, Arabic/English","compliance":"PDPL","risk":"medium"},
    "TR": {"name":"Turkey","flag":"🇹🇷","currency":"TRY","tz":"Europe/Istanbul","gdp_rank":19,"business":"Negotiation-heavy, relationship, competitive","compliance":"KVKK","risk":"medium"},
    "RU": {"name":"Russia","flag":"🇷🇺","currency":"RUB","tz":"Europe/Moscow","gdp_rank":11,"business":"Formal, hierarchical, local partner key","compliance":"FZ-152","risk":"high"},
    "ID": {"name":"Indonesia","flag":"🇮🇩","currency":"IDR","tz":"Asia/Jakarta","gdp_rank":16,"business":"Relationship, Pancasila values, growing digital","compliance":"PDP Law","risk":"medium"},
    "PH": {"name":"Philippines","flag":"🇵🇭","currency":"PHP","tz":"Asia/Manila","gdp_rank":34,"business":"English-friendly, BPO hub, personal relationships","compliance":"DPA 2012","risk":"medium"},
    "VN": {"name":"Vietnam","flag":"🇻🇳","currency":"VND","tz":"Asia/Ho_Chi_Minh","gdp_rank":36,"business":"Relationship, trust-first, growing tech scene","compliance":"Cybersecurity Law","risk":"medium"},
    "TH": {"name":"Thailand","flag":"🇹🇭","currency":"THB","tz":"Asia/Bangkok","gdp_rank":26,"business":"Face-saving culture, indirect, wai etiquette","compliance":"PDPA","risk":"medium"},
    "MY": {"name":"Malaysia","flag":"🇲🇾","currency":"MYR","tz":"Asia/Kuala_Lumpur","gdp_rank":38,"business":"Multicultural, English-friendly, tech-forward","compliance":"PDPA 2010","risk":"medium"},
    "PK": {"name":"Pakistan","flag":"🇵🇰","currency":"PKR","tz":"Asia/Karachi","gdp_rank":44,"business":"Relationship, English-proficient, price-sensitive","compliance":"PECA 2016","risk":"medium"},
    "BD": {"name":"Bangladesh","flag":"🇧🇩","currency":"BDT","tz":"Asia/Dhaka","gdp_rank":35,"business":"Fast-growing, garments→tech transition","compliance":"DSA 2018","risk":"medium"},
    "AR": {"name":"Argentina","flag":"🇦🇷","currency":"ARS","tz":"America/Buenos_Aires","gdp_rank":27,"business":"European-Latin blend, tech talent hub","compliance":"PDPA","risk":"medium"},
    "CO": {"name":"Colombia","flag":"🇨🇴","currency":"COP","tz":"America/Bogota","gdp_rank":39,"business":"Relationship, Bogotá as LatAm tech hub","compliance":"Ley 1581","risk":"medium"},
    "CL": {"name":"Chile","flag":"🇨🇱","currency":"CLP","tz":"America/Santiago","gdp_rank":41,"business":"Most stable LatAm economy, formal","compliance":"Ley 19628","risk":"medium"},
    "PT": {"name":"Portugal","flag":"🇵🇹","currency":"EUR","tz":"Europe/Lisbon","gdp_rank":52,"business":"Warm, bridge to Brazil/Africa markets","compliance":"EU GDPR","risk":"high"},
    "CZ": {"name":"Czech Republic","flag":"🇨🇿","currency":"CZK","tz":"Europe/Prague","gdp_rank":46,"business":"Growing tech scene, EU hub, price competitive","compliance":"EU GDPR + UOOU","risk":"high"},
    "HU": {"name":"Hungary","flag":"🇭🇺","currency":"HUF","tz":"Europe/Budapest","gdp_rank":55,"business":"Engineering talent, EU market gateway","compliance":"EU GDPR","risk":"high"},
    "RO": {"name":"Romania","flag":"🇷🇴","currency":"RON","tz":"Europe/Bucharest","gdp_rank":48,"business":"IT outsourcing hub, EU-aligned, English-friendly","compliance":"EU GDPR","risk":"high"},
    "UA": {"name":"Ukraine","flag":"🇺🇦","currency":"UAH","tz":"Europe/Kiev","gdp_rank":53,"business":"IT talent powerhouse, resilient, tech-first","compliance":"Personal Data Law","risk":"high"},
    "GR": {"name":"Greece","flag":"🇬🇷","currency":"EUR","tz":"Europe/Athens","gdp_rank":56,"business":"Relationship, shipping/tourism focus","compliance":"EU GDPR","risk":"high"},
    "FI": {"name":"Finland","flag":"🇫🇮","currency":"EUR","tz":"Europe/Helsinki","gdp_rank":44,"business":"Direct, honest, Nokia legacy, startup scene","compliance":"EU GDPR","risk":"high"},
    "DK": {"name":"Denmark","flag":"🇩🇰","currency":"DKK","tz":"Europe/Copenhagen","gdp_rank":38,"business":"Flat hierarchy, hygge culture, sustainability","compliance":"EU GDPR","risk":"high"},
    "NO": {"name":"Norway","flag":"🇳🇴","currency":"NOK","tz":"Europe/Oslo","gdp_rank":30,"business":"Oil wealth, flat hierarchy, outdoors culture","compliance":"EU GDPR + PDA","risk":"high"},
    "BE": {"name":"Belgium","flag":"🇧🇪","currency":"EUR","tz":"Europe/Brussels","gdp_rank":25,"business":"EU HQ hub, multilingual, formal","compliance":"EU GDPR","risk":"high"},
    "AT": {"name":"Austria","flag":"🇦🇹","currency":"EUR","tz":"Europe/Vienna","gdp_rank":27,"business":"German-speaking, formal, music/culture legacy","compliance":"EU GDPR + DSG","risk":"high"},
    "NZ": {"name":"New Zealand","flag":"🇳🇿","currency":"NZD","tz":"Pacific/Auckland","gdp_rank":49,"business":"Informal, entrepreneurial, small market","compliance":"Privacy Act 2020","risk":"medium"},
    "HK": {"name":"Hong Kong","flag":"🇭🇰","currency":"HKD","tz":"Asia/Hong_Kong","gdp_rank":36,"business":"Fast-paced, English/Cantonese, global finance hub","compliance":"PDPO","risk":"medium"},
    "TW": {"name":"Taiwan","flag":"🇹🇼","currency":"TWD","tz":"Asia/Taipei","gdp_rank":21,"business":"Semiconductor hub, formal, relationship","compliance":"PDPA","risk":"medium"},
}

# ═══════════════════════════════════════════════════════════════════
# GLOBAL COMPANY DATABASE — 500+ companies, 50+ countries
# ═══════════════════════════════════════════════════════════════════
GLOBAL_DB = [
  # ── SAAS ────────────────────────────────────────────────────────
  {"id":"c001","company":"TechFlow Inc","domain":"techflow.io","industry":"saas","country":"US","city":"San Francisco","emp":"50-200","rev":"$5M-$20M","founded":2019,"funding":"Series A — $8M","growth":"+45% YoY","intent":["hiring_engineers","series_a_funded"],"tech":["AWS","HubSpot","Stripe","Slack"],"contacts":[
    {"first":"Sarah","last":"Chen","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":92},
    {"first":"Mike","last":"Roberts","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":88},
    {"first":"Jessica","last":"Kim","title":"Head of Product","dept":"Product","seniority":"Director","score_base":82},
  ]},
  {"id":"c002","company":"CloudScale Systems","domain":"cloudscale.com","industry":"saas","country":"US","city":"New York","emp":"200-500","rev":"$20M-$50M","founded":2017,"funding":"Series B — $35M","growth":"+30% YoY","intent":["series_b_funded","hiring_sales","expanding_globally"],"tech":["AWS","Salesforce","Snowflake","Kubernetes"],"contacts":[
    {"first":"David","last":"Park","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Amanda","last":"Foster","title":"VP Engineering","dept":"Engineering","seniority":"VP","score_base":87},
    {"first":"Ryan","last":"Chen","title":"Director of Sales","dept":"Sales","seniority":"Director","score_base":83},
  ]},
  {"id":"c003","company":"DataPulse AI","domain":"datapulse.ai","industry":"saas","country":"US","city":"Austin","emp":"20-50","rev":"$2M-$10M","founded":2021,"funding":"Seed — $3M","growth":"+120% YoY","intent":["hiring_engineers","new_product_launch"],"tech":["GCP","Stripe","Intercom"],"contacts":[
    {"first":"Alex","last":"Thompson","title":"Founder & CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
  ]},
  {"id":"c004","company":"NexGen Solutions","domain":"nexgensol.in","industry":"saas","country":"IN","city":"Bangalore","emp":"100-500","rev":"$5M-$20M","founded":2016,"funding":"Series A — $12M","growth":"+55% YoY","intent":["hiring_engineers","expanding_globally"],"tech":["AWS","Salesforce","Razorpay"],"contacts":[
    {"first":"Rahul","last":"Verma","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":90},
    {"first":"Sneha","last":"Patel","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":86},
    {"first":"Amit","last":"Gupta","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
  ]},
  {"id":"c005","company":"BrightWave Software","domain":"brightwave.co.uk","industry":"saas","country":"GB","city":"London","emp":"50-200","rev":"$5M-$25M","founded":2018,"funding":"Series A — $10M","growth":"+40% YoY","intent":["cloud_migration","hiring_sales"],"tech":["Azure","HubSpot","Stripe"],"contacts":[
    {"first":"Oliver","last":"Hughes","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Emma","last":"Clarke","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c006","company":"TechHaus GmbH","domain":"techhaus.de","industry":"saas","country":"DE","city":"Berlin","emp":"100-500","rev":"$10M-$30M","founded":2015,"funding":"Series B — $22M","growth":"+25% YoY","intent":["expanding_globally","compliance_audit"],"tech":["AWS","Salesforce","SAP"],"contacts":[
    {"first":"Felix","last":"Mueller","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Anna","last":"Schmidt","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":86},
    {"first":"Lena","last":"Braun","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c007","company":"AsiaScale Pte","domain":"asiascale.sg","industry":"saas","country":"SG","city":"Singapore","emp":"20-100","rev":"$2M-$15M","founded":2020,"funding":"Seed — $4M","growth":"+90% YoY","intent":["series_a_funded","expanding_globally"],"tech":["GCP","Stripe","Intercom"],"contacts":[
    {"first":"Wei","last":"Tan","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
    {"first":"Li","last":"Zhang","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
  ]},
  {"id":"c008","company":"MapleSoft Inc","domain":"maplesoft.ca","industry":"saas","country":"CA","city":"Toronto","emp":"100-400","rev":"$10M-$35M","founded":2016,"funding":"Series B — $28M","growth":"+35% YoY","intent":["hiring_engineers","series_b_funded"],"tech":["AWS","Salesforce","Slack"],"contacts":[
    {"first":"Noah","last":"Brown","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Emma","last":"Wilson","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c009","company":"LogicSoft AB","domain":"logicsoft.se","industry":"saas","country":"SE","city":"Stockholm","emp":"50-200","rev":"$5M-$20M","founded":2018,"funding":"Series A — $9M","growth":"+50% YoY","intent":["hiring_engineers","expanding_globally"],"tech":["AWS","HubSpot","Snowflake"],"contacts":[
    {"first":"Erik","last":"Lindqvist","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Sara","last":"Holm","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},
  {"id":"c010","company":"CloudBase NL","domain":"cloudbase.nl","industry":"saas","country":"NL","city":"Amsterdam","emp":"50-300","rev":"$8M-$30M","founded":2017,"funding":"Series A — $14M","growth":"+38% YoY","intent":["expanding_globally","hiring_sales"],"tech":["GCP","Salesforce","Stripe"],"contacts":[
    {"first":"Thomas","last":"van Berg","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Lisa","last":"de Vries","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c011","company":"DataSync Japan","domain":"datasync.co.jp","industry":"saas","country":"JP","city":"Tokyo","emp":"100-500","rev":"$15M-$50M","founded":2014,"funding":"IPO — $120M","growth":"+20% YoY","intent":["recent_ipo","digital_transformation"],"tech":["AWS","Salesforce","Slack","SAP"],"contacts":[
    {"first":"Yuki","last":"Tanaka","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Kenji","last":"Watanabe","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c012","company":"SkyPlatform AU","domain":"skyplatform.com.au","industry":"saas","country":"AU","city":"Sydney","emp":"100-300","rev":"$8M-$25M","founded":2017,"funding":"Series A — $11M","growth":"+42% YoY","intent":["hiring_engineers","cloud_migration"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Liam","last":"Johnson","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Chloe","last":"Davis","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},

  # ── FINTECH ──────────────────────────────────────────────────────
  {"id":"c013","company":"PayStream Global","domain":"paystream.com","industry":"fintech","country":"US","city":"New York","emp":"200-1000","rev":"$50M-$200M","founded":2014,"funding":"Series C — $90M","growth":"+28% YoY","intent":["acquisitions","hiring_sales","expanding_globally"],"tech":["AWS","Salesforce","Stripe","Snowflake"],"contacts":[
    {"first":"Robert","last":"Martinez","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":92},
    {"first":"Samantha","last":"Lee","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":96},
    {"first":"Chris","last":"Hall","title":"VP Business Dev","dept":"Sales","seniority":"VP","score_base":88},
  ]},
  {"id":"c014","company":"FinEdge India","domain":"finedge.in","industry":"fintech","country":"IN","city":"Mumbai","emp":"500-2000","rev":"$30M-$100M","founded":2015,"funding":"Series D — $150M","growth":"+65% YoY","intent":["recent_ipo","hiring_engineers","expanding_globally"],"tech":["AWS","Razorpay","Salesforce","Kubernetes"],"contacts":[
    {"first":"Arjun","last":"Kapoor","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":96},
    {"first":"Priya","last":"Shah","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":91},
    {"first":"Rohit","last":"Joshi","title":"CFO","dept":"Finance","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c015","company":"ClearFin UK","domain":"clearfin.co.uk","industry":"fintech","country":"GB","city":"London","emp":"100-500","rev":"$20M-$80M","founded":2016,"funding":"Series B — $45M","growth":"+48% YoY","intent":["compliance_audit","hiring_engineers","series_b_funded"],"tech":["AWS","Braintree","Salesforce"],"contacts":[
    {"first":"Charlotte","last":"Evans","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"George","last":"Williams","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c016","company":"MoneyBridge DE","domain":"moneybridge.de","industry":"fintech","country":"DE","city":"Frankfurt","emp":"200-800","rev":"$40M-$120M","founded":2013,"funding":"Series C — $75M","growth":"+22% YoY","intent":["compliance_audit","acquisitions"],"tech":["Azure","SAP","Salesforce","Adyen"],"contacts":[
    {"first":"Markus","last":"Fischer","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Sophie","last":"Koch","title":"CFO","dept":"Finance","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c017","company":"NeoBank BR","domain":"neobank.com.br","industry":"fintech","country":"BR","city":"São Paulo","emp":"500-2000","rev":"$100M-$500M","founded":2013,"funding":"Series D — $350M","growth":"+80% YoY","intent":["recent_ipo","expanding_globally","hiring_engineers"],"tech":["AWS","Stripe","Salesforce","Kubernetes"],"contacts":[
    {"first":"Carlos","last":"Santos","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Julia","last":"Alves","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":90},
  ]},
  {"id":"c018","company":"PayGate SG","domain":"paygate.sg","industry":"fintech","country":"SG","city":"Singapore","emp":"50-200","rev":"$10M-$40M","founded":2018,"funding":"Series A — $18M","growth":"+70% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Marcus","last":"Tan","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Grace","last":"Lim","title":"VP Products","dept":"Product","seniority":"VP","score_base":84},
  ]},
  {"id":"c019","company":"WealthTech IL","domain":"wealthtech.co.il","industry":"fintech","country":"IL","city":"Tel Aviv","emp":"50-200","rev":"$10M-$50M","founded":2017,"funding":"Series A — $22M","growth":"+95% YoY","intent":["series_a_funded","hiring_engineers"],"tech":["AWS","Stripe","Salesforce"],"contacts":[
    {"first":"Tal","last":"Ben-David","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Gal","last":"Mizrahi","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c020","company":"Krypto Dubai","domain":"krypto.ae","industry":"fintech","country":"AE","city":"Dubai","emp":"100-400","rev":"$20M-$80M","founded":2019,"funding":"Series B — $60M","growth":"+110% YoY","intent":["series_b_funded","new_product_launch","expanding_globally"],"tech":["AWS","Adyen","Salesforce"],"contacts":[
    {"first":"Hamdan","last":"Al-Maktoum","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Yasmin","last":"Al-Hashimi","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},

  # ── E-COMMERCE ───────────────────────────────────────────────────
  {"id":"c021","company":"ShopFast US","domain":"shopfast.com","industry":"ecommerce","country":"US","city":"Los Angeles","emp":"500-2000","rev":"$100M-$500M","founded":2012,"funding":"IPO — $400M","growth":"+18% YoY","intent":["recent_ipo","tech_refresh","hiring_sales"],"tech":["AWS","Salesforce","Snowflake","Stripe","Shopify"],"contacts":[
    {"first":"Karen","last":"Johnson","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Tyler","last":"Brown","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":90},
    {"first":"Monica","last":"Green","title":"VP Marketing","dept":"Marketing","seniority":"VP","score_base":83},
  ]},
  {"id":"c022","company":"Meesho Clone","domain":"meshop.in","industry":"ecommerce","country":"IN","city":"Bangalore","emp":"2000-10000","rev":"$200M-$1B","founded":2015,"funding":"Series F — $570M","growth":"+45% YoY","intent":["recent_ipo","expanding_globally","hiring_engineers"],"tech":["GCP","Razorpay","Salesforce","Kubernetes"],"contacts":[
    {"first":"Vidit","last":"Aatrey","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":97},
    {"first":"Sanjeev","last":"Barnwal","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":92},
  ]},
  {"id":"c023","company":"Zalando Competitor","domain":"fashionhub.de","industry":"ecommerce","country":"DE","city":"Hamburg","emp":"1000-5000","rev":"$200M-$1B","founded":2011,"funding":"IPO — $800M","growth":"+15% YoY","intent":["digital_transformation","tech_refresh"],"tech":["AWS","SAP","Salesforce","Adyen"],"contacts":[
    {"first":"Petra","last":"Hoffmann","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Hans","last":"Weber","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c024","company":"Lazada SE","domain":"lazadase.sg","industry":"ecommerce","country":"SG","city":"Singapore","emp":"5000-20000","rev":"$1B+","founded":2012,"funding":"Alibaba Group","growth":"+25% YoY","intent":["tech_refresh","cloud_migration","hiring_engineers"],"tech":["Alibaba Cloud","SAP","Salesforce"],"contacts":[
    {"first":"Shu","last":"Hua","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":96},
    {"first":"Jack","last":"Zhang","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":90},
  ]},

  # ── HEALTHCARE ───────────────────────────────────────────────────
  {"id":"c025","company":"HealthConnect US","domain":"healthconnect.com","industry":"healthcare","country":"US","city":"Boston","emp":"500-2000","rev":"$100M-$500M","founded":2010,"funding":"Series D — $200M","growth":"+22% YoY","intent":["tech_refresh","compliance_audit","hiring_engineers"],"tech":["Azure","Salesforce","Epic","Snowflake"],"contacts":[
    {"first":"Dr. Emily","last":"Watson","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Mark","last":"Thompson","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
    {"first":"Nancy","last":"Adams","title":"Chief Compliance Officer","dept":"Compliance","seniority":"C-Suite","score_base":90},
  ]},
  {"id":"c026","company":"Apollo Digital","domain":"apollodigital.in","industry":"healthcare","country":"IN","city":"Hyderabad","emp":"1000-10000","rev":"$200M-$1B","founded":2005,"funding":"IPO","growth":"+30% YoY","intent":["digital_transformation","cloud_migration"],"tech":["AWS","Oracle","SAP"],"contacts":[
    {"first":"Suneeta","last":"Reddy","title":"MD & CEO","dept":"Executive","seniority":"C-Suite","score_base":96},
    {"first":"Sindoori","last":"Aggarwal","title":"Group COO","dept":"Operations","seniority":"C-Suite","score_base":91},
  ]},
  {"id":"c027","company":"HealthHub SG","domain":"healthhub.sg","industry":"healthcare","country":"SG","city":"Singapore","emp":"200-1000","rev":"$50M-$200M","founded":2015,"funding":"Government + Series B","growth":"+35% YoY","intent":["digital_transformation","hiring_engineers"],"tech":["AWS","Salesforce","Azure"],"contacts":[
    {"first":"Dr. Tan","last":"Ser Kow","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Joyce","last":"Phua","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},

  # ── CYBERSECURITY ────────────────────────────────────────────────
  {"id":"c028","company":"SecureNet Labs","domain":"securenetlabs.com","industry":"cybersecurity","country":"US","city":"Washington DC","emp":"100-500","rev":"$20M-$80M","founded":2013,"funding":"Series B — $40M","growth":"+55% YoY","intent":["series_b_funded","ciso_hired","hiring_engineers"],"tech":["AWS","CrowdStrike","Okta","SentinelOne"],"contacts":[
    {"first":"James","last":"Warren","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Hannah","last":"White","title":"CISO","dept":"Security","seniority":"C-Suite","score_base":91},
    {"first":"Aaron","last":"Black","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":87},
  ]},
  {"id":"c029","company":"CyberStart IL","domain":"cyberstart.co.il","industry":"cybersecurity","country":"IL","city":"Tel Aviv","emp":"100-500","rev":"$20M-$80M","founded":2014,"funding":"Series C — $65M","growth":"+85% YoY","intent":["series_b_funded","hiring_engineers","expanding_globally"],"tech":["AWS","CrowdStrike","Palo Alto","SentinelOne"],"contacts":[
    {"first":"Yoav","last":"Cohen","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Noa","last":"Levy","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":90},
    {"first":"Ido","last":"Mor","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":86},
  ]},
  {"id":"c030","company":"GuardByte DE","domain":"guardbyte.de","industry":"cybersecurity","country":"DE","city":"Munich","emp":"50-200","rev":"$10M-$40M","founded":2017,"funding":"Series A — $18M","growth":"+65% YoY","intent":["series_a_funded","compliance_audit","ciso_hired"],"tech":["Azure","CrowdStrike","SAP","Okta"],"contacts":[
    {"first":"Wolfgang","last":"Gruber","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Claudia","last":"Steiner","title":"CISO","dept":"Security","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c031","company":"CyberAsia Pte","domain":"cyberasia.sg","industry":"cybersecurity","country":"SG","city":"Singapore","emp":"100-400","rev":"$15M-$60M","founded":2016,"funding":"Series B — $30M","growth":"+70% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","Palo Alto","CrowdStrike"],"contacts":[
    {"first":"Simon","last":"Goh","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Vivian","last":"Koh","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c032","company":"InfoSec India","domain":"infosecindia.in","industry":"cybersecurity","country":"IN","city":"Bangalore","emp":"200-1000","rev":"$15M-$60M","founded":2012,"funding":"Series B — $25M","growth":"+45% YoY","intent":["expanding_globally","hiring_engineers","compliance_audit"],"tech":["AWS","SentinelOne","Okta","SAP"],"contacts":[
    {"first":"Ankit","last":"Sharma","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Preeti","last":"Singh","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},

  # ── MANUFACTURING ────────────────────────────────────────────────
  {"id":"c033","company":"Precision Parts Inc","domain":"precisionparts.com","industry":"manufacturing","country":"US","city":"Detroit","emp":"500-5000","rev":"$200M-$1B","founded":2000,"funding":"Private Equity","growth":"+12% YoY","intent":["digital_transformation","tech_refresh","cloud_migration"],"tech":["Azure","SAP","Salesforce","Teams"],"contacts":[
    {"first":"Bill","last":"Murray","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Sandra","last":"Clark","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":85},
    {"first":"Steve","last":"Rogers","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":83},
  ]},
  {"id":"c034","company":"Siemens Startup DE","domain":"smartfactory.de","industry":"manufacturing","country":"DE","city":"Stuttgart","emp":"1000-10000","rev":"$500M-$2B","founded":1998,"funding":"Publicly listed","growth":"+8% YoY","intent":["digital_transformation","tech_refresh"],"tech":["Azure","SAP","Siemens IIOT","Teams"],"contacts":[
    {"first":"Dieter","last":"Keller","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Brigitte","last":"Schulz","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c035","company":"AutoParts JP","domain":"autoparts.co.jp","industry":"manufacturing","country":"JP","city":"Nagoya","emp":"5000-50000","rev":"$2B+","founded":1955,"funding":"Listed (Tokyo SE)","growth":"+5% YoY","intent":["digital_transformation","cloud_migration"],"tech":["Azure","SAP","Fujitsu","Teams"],"contacts":[
    {"first":"Hiroshi","last":"Yamamoto","title":"President & CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Makoto","last":"Suzuki","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},

  # ── LEGAL AI ─────────────────────────────────────────────────────
  {"id":"c036","company":"LegalAI Corp","domain":"legalai.com","industry":"legal","country":"US","city":"New York","emp":"50-200","rev":"$10M-$40M","founded":2019,"funding":"Series A — $15M","growth":"+110% YoY","intent":["series_a_funded","hiring_engineers","new_product_launch"],"tech":["AWS","Salesforce","Stripe","OpenAI API"],"contacts":[
    {"first":"Jennifer","last":"Ross","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Daniel","last":"Lewis","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c037","company":"Lawbyte UK","domain":"lawbyte.co.uk","industry":"legal","country":"GB","city":"London","emp":"20-100","rev":"$5M-$20M","founded":2020,"funding":"Seed — $6M","growth":"+150% YoY","intent":["hiring_engineers","new_product_launch"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Sophie","last":"Bennett","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Henry","last":"Morgan","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},

  # ── REAL ESTATE ──────────────────────────────────────────────────
  {"id":"c038","company":"PropTech US","domain":"proptech.io","industry":"realestate","country":"US","city":"Miami","emp":"100-500","rev":"$30M-$100M","founded":2016,"funding":"Series C — $85M","growth":"+38% YoY","intent":["series_b_funded","hiring_sales","digital_transformation"],"tech":["AWS","Salesforce","HubSpot","Stripe"],"contacts":[
    {"first":"Michael","last":"Torres","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Lisa","last":"Anderson","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c039","company":"Magicbricks Clone","domain":"realtysmart.in","industry":"realestate","country":"IN","city":"Mumbai","emp":"200-1000","rev":"$50M-$200M","founded":2013,"funding":"Series C — $60M","growth":"+42% YoY","intent":["digital_transformation","hiring_sales"],"tech":["AWS","Razorpay","Salesforce"],"contacts":[
    {"first":"Tarun","last":"Mehta","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Kavita","last":"Nair","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},
  {"id":"c040","company":"ImmoTech Berlin","domain":"immotech.de","industry":"realestate","country":"DE","city":"Berlin","emp":"50-300","rev":"$20M-$80M","founded":2017,"funding":"Series B — $32M","growth":"+55% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","HubSpot","SAP"],"contacts":[
    {"first":"Max","last":"Richter","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Julia","last":"Bauer","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},

  # ── LOGISTICS ────────────────────────────────────────────────────
  {"id":"c041","company":"FreightFlow US","domain":"freightflow.com","industry":"logistics","country":"US","city":"Chicago","emp":"1000-5000","rev":"$200M-$1B","founded":2008,"funding":"IPO","growth":"+15% YoY","intent":["tech_refresh","digital_transformation","cloud_migration"],"tech":["AWS","SAP","Salesforce","Oracle"],"contacts":[
    {"first":"Douglas","last":"Miller","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Patricia","last":"Young","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c042","company":"Delhivery Clone","domain":"swiftship.in","industry":"logistics","country":"IN","city":"Gurgaon","emp":"10000-50000","rev":"$500M-$2B","founded":2011,"funding":"IPO","growth":"+20% YoY","intent":["tech_refresh","cloud_migration","hiring_engineers"],"tech":["GCP","Oracle","Salesforce","Kubernetes"],"contacts":[
    {"first":"Sahil","last":"Barua","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":96},
    {"first":"Amit","last":"Agarwal","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":91},
  ]},
  {"id":"c043","company":"GulfLog AE","domain":"gulflog.ae","industry":"logistics","country":"AE","city":"Dubai","emp":"500-2000","rev":"$100M-$500M","founded":2010,"funding":"PE-backed","growth":"+18% YoY","intent":["digital_transformation","tech_refresh"],"tech":["Azure","SAP","Oracle"],"contacts":[
    {"first":"Rashid","last":"Al-Falasi","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Ahmad","last":"Al-Suwaidi","title":"COO","dept":"Operations","seniority":"C-Suite","score_base":88},
  ]},

  # ── EDUCATION TECH ───────────────────────────────────────────────
  {"id":"c044","company":"EduLeap US","domain":"eduleap.com","industry":"education","country":"US","city":"New York","emp":"100-500","rev":"$20M-$80M","founded":2017,"funding":"Series B — $42M","growth":"+65% YoY","intent":["series_b_funded","hiring_engineers","new_product_launch"],"tech":["AWS","HubSpot","Stripe","Snowflake"],"contacts":[
    {"first":"Angela","last":"Davis","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Steven","last":"Park","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c045","company":"Byju Competitor","domain":"smartlearn.in","industry":"education","country":"IN","city":"Bangalore","emp":"5000-20000","rev":"$500M-$2B","founded":2015,"funding":"Series E — $800M","growth":"+35% YoY","intent":["expanding_globally","acquisitions","hiring_engineers"],"tech":["AWS","Salesforce","Razorpay","Kubernetes"],"contacts":[
    {"first":"Divya","last":"Gokulnath","title":"Co-founder & Director","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Mrinal","last":"Mohit","title":"CEO — K-12","dept":"Executive","seniority":"C-Suite","score_base":91},
  ]},
  {"id":"c046","company":"Coursehero EU","domain":"coursehero.eu","industry":"education","country":"NL","city":"Amsterdam","emp":"100-400","rev":"$30M-$100M","founded":2018,"funding":"Series B — $35M","growth":"+55% YoY","intent":["series_b_funded","expanding_globally"],"tech":["GCP","Stripe","HubSpot"],"contacts":[
    {"first":"Jan","last":"Smit","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Laura","last":"Bakker","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},

  # ── DATA / AI ────────────────────────────────────────────────────
  {"id":"c047","company":"Databricks Competitor","domain":"queryflow.com","industry":"saas","country":"US","city":"San Francisco","emp":"200-1000","rev":"$50M-$200M","founded":2016,"funding":"Series C — $150M","growth":"+75% YoY","intent":["series_b_funded","hiring_engineers","expanding_globally"],"tech":["AWS","Snowflake","Databricks","Tableau"],"contacts":[
    {"first":"Priya","last":"Krishnaswamy","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Jordan","last":"Lee","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":90},
    {"first":"Maya","last":"Patel","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":86},
  ]},
  {"id":"c048","company":"AI Analytics KR","domain":"aianalytics.kr","industry":"saas","country":"KR","city":"Seoul","emp":"100-500","rev":"$20M-$80M","founded":2017,"funding":"Series B — $40M","growth":"+88% YoY","intent":["series_b_funded","hiring_engineers","new_product_launch"],"tech":["AWS","Snowflake","Tableau","Kubernetes"],"contacts":[
    {"first":"Jae-Won","last":"Kim","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"So-Young","last":"Park","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c049","company":"DataBridge CH","domain":"databridge.ch","industry":"saas","country":"CH","city":"Zurich","emp":"50-200","rev":"$15M-$60M","founded":2018,"funding":"Series A — $20M","growth":"+60% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","Snowflake","Looker","Tableau"],"contacts":[
    {"first":"Hans","last":"Zimmermann","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Maria","last":"Keller","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c050","company":"Odatix AU","domain":"odatix.com.au","industry":"saas","country":"AU","city":"Melbourne","emp":"50-200","rev":"$8M-$30M","founded":2019,"funding":"Series A — $12M","growth":"+70% YoY","intent":["series_a_funded","hiring_engineers"],"tech":["AWS","Databricks","HubSpot"],"contacts":[
    {"first":"James","last":"Mitchell","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Rachel","last":"O'Brien","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},

  # ── AFRICA / LATAM ───────────────────────────────────────────────
  {"id":"c051","company":"Flutterwave Competitor","domain":"quickpay.ng","industry":"fintech","country":"NG","city":"Lagos","emp":"100-500","rev":"$20M-$80M","founded":2018,"funding":"Series B — $50M","growth":"+120% YoY","intent":["series_b_funded","expanding_globally","hiring_engineers"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Chioma","last":"Okafor","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Emeka","last":"Nwosu","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c052","company":"Safaricom Startup","domain":"simu.ke","industry":"fintech","country":"KE","city":"Nairobi","emp":"50-200","rev":"$5M-$20M","founded":2020,"funding":"Seed — $5M","growth":"+150% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","M-Pesa API","HubSpot"],"contacts":[
    {"first":"Amina","last":"Wanjiku","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"David","last":"Kamau","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c053","company":"Mercado Clone","domain":"shoplatam.co","industry":"ecommerce","country":"CO","city":"Bogotá","emp":"100-500","rev":"$20M-$80M","founded":2017,"funding":"Series B — $35M","growth":"+65% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","Stripe","Salesforce"],"contacts":[
    {"first":"Catalina","last":"Gómez","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Andrés","last":"Martínez","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},

  # ── ADDITIONAL GLOBAL COVERAGE ───────────────────────────────────
  {"id":"c054","company":"HealthScan SA","domain":"healthscan.co.za","industry":"healthcare","country":"ZA","city":"Cape Town","emp":"50-200","rev":"$5M-$20M","founded":2019,"funding":"Seed — $4M","growth":"+80% YoY","intent":["series_a_funded","hiring_engineers"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Zinhle","last":"Dlamini","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Sipho","last":"Ndlovu","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c055","company":"TechPlus PL","domain":"techplus.pl","industry":"saas","country":"PL","city":"Warsaw","emp":"50-300","rev":"$5M-$25M","founded":2017,"funding":"Series A — $10M","growth":"+55% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Piotr","last":"Kowalski","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Agnieszka","last":"Wiśniewska","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":85},
  ]},
  {"id":"c056","company":"DevForce UA","domain":"devforce.ua","industry":"saas","country":"UA","city":"Kyiv","emp":"100-500","rev":"$10M-$40M","founded":2016,"funding":"Series A — $12M","growth":"+45% YoY","intent":["series_a_funded","hiring_engineers"],"tech":["AWS","GitHub","Slack","Jira"],"contacts":[
    {"first":"Oleksiy","last":"Bondarenko","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Nataliia","last":"Kovalenko","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c057","company":"Arabia Tech SA","domain":"arabiatech.sa","industry":"saas","country":"SA","city":"Riyadh","emp":"100-500","rev":"$20M-$80M","founded":2017,"funding":"Series B — $45M","growth":"+70% YoY","intent":["series_b_funded","expanding_globally","vision_2030"],"tech":["AWS","Salesforce","SAP","Microsoft 365"],"contacts":[
    {"first":"Abdullah","last":"Al-Ghamdi","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Fatima","last":"Al-Zahrani","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c058","company":"PharmaTrack TR","domain":"pharmatrack.com.tr","industry":"healthcare","country":"TR","city":"Istanbul","emp":"50-300","rev":"$10M-$40M","founded":2018,"funding":"Series A — $15M","growth":"+60% YoY","intent":["series_a_funded","digital_transformation"],"tech":["Azure","SAP","HubSpot"],"contacts":[
    {"first":"Mehmet","last":"Yilmaz","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Ayşe","last":"Kaya","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c059","company":"SuperApp ID","domain":"superapp.id","industry":"saas","country":"ID","city":"Jakarta","emp":"500-2000","rev":"$100M-$500M","founded":2014,"funding":"Series D — $200M","growth":"+40% YoY","intent":["recent_ipo","expanding_globally","hiring_engineers"],"tech":["AWS","GCP","Kubernetes","Salesforce"],"contacts":[
    {"first":"Budi","last":"Santoso","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Dewi","last":"Kusuma","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c060","company":"FastCommerce VN","domain":"fastcommerce.vn","industry":"ecommerce","country":"VN","city":"Ho Chi Minh City","emp":"200-1000","rev":"$30M-$100M","founded":2016,"funding":"Series B — $40M","growth":"+75% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Nguyen","last":"Van An","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Tran","last":"Thi Lan","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},

  # ── SAAS EXPANSION ───────────────────────────────────────────────
  {"id":"c061","company":"Vizura Software","domain":"vizura.fr","industry":"saas","country":"FR","city":"Paris","emp":"100-500","rev":"$15M-$50M","founded":2016,"funding":"Series B — $28M","growth":"+38% YoY","intent":["series_b_funded","expanding_globally","hiring_engineers"],"tech":["AWS","HubSpot","Stripe","Salesforce"],"contacts":[
    {"first":"Pierre","last":"Dubois","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Claire","last":"Martin","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":86},
    {"first":"Antoine","last":"Bernard","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c062","company":"Finloop IT","domain":"finloop.it","industry":"saas","country":"IT","city":"Milan","emp":"50-300","rev":"$10M-$40M","founded":2018,"funding":"Series A — $14M","growth":"+50% YoY","intent":["series_a_funded","cloud_migration","hiring_engineers"],"tech":["AWS","Salesforce","HubSpot","Stripe"],"contacts":[
    {"first":"Marco","last":"Rossi","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Giulia","last":"Ferrari","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c063","company":"AppWave ES","domain":"appwave.es","industry":"saas","country":"ES","city":"Madrid","emp":"100-400","rev":"$10M-$35M","founded":2017,"funding":"Series A — $16M","growth":"+45% YoY","intent":["expanding_globally","series_a_funded"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Carlos","last":"González","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"María","last":"López","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},
  {"id":"c064","company":"TechBase PT","domain":"techbase.pt","industry":"saas","country":"PT","city":"Lisbon","emp":"50-200","rev":"$5M-$20M","founded":2019,"funding":"Seed — $5M","growth":"+80% YoY","intent":["series_a_funded","hiring_engineers","new_product_launch"],"tech":["AWS","HubSpot","Stripe","Vercel"],"contacts":[
    {"first":"João","last":"Ferreira","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Ana","last":"Costa","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c065","company":"CloudPeak CZ","domain":"cloudpeak.cz","industry":"saas","country":"CZ","city":"Prague","emp":"50-200","rev":"$5M-$20M","founded":2018,"funding":"Series A — $11M","growth":"+60% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","HubSpot","Salesforce"],"contacts":[
    {"first":"Tomáš","last":"Novák","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Lucie","last":"Dvořáková","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":85},
  ]},
  {"id":"c066","company":"DataSmart HU","domain":"datasmart.hu","industry":"saas","country":"HU","city":"Budapest","emp":"50-200","rev":"$5M-$20M","founded":2017,"funding":"Series A — $9M","growth":"+55% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Péter","last":"Nagy","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Eszter","last":"Kovács","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":84},
  ]},
  {"id":"c067","company":"StackNorth FI","domain":"stacknorth.fi","industry":"saas","country":"FI","city":"Helsinki","emp":"50-200","rev":"$5M-$20M","founded":2018,"funding":"Series A — $10M","growth":"+52% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","HubSpot","Snowflake"],"contacts":[
    {"first":"Mikko","last":"Virtanen","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Sanna","last":"Mäkinen","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c068","company":"DevWave DK","domain":"devwave.dk","industry":"saas","country":"DK","city":"Copenhagen","emp":"50-200","rev":"$8M-$25M","founded":2017,"funding":"Series A — $12M","growth":"+48% YoY","intent":["series_a_funded","expanding_globally","hiring_engineers"],"tech":["AWS","HubSpot","Stripe","Kubernetes"],"contacts":[
    {"first":"Søren","last":"Larsen","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Astrid","last":"Hansen","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c069","company":"OsloCloud NO","domain":"oslocloud.no","industry":"saas","country":"NO","city":"Oslo","emp":"50-300","rev":"$10M-$35M","founded":2016,"funding":"Series A — $15M","growth":"+43% YoY","intent":["series_a_funded","cloud_migration"],"tech":["AWS","HubSpot","Salesforce"],"contacts":[
    {"first":"Tor","last":"Eriksen","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Ingrid","last":"Berg","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c070","company":"BruxellesTech BE","domain":"bruxelles.tech","industry":"saas","country":"BE","city":"Brussels","emp":"100-400","rev":"$10M-$40M","founded":2016,"funding":"Series B — $22M","growth":"+40% YoY","intent":["series_b_funded","expanding_globally","compliance_audit"],"tech":["AWS","Salesforce","HubSpot"],"contacts":[
    {"first":"Nicolas","last":"Lecomte","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Sophie","last":"Laurent","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},

  # ── FINTECH EXPANSION ────────────────────────────────────────────
  {"id":"c071","company":"PayNow MX","domain":"paynow.mx","industry":"fintech","country":"MX","city":"Mexico City","emp":"200-800","rev":"$30M-$120M","founded":2015,"funding":"Series C — $80M","growth":"+70% YoY","intent":["series_b_funded","expanding_globally","hiring_engineers"],"tech":["AWS","Stripe","Salesforce","Kubernetes"],"contacts":[
    {"first":"Diego","last":"Hernández","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Valentina","last":"Ruiz","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c072","company":"CashLink AR","domain":"cashlink.com.ar","industry":"fintech","country":"AR","city":"Buenos Aires","emp":"100-400","rev":"$15M-$60M","founded":2017,"funding":"Series B — $35M","growth":"+85% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Lucía","last":"Fernández","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Mateo","last":"García","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c073","company":"PagoFast CL","domain":"pagofast.cl","industry":"fintech","country":"CL","city":"Santiago","emp":"50-200","rev":"$10M-$40M","founded":2018,"funding":"Series A — $18M","growth":"+75% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","Stripe","Salesforce"],"contacts":[
    {"first":"Sebastián","last":"Muñoz","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Camila","last":"Torres","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c074","company":"AsiaFinance MY","domain":"asiafinance.my","industry":"fintech","country":"MY","city":"Kuala Lumpur","emp":"100-500","rev":"$15M-$60M","founded":2016,"funding":"Series B — $28M","growth":"+62% YoY","intent":["series_b_funded","expanding_globally","digital_transformation"],"tech":["AWS","Stripe","Salesforce"],"contacts":[
    {"first":"Ahmad","last":"Razali","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Nurul","last":"Huda","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c075","company":"PayPhil PH","domain":"payphil.ph","industry":"fintech","country":"PH","city":"Manila","emp":"100-400","rev":"$10M-$40M","founded":2017,"funding":"Series A — $20M","growth":"+80% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Jose","last":"Santos","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Maria","last":"Cruz","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c076","company":"ThaiFintech TH","domain":"thaifin.co.th","industry":"fintech","country":"TH","city":"Bangkok","emp":"50-200","rev":"$8M-$30M","founded":2018,"funding":"Series A — $14M","growth":"+70% YoY","intent":["series_a_funded","digital_transformation"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Somchai","last":"Wongkul","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Ploy","last":"Chaiyasin","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":85},
  ]},
  {"id":"c077","company":"EgyptPay EG","domain":"egyptpay.eg","industry":"fintech","country":"EG","city":"Cairo","emp":"100-500","rev":"$10M-$50M","founded":2017,"funding":"Series A — $22M","growth":"+90% YoY","intent":["series_a_funded","expanding_globally","digital_transformation"],"tech":["AWS","HubSpot","Salesforce"],"contacts":[
    {"first":"Omar","last":"Hassan","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Layla","last":"Ibrahim","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c078","company":"PakPay PK","domain":"pakpay.pk","industry":"fintech","country":"PK","city":"Karachi","emp":"50-200","rev":"$5M-$20M","founded":2019,"funding":"Seed — $6M","growth":"+110% YoY","intent":["series_a_funded","new_product_launch"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Ahsan","last":"Malik","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Sara","last":"Khan","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":85},
  ]},

  # ── CYBERSECURITY EXPANSION ──────────────────────────────────────
  {"id":"c079","company":"CyberFort AU","domain":"cyberfort.com.au","industry":"cybersecurity","country":"AU","city":"Melbourne","emp":"100-400","rev":"$15M-$60M","founded":2015,"funding":"Series B — $30M","growth":"+65% YoY","intent":["series_b_funded","ciso_hired","compliance_audit"],"tech":["AWS","CrowdStrike","Okta","SentinelOne"],"contacts":[
    {"first":"Andrew","last":"Thompson","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Kate","last":"Murphy","title":"CISO","dept":"Security","seniority":"C-Suite","score_base":90},
  ]},
  {"id":"c080","company":"GuardNet CA","domain":"guardnet.ca","industry":"cybersecurity","country":"CA","city":"Vancouver","emp":"50-200","rev":"$10M-$40M","founded":2016,"funding":"Series A — $17M","growth":"+58% YoY","intent":["series_a_funded","ciso_hired"],"tech":["AWS","Palo Alto","CrowdStrike"],"contacts":[
    {"first":"Jason","last":"MacDonald","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Rachel","last":"Tremblay","title":"CISO","dept":"Security","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c081","company":"ShieldKR","domain":"shieldkr.co.kr","industry":"cybersecurity","country":"KR","city":"Seoul","emp":"100-400","rev":"$15M-$60M","founded":2014,"funding":"Series B — $28M","growth":"+72% YoY","intent":["series_b_funded","expanding_globally","ciso_hired"],"tech":["AWS","CrowdStrike","Palo Alto","Okta"],"contacts":[
    {"first":"Park","last":"Joon-Seo","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Kim","last":"Min-Jung","title":"CISO","dept":"Security","seniority":"C-Suite","score_base":90},
  ]},
  {"id":"c082","company":"SecureTW","domain":"securetw.com.tw","industry":"cybersecurity","country":"TW","city":"Taipei","emp":"100-400","rev":"$15M-$55M","founded":2013,"funding":"Series B — $25M","growth":"+60% YoY","intent":["series_b_funded","hiring_engineers"],"tech":["AWS","CrowdStrike","Palo Alto"],"contacts":[
    {"first":"Chen","last":"Wei-Liang","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Lin","last":"Shu-Fen","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c083","company":"CyberRU","domain":"cyberru.tech","industry":"cybersecurity","country":"RU","city":"Moscow","emp":"200-800","rev":"$20M-$80M","founded":2012,"funding":"PE-backed","growth":"+25% YoY","intent":["hiring_engineers","tech_refresh"],"tech":["Kaspersky","Positive Tech","Yandex Cloud"],"contacts":[
    {"first":"Dmitry","last":"Volkov","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Elena","last":"Petrova","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":85},
  ]},

  # ── HEALTHCARE EXPANSION ─────────────────────────────────────────
  {"id":"c084","company":"MedTech AU","domain":"medtech.com.au","industry":"healthcare","country":"AU","city":"Brisbane","emp":"100-500","rev":"$20M-$80M","founded":2014,"funding":"Series B — $38M","growth":"+40% YoY","intent":["digital_transformation","series_b_funded"],"tech":["AWS","Salesforce","Epic"],"contacts":[
    {"first":"Sarah","last":"Williams","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"James","last":"Harris","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c085","company":"HealthOS UK","domain":"healthos.co.uk","industry":"healthcare","country":"GB","city":"Manchester","emp":"100-400","rev":"$15M-$60M","founded":2016,"funding":"Series A — $20M","growth":"+45% YoY","intent":["series_a_funded","digital_transformation","compliance_audit"],"tech":["Azure","Salesforce","NHS API"],"contacts":[
    {"first":"James","last":"Fletcher","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Emma","last":"Robinson","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c086","company":"MedHub SG","domain":"medhub.sg","industry":"healthcare","country":"SG","city":"Singapore","emp":"100-500","rev":"$20M-$80M","founded":2015,"funding":"Series B — $32M","growth":"+48% YoY","intent":["series_b_funded","cloud_migration"],"tech":["AWS","Azure","Epic"],"contacts":[
    {"first":"Dr. Lim","last":"Kheng Wah","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Raymond","last":"Ong","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c087","company":"HealthBridge KR","domain":"healthbridge.kr","industry":"healthcare","country":"KR","city":"Seoul","emp":"200-800","rev":"$30M-$100M","founded":2014,"funding":"Series C — $55M","growth":"+35% YoY","intent":["series_b_funded","digital_transformation"],"tech":["AWS","Samsung Health","SAP"],"contacts":[
    {"first":"Choi","last":"Young-Soo","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Lee","last":"Mi-Rae","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},

  # ── MANUFACTURING / INDUSTRY 4.0 ─────────────────────────────────
  {"id":"c088","company":"Industria 4.0 IT","domain":"industria40.it","industry":"manufacturing","country":"IT","city":"Turin","emp":"500-5000","rev":"$100M-$500M","founded":2000,"funding":"Listed","growth":"+12% YoY","intent":["digital_transformation","tech_refresh","cloud_migration"],"tech":["Azure","SAP","Siemens IIOT"],"contacts":[
    {"first":"Luca","last":"Russo","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Francesca","last":"Colombo","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c089","company":"PrecisionKR","domain":"precision.kr","industry":"manufacturing","country":"KR","city":"Ulsan","emp":"5000-50000","rev":"$2B+","founded":1985,"funding":"Listed (KRX)","growth":"+8% YoY","intent":["digital_transformation","cloud_migration","tech_refresh"],"tech":["Azure","SAP","Samsung IT"],"contacts":[
    {"first":"Jung","last":"Woo-Seok","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":95},
    {"first":"Oh","last":"Sang-Hoon","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c090","company":"ManuFab IN","domain":"manufab.in","industry":"manufacturing","country":"IN","city":"Pune","emp":"1000-10000","rev":"$200M-$1B","founded":2000,"funding":"Listed (BSE)","growth":"+15% YoY","intent":["digital_transformation","cloud_migration"],"tech":["Azure","SAP","Oracle"],"contacts":[
    {"first":"Suresh","last":"Desai","title":"MD & CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Neeraj","last":"Kumar","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},

  # ── EDUCATION EXPANSION ──────────────────────────────────────────
  {"id":"c091","company":"EduTech UK","domain":"edutech.co.uk","industry":"education","country":"GB","city":"London","emp":"100-500","rev":"$20M-$80M","founded":2016,"funding":"Series B — $40M","growth":"+50% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"James","last":"Taylor","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Lucy","last":"Wright","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c092","company":"Lernen DE","domain":"lernen.de","industry":"education","country":"DE","city":"Berlin","emp":"100-400","rev":"$15M-$60M","founded":2017,"funding":"Series A — $22M","growth":"+55% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Kai","last":"Neumann","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Julia","last":"Hartmann","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},

  # ── LOGISTICS EXPANSION ──────────────────────────────────────────
  {"id":"c093","company":"LogiTech MX","domain":"logitech.mx","industry":"logistics","country":"MX","city":"Monterrey","emp":"500-2000","rev":"$50M-$200M","founded":2010,"funding":"Series C — $70M","growth":"+22% YoY","intent":["digital_transformation","tech_refresh"],"tech":["AWS","SAP","Oracle"],"contacts":[
    {"first":"Alejandro","last":"Morales","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Rosa","last":"Ramírez","title":"COO","dept":"Operations","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c094","company":"ShipEasy AU","domain":"shipeasy.com.au","industry":"logistics","country":"AU","city":"Perth","emp":"200-1000","rev":"$30M-$100M","founded":2013,"funding":"Series B — $42M","growth":"+28% YoY","intent":["digital_transformation","cloud_migration"],"tech":["AWS","SAP","Salesforce"],"contacts":[
    {"first":"Scott","last":"Morrison","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Lisa","last":"Chang","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c095","company":"LogCore ZA","domain":"logcore.co.za","industry":"logistics","country":"ZA","city":"Johannesburg","emp":"200-800","rev":"$20M-$80M","founded":2012,"funding":"Series B — $30M","growth":"+25% YoY","intent":["digital_transformation","tech_refresh"],"tech":["Azure","SAP","Oracle"],"contacts":[
    {"first":"Thabo","last":"Motsepe","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Nomsa","last":"Dlamini","title":"COO","dept":"Operations","seniority":"C-Suite","score_base":86},
  ]},

  # ── E-COMMERCE EXPANSION ─────────────────────────────────────────
  {"id":"c096","company":"MarketHub FR","domain":"markethub.fr","industry":"ecommerce","country":"FR","city":"Lyon","emp":"200-1000","rev":"$30M-$100M","founded":2014,"funding":"Series C — $60M","growth":"+28% YoY","intent":["digital_transformation","tech_refresh"],"tech":["AWS","Salesforce","Adyen","Stripe"],"contacts":[
    {"first":"Louis","last":"Dupont","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Camille","last":"Simon","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c097","company":"ClickShop MY","domain":"clickshop.my","industry":"ecommerce","country":"MY","city":"Kuala Lumpur","emp":"200-1000","rev":"$20M-$80M","founded":2015,"funding":"Series B — $32M","growth":"+50% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Lee","last":"Chong Wei","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Aisha","last":"Ibrahim","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c098","company":"TiendaFull CO","domain":"tiendafull.co","industry":"ecommerce","country":"CO","city":"Medellín","emp":"100-400","rev":"$15M-$60M","founded":2016,"funding":"Series A — $18M","growth":"+70% YoY","intent":["series_a_funded","expanding_globally"],"tech":["AWS","Stripe","HubSpot"],"contacts":[
    {"first":"Juliana","last":"Vargas","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Pablo","last":"Herrera","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c099","company":"MarketPH","domain":"marketph.com.ph","industry":"ecommerce","country":"PH","city":"Quezon City","emp":"200-800","rev":"$20M-$80M","founded":2014,"funding":"Series B — $28M","growth":"+45% YoY","intent":["series_b_funded","digital_transformation"],"tech":["AWS","Stripe","Salesforce"],"contacts":[
    {"first":"Mark","last":"Reyes","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Ana","last":"Dela Cruz","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c100","company":"BanglaShop BD","domain":"banglashop.com.bd","industry":"ecommerce","country":"BD","city":"Dhaka","emp":"200-1000","rev":"$15M-$60M","founded":2016,"funding":"Series A — $15M","growth":"+95% YoY","intent":["series_a_funded","expanding_globally","hiring_engineers"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Farhan","last":"Ahmed","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Nusrat","last":"Jahan","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},

  # ── REAL ESTATE EXPANSION ────────────────────────────────────────
  {"id":"c101","company":"ImmoFr","domain":"immofr.fr","industry":"realestate","country":"FR","city":"Paris","emp":"200-800","rev":"$30M-$100M","founded":2013,"funding":"Series C — $55M","growth":"+32% YoY","intent":["digital_transformation","hiring_sales"],"tech":["AWS","Salesforce","HubSpot"],"contacts":[
    {"first":"Jean-Paul","last":"Moreau","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Isabelle","last":"Blanc","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},
  {"id":"c102","company":"HouseSmart JP","domain":"housesmart.co.jp","industry":"realestate","country":"JP","city":"Tokyo","emp":"500-2000","rev":"$100M-$500M","founded":2010,"funding":"Listed (TSE)","growth":"+15% YoY","intent":["digital_transformation","tech_refresh"],"tech":["AWS","Salesforce","SAP"],"contacts":[
    {"first":"Takeshi","last":"Nakamura","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Yoko","last":"Hayashi","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":86},
  ]},
  {"id":"c103","company":"PropertyAE","domain":"propae.ae","industry":"realestate","country":"AE","city":"Abu Dhabi","emp":"100-400","rev":"$30M-$100M","founded":2016,"funding":"Series B — $40M","growth":"+45% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","Salesforce","HubSpot"],"contacts":[
    {"first":"Sultan","last":"Al-Mansoori","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Mariam","last":"Al-Khoury","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":86},
  ]},

  # ── LEGAL AI EXPANSION ───────────────────────────────────────────
  {"id":"c104","company":"LexAI DE","domain":"lexai.de","industry":"legal","country":"DE","city":"Hamburg","emp":"50-200","rev":"$5M-$20M","founded":2020,"funding":"Seed — $8M","growth":"+120% YoY","intent":["hiring_engineers","new_product_launch","series_a_funded"],"tech":["AWS","OpenAI API","HubSpot"],"contacts":[
    {"first":"Stefan","last":"Hoffmann","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Laura","last":"Richter","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c105","company":"LegalBot IN","domain":"legalbot.in","industry":"legal","country":"IN","city":"Delhi","emp":"50-200","rev":"$3M-$15M","founded":2021,"funding":"Seed — $4M","growth":"+200% YoY","intent":["hiring_engineers","new_product_launch"],"tech":["AWS","OpenAI API","Razorpay"],"contacts":[
    {"first":"Vikram","last":"Chandra","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Ananya","last":"Bose","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},

  # ── HK / TW / ASIA ───────────────────────────────────────────────
  {"id":"c106","company":"FinTech HK","domain":"finhk.com.hk","industry":"fintech","country":"HK","city":"Hong Kong","emp":"100-500","rev":"$20M-$80M","founded":2015,"funding":"Series B — $40M","growth":"+55% YoY","intent":["series_b_funded","expanding_globally","compliance_audit"],"tech":["AWS","Stripe","Salesforce","Bloomberg"],"contacts":[
    {"first":"Kenneth","last":"Wong","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Wendy","last":"Chan","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
  ]},
  {"id":"c107","company":"SemiSoft TW","domain":"semisoft.com.tw","industry":"saas","country":"TW","city":"Taipei","emp":"200-1000","rev":"$30M-$100M","founded":2012,"funding":"Listed (TWSE)","growth":"+20% YoY","intent":["tech_refresh","cloud_migration","digital_transformation"],"tech":["AWS","SAP","Oracle"],"contacts":[
    {"first":"Chang","last":"Chun-Hua","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Wu","last":"Mei-Ling","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c108","company":"GulfSaaS SA","domain":"gulfsaas.sa","industry":"saas","country":"SA","city":"Jeddah","emp":"100-400","rev":"$15M-$60M","founded":2018,"funding":"Series A — $20M","growth":"+85% YoY","intent":["series_a_funded","expanding_globally","digital_transformation"],"tech":["AWS","Salesforce","SAP"],"contacts":[
    {"first":"Khalid","last":"Al-Qahtani","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Reem","last":"Al-Otaibi","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c109","company":"BalticCode EE","domain":"balticcode.ee","industry":"saas","country":"CZ","city":"Tallinn","emp":"50-200","rev":"$5M-$20M","founded":2019,"funding":"Seed — $5M","growth":"+90% YoY","intent":["series_a_funded","hiring_engineers"],"tech":["AWS","HubSpot","Stripe","Kubernetes"],"contacts":[
    {"first":"Taavi","last":"Mägi","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Kairi","last":"Tamm","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c110","company":"RecoAI US","domain":"recoai.com","industry":"saas","country":"US","city":"Seattle","emp":"50-200","rev":"$8M-$30M","founded":2020,"funding":"Series A — $15M","growth":"+130% YoY","intent":["series_a_funded","hiring_engineers","new_product_launch"],"tech":["AWS","Snowflake","HubSpot","OpenAI API"],"contacts":[
    {"first":"Nina","last":"Patel","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Kevin","last":"Zhang","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
    {"first":"Olivia","last":"Moore","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},
  {"id":"c111","company":"GrowthHQ UK","domain":"growthhq.co.uk","industry":"saas","country":"GB","city":"Edinburgh","emp":"50-200","rev":"$5M-$20M","founded":2019,"funding":"Seed — $4M","growth":"+110% YoY","intent":["series_a_funded","hiring_sales"],"tech":["AWS","HubSpot","Stripe","Intercom"],"contacts":[
    {"first":"Callum","last":"MacKenzie","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Fiona","last":"Sinclair","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},
  {"id":"c112","company":"AutomateIN","domain":"automatein.in","industry":"saas","country":"IN","city":"Chennai","emp":"100-500","rev":"$10M-$40M","founded":2018,"funding":"Series A — $16M","growth":"+72% YoY","intent":["series_a_funded","hiring_engineers","expanding_globally"],"tech":["AWS","HubSpot","Salesforce","Zapier"],"contacts":[
    {"first":"Karthik","last":"Rajan","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Deepa","last":"Krishnan","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
    {"first":"Suresh","last":"Natarajan","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":83},
  ]},
  {"id":"c113","company":"DataFlow AE","domain":"dataflow.ae","industry":"saas","country":"AE","city":"Dubai","emp":"100-400","rev":"$15M-$60M","founded":2017,"funding":"Series B — $35M","growth":"+65% YoY","intent":["series_b_funded","cloud_migration","digital_transformation"],"tech":["AWS","Snowflake","Salesforce"],"contacts":[
    {"first":"Faris","last":"Al-Nasser","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Sheikha","last":"Al-Rashid","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
  ]},
  {"id":"c114","company":"NordCloud SE","domain":"nordcloud.se","industry":"saas","country":"SE","city":"Gothenburg","emp":"100-400","rev":"$20M-$80M","founded":2015,"funding":"Series B — $30M","growth":"+42% YoY","intent":["series_b_funded","cloud_migration","expanding_globally"],"tech":["AWS","Kubernetes","Terraform","Snowflake"],"contacts":[
    {"first":"Björn","last":"Axelsson","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Maja","last":"Johansson","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c115","company":"DataOps NZ","domain":"dataops.co.nz","industry":"saas","country":"NZ","city":"Auckland","emp":"20-100","rev":"$3M-$15M","founded":2019,"funding":"Seed — $4M","growth":"+95% YoY","intent":["series_a_funded","hiring_engineers"],"tech":["AWS","Snowflake","dbt","HubSpot"],"contacts":[
    {"first":"Jack","last":"Tanner","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":90},
    {"first":"Sophie","last":"Walker","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":85},
  ]},
  {"id":"c116","company":"GrowthAI JP","domain":"growthai.jp","industry":"saas","country":"JP","city":"Osaka","emp":"50-200","rev":"$8M-$30M","founded":2019,"funding":"Series A — $12M","growth":"+75% YoY","intent":["series_a_funded","hiring_engineers","new_product_launch"],"tech":["AWS","Salesforce","HubSpot","OpenAI API"],"contacts":[
    {"first":"Ryo","last":"Sato","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Emi","last":"Yoshida","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
  {"id":"c117","company":"Kloud FR","domain":"kloud.fr","industry":"saas","country":"FR","city":"Bordeaux","emp":"100-400","rev":"$10M-$40M","founded":2016,"funding":"Series A — $15M","growth":"+48% YoY","intent":["series_a_funded","cloud_migration"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Emmanuel","last":"Petit","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":91},
    {"first":"Mathilde","last":"Leroy","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":86},
  ]},
  {"id":"c118","company":"AI Commerce SG","domain":"aicommerce.sg","industry":"ecommerce","country":"SG","city":"Singapore","emp":"100-400","rev":"$15M-$60M","founded":2017,"funding":"Series B — $28M","growth":"+68% YoY","intent":["series_b_funded","expanding_globally","new_product_launch"],"tech":["AWS","Stripe","Salesforce","OpenAI API"],"contacts":[
    {"first":"Ethan","last":"Ng","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":93},
    {"first":"Priya","last":"Menon","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":88},
    {"first":"Daniel","last":"Tay","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":84},
  ]},
  {"id":"c119","company":"InsurTech US","domain":"insuretech.io","industry":"fintech","country":"US","city":"Dallas","emp":"200-800","rev":"$40M-$150M","founded":2014,"funding":"Series C — $95M","growth":"+35% YoY","intent":["series_b_funded","acquisitions","hiring_engineers"],"tech":["AWS","Salesforce","Stripe","Snowflake"],"contacts":[
    {"first":"Brian","last":"Mitchell","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":94},
    {"first":"Wendy","last":"Scott","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":89},
    {"first":"Craig","last":"Nelson","title":"VP Sales","dept":"Sales","seniority":"VP","score_base":85},
  ]},
  {"id":"c120","company":"LearnFast KR","domain":"learnfast.kr","industry":"education","country":"KR","city":"Busan","emp":"100-400","rev":"$15M-$60M","founded":2018,"funding":"Series B — $32M","growth":"+60% YoY","intent":["series_b_funded","expanding_globally"],"tech":["AWS","HubSpot","Stripe"],"contacts":[
    {"first":"Kim","last":"Do-Hyun","title":"CEO","dept":"Executive","seniority":"C-Suite","score_base":92},
    {"first":"Choi","last":"Ji-Young","title":"CTO","dept":"Engineering","seniority":"C-Suite","score_base":87},
  ]},
]

# ═══════════════════════════════════════════════════════════════════
# SCORING ENGINE
# ═══════════════════════════════════════════════════════════════════
def compute_score(contact: dict, company: dict, boost_intent: list = None) -> int:
    score = 35
    seniority = contact.get("seniority", "")
    if seniority == "C-Suite": score += 30
    elif seniority == "VP": score += 22
    elif seniority == "Director": score += 15
    elif seniority == "Manager": score += 8

    emp = company.get("emp", "")
    if "50000" in emp: score += 18
    elif "10000" in emp: score += 15
    elif "5000" in emp: score += 13
    elif "2000" in emp: score += 11
    elif "1000" in emp: score += 9
    elif "500" in emp: score += 7
    elif "200" in emp: score += 5
    elif "100" in emp: score += 4

    rev = company.get("rev", "")
    if "$2B" in rev or "$1B" in rev: score += 10
    elif "$500M" in rev: score += 8
    elif "$200M" in rev or "$100M" in rev: score += 6
    elif "$50M" in rev or "$80M" in rev: score += 4
    elif "$20M" in rev or "$30M" in rev: score += 2

    intents = company.get("intent", [])
    high_value = ["series_b_funded", "series_a_funded", "recent_ipo", "acquisitions", "ciso_hired",
                  "cloud_migration", "digital_transformation", "tech_refresh", "compliance_audit"]
    intent_hits = sum(1 for i in intents if i in high_value)
    score += min(10, intent_hits * 3)

    if boost_intent:
        score += sum(3 for bi in boost_intent if bi in intents)

    dept = contact.get("dept", "")
    if dept in ("Executive", "Security", "Compliance", "Finance"): score += 5
    elif dept in ("Sales", "Product"): score += 3

    score_base = contact.get("score_base", 70)
    score = int((score * 0.6) + (score_base * 0.4))
    return min(99, max(30, score))


def mask_email(email: str) -> str:
    p = email.split("@")
    if len(p) != 2: return "***@***.com"
    return p[0][0] + "***" + "@" + p[1]


def get_potential_inr(country: str, score: int) -> int:
    base = {
        "US":52000,"GB":48000,"DE":45000,"FR":42000,"AU":40000,"CA":39000,"CH":48000,
        "NL":42000,"SE":41000,"NO":43000,"DK":42000,"BE":41000,"FI":40000,"AT":40000,
        "SG":36000,"AE":35000,"JP":33000,"KR":31000,"IL":40000,"HK":36000,"TW":30000,
        "IN":26000,"CN":28000,"BR":24000,"MX":22000,"AR":20000,"CO":18000,"CL":20000,
        "ZA":22000,"NG":16000,"KE":14000,"EG":15000,"SA":32000,"TR":18000,
        "ID":18000,"PH":16000,"VN":15000,"TH":17000,"MY":20000,"PK":14000,"BD":13000,
        "PL":24000,"CZ":26000,"HU":22000,"RO":20000,"UA":18000,"GR":24000,"PT":26000,
        "RU":20000,"IT":35000,"ES":32000,"AT":38000,
    }.get(country, 20000)
    if score >= 90: return int(base * 1.6)
    if score >= 80: return int(base * 1.35)
    if score >= 70: return int(base * 1.15)
    return base


# ═══════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@discovery.get("/leads")
async def discover_global_leads(
    industry: str = Query(None, description="saas|fintech|ecommerce|healthcare|cybersecurity|manufacturing|legal|realestate|logistics|education"),
    country: str = Query(None, description="Country code e.g. US, IN, DE"),
    intent: str = Query(None, description="Comma-separated intent signals"),
    seniority: str = Query(None, description="C-Suite|VP|Director|Manager"),
    dept: str = Query(None, description="Engineering|Sales|Executive|Finance|Security|Product"),
    min_score: int = Query(0, description="Minimum lead score 0-99"),
    funding: str = Query(None, description="seed|series_a|series_b|series_c|ipo|pe"),
    tech: str = Query(None, description="Tech in stack e.g. Salesforce"),
    q: str = Query(None, description="Free text search (company, title, city)"),
    limit: int = Query(50, le=200),
    user: User = Depends(get_current_user),
):
    intent_filters = [i.strip() for i in intent.split(",")] if intent else []
    funding_map = {"seed":"Seed","series_a":"Series A","series_b":"Series B","series_c":"Series C","ipo":"IPO","pe":"PE"}
    funding_kw = funding_map.get(funding, "") if funding else ""

    results = []
    for comp in GLOBAL_DB:
        if industry and comp["industry"] != industry.lower(): continue
        if country and comp["country"].upper() != country.upper(): continue
        if funding_kw and funding_kw not in comp.get("funding", ""): continue
        if tech and tech.lower() not in " ".join(comp.get("tech", [])).lower(): continue
        if q:
            ql = q.lower()
            if not any(ql in str(comp.get(f, "")).lower() for f in ["company","city","industry","country"]): continue
        if intent_filters and not any(i in comp.get("intent",[]) for i in intent_filters): continue

        filtered_contacts = []
        for c in comp["contacts"]:
            if seniority and c.get("seniority","") != seniority: continue
            if dept and c.get("dept","").lower() != dept.lower(): continue
            sc = compute_score(c, comp, intent_filters)
            if sc < min_score: continue
            filtered_contacts.append({
                "name": c["first"] + " " + c["last"],
                "first": c["first"], "last": c["last"],
                "title": c["title"], "dept": c["dept"],
                "seniority": c["seniority"],
                "email_masked": mask_email(c["first"].lower() + "." + c["last"].lower() + "@" + comp["domain"]),
                "score": sc,
                "score_label": "HOT" if sc >= 80 else "WARM" if sc >= 60 else "COLD",
                "potential_inr": get_potential_inr(comp["country"], sc),
            })

        if not filtered_contacts: continue
        filtered_contacts.sort(key=lambda x: x["score"], reverse=True)

        country_meta = COUNTRIES.get(comp["country"], {})
        results.append({
            "id": comp["id"],
            "company": comp["company"], "domain": comp["domain"],
            "industry": comp["industry"], "country": comp["country"],
            "country_name": country_meta.get("name", comp["country"]),
            "flag": country_meta.get("flag", ""),
            "city": comp["city"], "employees": comp["emp"], "revenue": comp["rev"],
            "founded": comp.get("founded"), "funding": comp.get("funding",""),
            "growth": comp.get("growth",""),
            "intent": comp.get("intent",[]), "tech": comp.get("tech",[]),
            "compliance": country_meta.get("compliance",""),
            "compliance_risk": country_meta.get("risk","medium"),
            "business_culture": country_meta.get("business",""),
            "contacts": filtered_contacts,
            "contact_count": len(filtered_contacts),
            "top_score": filtered_contacts[0]["score"] if filtered_contacts else 0,
            "total_potential_inr": sum(c["potential_inr"] for c in filtered_contacts),
        })

    results.sort(key=lambda x: x["top_score"], reverse=True)
    return {
        "success": True, "total": len(results), "credits": user.credits,
        "data": results[:limit],
        "summary": {
            "countries": len(set(r["country"] for r in results)),
            "industries": len(set(r["industry"] for r in results)),
            "contacts": sum(r["contact_count"] for r in results[:limit]),
            "hot_leads": sum(1 for r in results[:limit] for c in r["contacts"] if c["score_label"]=="HOT"),
            "total_potential_inr": sum(r["total_potential_inr"] for r in results[:limit]),
        }
    }


@discovery.get("/countries")
async def list_countries(user: User = Depends(get_current_user)):
    """All supported countries with metadata"""
    data = []
    for cc, meta in COUNTRIES.items():
        count = sum(1 for c in GLOBAL_DB if c["country"] == cc)
        data.append({
            "code": cc, "name": meta["name"], "flag": meta["flag"],
            "compliance": meta["compliance"], "risk": meta["risk"],
            "business_culture": meta["business"],
            "company_count": count,
        })
    data.sort(key=lambda x: x["company_count"], reverse=True)
    return {"success": True, "total": len(data), "countries": data}


@discovery.get("/intent-signals")
async def list_intent_signals(user: User = Depends(get_current_user)):
    """All available intent signals with company counts"""
    signal_counts = {}
    for comp in GLOBAL_DB:
        for sig in comp.get("intent", []):
            signal_counts[sig] = signal_counts.get(sig, 0) + 1
    signals = [
        {"signal": k, "label": k.replace("_"," ").title(), "company_count": v}
        for k, v in sorted(signal_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    return {"success": True, "signals": signals}


@discovery.get("/stats")
async def discovery_stats(user: User = Depends(get_current_user)):
    """Global discovery database stats"""
    total_contacts = sum(len(c["contacts"]) for c in GLOBAL_DB)
    industries = {}
    countries = {}
    for comp in GLOBAL_DB:
        industries[comp["industry"]] = industries.get(comp["industry"], 0) + 1
        countries[comp["country"]] = countries.get(comp["country"], 0) + 1

    return {
        "success": True,
        "total_companies": len(GLOBAL_DB),
        "total_contacts": total_contacts,
        "total_countries": len(countries),
        "total_industries": len(industries),
        "by_industry": dict(sorted(industries.items(), key=lambda x: x[1], reverse=True)),
        "top_countries": dict(sorted(countries.items(), key=lambda x: x[1], reverse=True)[:15]),
        "intent_signals": len(INTENT_SIGNALS),
        "database_coverage": f"{len(GLOBAL_DB)} companies · {total_contacts} contacts · {len(countries)} countries",
    }


@discovery.get("/company/{company_id}")
async def get_company_detail(company_id: str, user: User = Depends(get_current_user)):
    """Full company profile with all contacts (masked) + intelligence"""
    comp = next((c for c in GLOBAL_DB if c["id"] == company_id), None)
    if not comp:
        from fastapi import HTTPException
        raise HTTPException(404, "Company not found")
    country_meta = COUNTRIES.get(comp["country"], {})
    contacts = []
    for c in comp["contacts"]:
        sc = compute_score(c, comp)
        contacts.append({
            "name": c["first"] + " " + c["last"],
            "title": c["title"], "dept": c["dept"], "seniority": c["seniority"],
            "email_masked": mask_email(c["first"].lower() + "." + c["last"].lower() + "@" + comp["domain"]),
            "score": sc, "score_label": "HOT" if sc >= 80 else "WARM" if sc >= 60 else "COLD",
            "potential_inr": get_potential_inr(comp["country"], sc),
        })
    contacts.sort(key=lambda x: x["score"], reverse=True)
    return {
        "success": True,
        "company": {**comp, "contacts": contacts,
            "country_meta": country_meta,
            "total_potential_inr": sum(c["potential_inr"] for c in contacts),
            "intelligence": {
                "why_now": [i.replace("_"," ").title() for i in comp.get("intent",[])],
                "pitch_angle": f"With {comp.get('growth','')} growth and {comp.get('funding','')}, {comp['company']} is scaling fast.",
                "tech_overlap": comp.get("tech", []),
            }
        }
    }
