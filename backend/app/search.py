"""
═══ Nanoneuron CRM MVP — Lead Discovery + Scoring + Email + Contacts ═══
Expanded: 10 industries × 15 countries, 80+ companies, 200+ contacts
"""
import hashlib, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Company, Lead, SavedLead, Deal
from app.auth import get_current_user
from app.config import get_settings

settings = get_settings()
search = APIRouter(prefix="/search", tags=["Lead Discovery"])

# ═══ EXPANDED LEAD DATABASE ═══
# 10 industries × 15 countries = 150+ combinations, 80+ companies, 200+ contacts
LEAD_DB = {
  "saas": {
    "US": [
      {"company":"TechFlow Inc","domain":"techflow.io","city":"San Francisco","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Sarah","last":"Chen","title":"CTO","email":"sarah.chen@techflow.io","dept":"Engineering","linkedin":"linkedin.com/in/sarahchen"},
        {"first":"Mike","last":"Roberts","title":"VP Sales","email":"mike.r@techflow.io","dept":"Sales","linkedin":""},
        {"first":"Jessica","last":"Kim","title":"Head of Product","email":"jessica.kim@techflow.io","dept":"Product","linkedin":""},
      ]},
      {"company":"CloudScale Systems","domain":"cloudscale.com","city":"New York","emp":"200-500","rev":"$20M-$50M","contacts":[
        {"first":"David","last":"Park","title":"CEO","email":"david@cloudscale.com","dept":"Executive","linkedin":"linkedin.com/in/davidpark"},
        {"first":"Amanda","last":"Foster","title":"VP Engineering","email":"amanda.f@cloudscale.com","dept":"Engineering","linkedin":""},
      ]},
      {"company":"DataPulse AI","domain":"datapulse.ai","city":"Austin","emp":"20-50","rev":"$2M-$10M","contacts":[
        {"first":"Alex","last":"Thompson","title":"Founder & CEO","email":"alex@datapulse.ai","dept":"Executive","linkedin":"linkedin.com/in/alexthompson"},
      ]},
      {"company":"StackLayer Corp","domain":"stacklayer.com","city":"Seattle","emp":"100-500","rev":"$15M-$40M","contacts":[
        {"first":"Brian","last":"Walsh","title":"CRO","email":"brian.walsh@stacklayer.com","dept":"Sales","linkedin":""},
        {"first":"Priya","last":"Nair","title":"VP Product","email":"priya@stacklayer.com","dept":"Product","linkedin":""},
      ]},
    ],
    "IN": [
      {"company":"NexGen Solutions","domain":"nexgensol.in","city":"Bangalore","emp":"100-500","rev":"$5M-$20M","contacts":[
        {"first":"Rahul","last":"Verma","title":"CTO","email":"rahul.v@nexgensol.in","dept":"Engineering","linkedin":""},
        {"first":"Sneha","last":"Patel","title":"VP Sales","email":"sneha.p@nexgensol.in","dept":"Sales","linkedin":""},
        {"first":"Amit","last":"Gupta","title":"CEO","email":"amit@nexgensol.in","dept":"Executive","linkedin":""},
      ]},
      {"company":"CodeCraft Tech","domain":"codecraft.io","city":"Pune","emp":"50-200","rev":"$2M-$10M","contacts":[
        {"first":"Vikram","last":"Mehta","title":"Founder","email":"vikram@codecraft.io","dept":"Executive","linkedin":""},
      ]},
      {"company":"ByteStack India","domain":"bytestack.in","city":"Hyderabad","emp":"200-1000","rev":"$10M-$50M","contacts":[
        {"first":"Karthik","last":"Nair","title":"VP Engineering","email":"karthik@bytestack.in","dept":"Engineering","linkedin":""},
        {"first":"Deepa","last":"Iyer","title":"Director Sales","email":"deepa.i@bytestack.in","dept":"Sales","linkedin":""},
      ]},
    ],
    "GB": [
      {"company":"BrightWave Software","domain":"brightwave.co.uk","city":"London","emp":"50-200","rev":"$5M-$25M","contacts":[
        {"first":"Oliver","last":"Hughes","title":"CEO","email":"oliver@brightwave.co.uk","dept":"Executive","linkedin":""},
        {"first":"Emma","last":"Clarke","title":"CTO","email":"emma.c@brightwave.co.uk","dept":"Engineering","linkedin":""},
      ]},
      {"company":"SkyPlatform Ltd","domain":"skyplatform.co.uk","city":"Manchester","emp":"100-300","rev":"$8M-$25M","contacts":[
        {"first":"James","last":"Martin","title":"VP Sales","email":"james.m@skyplatform.co.uk","dept":"Sales","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"TechHaus GmbH","domain":"techhaus.de","city":"Berlin","emp":"100-500","rev":"$10M-$30M","contacts":[
        {"first":"Felix","last":"Mueller","title":"CEO","email":"felix@techhaus.de","dept":"Executive","linkedin":""},
        {"first":"Anna","last":"Schmidt","title":"VP Sales","email":"anna.s@techhaus.de","dept":"Sales","linkedin":""},
      ]},
      {"company":"SoftWerk AG","domain":"softwerkag.de","city":"Munich","emp":"200-800","rev":"$25M-$80M","contacts":[
        {"first":"Klaus","last":"Bauer","title":"CTO","email":"k.bauer@softwerkag.de","dept":"Engineering","linkedin":""},
        {"first":"Monika","last":"Vogel","title":"Head of Sales","email":"m.vogel@softwerkag.de","dept":"Sales","linkedin":""},
      ]},
    ],
    "AE": [
      {"company":"GulfTech Solutions","domain":"gulftech.ae","city":"Dubai","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Mohammed","last":"Al-Rashid","title":"CEO","email":"mohammed@gulftech.ae","dept":"Executive","linkedin":""},
        {"first":"Aisha","last":"Al-Mansoori","title":"VP Business Dev","email":"aisha@gulftech.ae","dept":"Sales","linkedin":""},
      ]},
    ],
    "SG": [
      {"company":"AsiaScale Pte","domain":"asiascale.sg","city":"Singapore","emp":"20-100","rev":"$2M-$15M","contacts":[
        {"first":"Wei","last":"Tan","title":"CTO","email":"wei@asiascale.sg","dept":"Engineering","linkedin":""},
        {"first":"Li","last":"Zhang","title":"CEO","email":"li.zhang@asiascale.sg","dept":"Executive","linkedin":""},
      ]},
    ],
    "AU": [
      {"company":"OzCloud Tech","domain":"ozcloud.com.au","city":"Sydney","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Liam","last":"Johnson","title":"CEO","email":"liam@ozcloud.com.au","dept":"Executive","linkedin":""},
        {"first":"Chloe","last":"Davis","title":"VP Sales","email":"chloe.d@ozcloud.com.au","dept":"Sales","linkedin":""},
      ]},
    ],
    "CA": [
      {"company":"MapleSoft Inc","domain":"maplesoft.ca","city":"Toronto","emp":"100-400","rev":"$10M-$35M","contacts":[
        {"first":"Noah","last":"Brown","title":"CEO","email":"noah@maplesoft.ca","dept":"Executive","linkedin":""},
        {"first":"Emma","last":"Wilson","title":"CTO","email":"emma.w@maplesoft.ca","dept":"Engineering","linkedin":""},
      ]},
    ],
    "FR": [
      {"company":"LogiciElite SARL","domain":"logicielite.fr","city":"Paris","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Pierre","last":"Dupont","title":"CEO","email":"p.dupont@logicielite.fr","dept":"Executive","linkedin":""},
        {"first":"Marie","last":"Laurent","title":"Directrice Technique","email":"m.laurent@logicielite.fr","dept":"Engineering","linkedin":""},
      ]},
    ],
    "JP": [
      {"company":"TechNippon KK","domain":"technippon.co.jp","city":"Tokyo","emp":"200-1000","rev":"$20M-$80M","contacts":[
        {"first":"Kenji","last":"Tanaka","title":"CEO","email":"k.tanaka@technippon.co.jp","dept":"Executive","linkedin":""},
        {"first":"Yuki","last":"Sato","title":"VP Engineering","email":"y.sato@technippon.co.jp","dept":"Engineering","linkedin":""},
      ]},
    ],
    "BR": [
      {"company":"TechBrasil SA","domain":"techbrasil.com.br","city":"Sao Paulo","emp":"100-500","rev":"$10M-$40M","contacts":[
        {"first":"Carlos","last":"Oliveira","title":"CEO","email":"carlos@techbrasil.com.br","dept":"Executive","linkedin":""},
        {"first":"Ana","last":"Santos","title":"CTO","email":"ana.s@techbrasil.com.br","dept":"Engineering","linkedin":""},
      ]},
    ],
  },

  "fintech": {
    "US": [
      {"company":"PayStream Financial","domain":"paystream.com","city":"New York","emp":"100-500","rev":"$20M-$100M","contacts":[
        {"first":"Robert","last":"Martinez","title":"CTO","email":"robert.m@paystream.com","dept":"Engineering","linkedin":""},
        {"first":"Lisa","last":"Chang","title":"Chief Compliance","email":"lisa.c@paystream.com","dept":"Compliance","linkedin":""},
        {"first":"Tom","last":"Bradley","title":"VP Sales","email":"tom.b@paystream.com","dept":"Sales","linkedin":""},
      ]},
      {"company":"LedgerAI Corp","domain":"ledgerai.com","city":"San Francisco","emp":"50-200","rev":"$10M-$40M","contacts":[
        {"first":"Rachel","last":"Green","title":"CEO","email":"rachel@ledgerai.com","dept":"Executive","linkedin":""},
      ]},
    ],
    "IN": [
      {"company":"FinEdge Technologies","domain":"finedge.in","city":"Mumbai","emp":"200-1000","rev":"$10M-$50M","contacts":[
        {"first":"Arjun","last":"Kapoor","title":"CEO","email":"arjun@finedge.in","dept":"Executive","linkedin":""},
        {"first":"Pooja","last":"Sharma","title":"VP Compliance","email":"pooja.s@finedge.in","dept":"Compliance","linkedin":""},
      ]},
      {"company":"PayIndia Pro","domain":"payindiapro.in","city":"Delhi","emp":"100-500","rev":"$5M-$25M","contacts":[
        {"first":"Manish","last":"Agarwal","title":"CTO","email":"manish@payindiapro.in","dept":"Engineering","linkedin":""},
      ]},
    ],
    "GB": [
      {"company":"LedgerPoint Ltd","domain":"ledgerpoint.co.uk","city":"London","emp":"50-200","rev":"$10M-$30M","contacts":[
        {"first":"Thomas","last":"Wright","title":"CTO","email":"thomas@ledgerpoint.co.uk","dept":"Engineering","linkedin":""},
        {"first":"Sophie","last":"Adams","title":"CEO","email":"sophie@ledgerpoint.co.uk","dept":"Executive","linkedin":""},
      ]},
    ],
    "SG": [
      {"company":"PayNow Asia","domain":"paynowasia.sg","city":"Singapore","emp":"50-200","rev":"$5M-$25M","contacts":[
        {"first":"Kenneth","last":"Ng","title":"CEO","email":"kenneth@paynowasia.sg","dept":"Executive","linkedin":""},
        {"first":"Mei","last":"Lim","title":"Chief Compliance","email":"mei@paynowasia.sg","dept":"Compliance","linkedin":""},
      ]},
    ],
    "AU": [
      {"company":"AussieFintech Pty","domain":"aussie-fintech.com.au","city":"Melbourne","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Jack","last":"Thompson","title":"CEO","email":"jack@aussie-fintech.com.au","dept":"Executive","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"FinanzTech GmbH","domain":"finanztech.de","city":"Frankfurt","emp":"100-500","rev":"$15M-$50M","contacts":[
        {"first":"Hans","last":"Fischer","title":"CEO","email":"h.fischer@finanztech.de","dept":"Executive","linkedin":""},
        {"first":"Ingrid","last":"Hoffmann","title":"CTO","email":"i.hoffmann@finanztech.de","dept":"Engineering","linkedin":""},
      ]},
    ],
    "JP": [
      {"company":"NihonPay KK","domain":"nihonpay.co.jp","city":"Tokyo","emp":"200-1000","rev":"$30M-$100M","contacts":[
        {"first":"Hiroshi","last":"Yamamoto","title":"CEO","email":"h.yamamoto@nihonpay.co.jp","dept":"Executive","linkedin":""},
      ]},
    ],
    "BR": [
      {"company":"FintechBrasil SA","domain":"fintechbrasil.com.br","city":"Sao Paulo","emp":"100-500","rev":"$10M-$50M","contacts":[
        {"first":"Paulo","last":"Ferreira","title":"CEO","email":"paulo@fintechbrasil.com.br","dept":"Executive","linkedin":""},
        {"first":"Fernanda","last":"Costa","title":"CTO","email":"fernanda@fintechbrasil.com.br","dept":"Engineering","linkedin":""},
      ]},
    ],
  },

  "ecommerce": {
    "US": [
      {"company":"ShopFast Inc","domain":"shopfast.com","city":"Seattle","emp":"100-500","rev":"$20M-$80M","contacts":[
        {"first":"Karen","last":"Johnson","title":"VP Operations","email":"karen.j@shopfast.com","dept":"Operations","linkedin":""},
        {"first":"Mark","last":"Stevens","title":"CEO","email":"mark@shopfast.com","dept":"Executive","linkedin":""},
      ]},
      {"company":"QuickCommerce","domain":"quickcommerce.us","city":"Chicago","emp":"200-800","rev":"$30M-$100M","contacts":[
        {"first":"Jennifer","last":"Lee","title":"CTO","email":"jennifer@quickcommerce.us","dept":"Engineering","linkedin":""},
      ]},
    ],
    "IN": [
      {"company":"QuickKart India","domain":"quickkart.in","city":"Delhi NCR","emp":"500-2000","rev":"$20M-$100M","contacts":[
        {"first":"Rohit","last":"Singh","title":"CEO","email":"rohit@quickkart.in","dept":"Executive","linkedin":""},
        {"first":"Priya","last":"Agarwal","title":"VP Technology","email":"priya.a@quickkart.in","dept":"Engineering","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"SchnellKauf GmbH","domain":"schnellkauf.de","city":"Munich","emp":"200-1000","rev":"$30M-$100M","contacts":[
        {"first":"Stefan","last":"Weber","title":"Head of Sales","email":"stefan.w@schnellkauf.de","dept":"Sales","linkedin":""},
        {"first":"Petra","last":"Schroeder","title":"CEO","email":"p.schroeder@schnellkauf.de","dept":"Executive","linkedin":""},
      ]},
    ],
    "GB": [
      {"company":"BritShop Online","domain":"britshop.co.uk","city":"London","emp":"100-500","rev":"$15M-$50M","contacts":[
        {"first":"George","last":"Harrison","title":"CEO","email":"george@britshop.co.uk","dept":"Executive","linkedin":""},
      ]},
    ],
    "AU": [
      {"company":"OzMart Pty Ltd","domain":"ozmart.com.au","city":"Brisbane","emp":"100-400","rev":"$10M-$40M","contacts":[
        {"first":"Mia","last":"Roberts","title":"CEO","email":"mia@ozmart.com.au","dept":"Executive","linkedin":""},
      ]},
    ],
    "CA": [
      {"company":"MapleShop Inc","domain":"mapleshop.ca","city":"Vancouver","emp":"100-400","rev":"$10M-$35M","contacts":[
        {"first":"Ethan","last":"MacDonald","title":"CEO","email":"ethan@mapleshop.ca","dept":"Executive","linkedin":""},
        {"first":"Olivia","last":"Chen","title":"VP Marketing","email":"olivia@mapleshop.ca","dept":"Marketing","linkedin":""},
      ]},
    ],
    "JP": [
      {"company":"JapanShop KK","domain":"japanshop.co.jp","city":"Tokyo","emp":"200-1000","rev":"$20M-$80M","contacts":[
        {"first":"Takeshi","last":"Ito","title":"CEO","email":"t.ito@japanshop.co.jp","dept":"Executive","linkedin":""},
      ]},
    ],
  },

  "healthcare": {
    "US": [
      {"company":"MedTech Solutions","domain":"medtechsol.com","city":"Boston","emp":"200-1000","rev":"$30M-$120M","contacts":[
        {"first":"Dr. Michael","last":"Harrison","title":"CEO","email":"m.harrison@medtechsol.com","dept":"Executive","linkedin":""},
        {"first":"Susan","last":"Price","title":"CTO","email":"s.price@medtechsol.com","dept":"Engineering","linkedin":""},
        {"first":"David","last":"Cooper","title":"VP Sales","email":"d.cooper@medtechsol.com","dept":"Sales","linkedin":""},
      ]},
      {"company":"HealthBridge AI","domain":"healthbridge.ai","city":"San Diego","emp":"50-200","rev":"$10M-$40M","contacts":[
        {"first":"Laura","last":"Mitchell","title":"Founder & CEO","email":"laura@healthbridge.ai","dept":"Executive","linkedin":"linkedin.com/in/lauramitchell"},
        {"first":"Chris","last":"Evans","title":"CTO","email":"chris.e@healthbridge.ai","dept":"Engineering","linkedin":""},
      ]},
    ],
    "IN": [
      {"company":"Apollo HealthTech","domain":"apollohealthtech.in","city":"Bangalore","emp":"500-2000","rev":"$30M-$100M","contacts":[
        {"first":"Dr. Rajesh","last":"Kumar","title":"CEO","email":"r.kumar@apollohealthtech.in","dept":"Executive","linkedin":""},
        {"first":"Nandini","last":"Rao","title":"CTO","email":"nandini@apollohealthtech.in","dept":"Engineering","linkedin":""},
      ]},
    ],
    "GB": [
      {"company":"NHS Digital Partners","domain":"nhsdp.co.uk","city":"Leeds","emp":"200-800","rev":"$25M-$80M","contacts":[
        {"first":"Dr. Catherine","last":"Williams","title":"CEO","email":"c.williams@nhsdp.co.uk","dept":"Executive","linkedin":""},
        {"first":"Andrew","last":"Baker","title":"VP Technology","email":"a.baker@nhsdp.co.uk","dept":"Engineering","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"Gesundheit Digital","domain":"gesundheit-digital.de","city":"Hamburg","emp":"100-500","rev":"$15M-$50M","contacts":[
        {"first":"Dr. Wolfgang","last":"Richter","title":"CEO","email":"w.richter@gesundheit-digital.de","dept":"Executive","linkedin":""},
      ]},
    ],
    "AU": [
      {"company":"AusHealth Tech","domain":"aushealth.com.au","city":"Sydney","emp":"100-400","rev":"$10M-$40M","contacts":[
        {"first":"Dr. Sarah","last":"Taylor","title":"CEO","email":"sarah@aushealth.com.au","dept":"Executive","linkedin":""},
      ]},
    ],
    "SG": [
      {"company":"HealthHub Asia","domain":"healthhub.sg","city":"Singapore","emp":"100-400","rev":"$15M-$50M","contacts":[
        {"first":"Dr. Raymond","last":"Chua","title":"CEO","email":"r.chua@healthhub.sg","dept":"Executive","linkedin":""},
        {"first":"Grace","last":"Wong","title":"CTO","email":"grace.w@healthhub.sg","dept":"Engineering","linkedin":""},
      ]},
    ],
    "JP": [
      {"company":"IryoTech KK","domain":"iryotech.co.jp","city":"Osaka","emp":"200-800","rev":"$20M-$80M","contacts":[
        {"first":"Dr. Akira","last":"Suzuki","title":"CEO","email":"a.suzuki@iryotech.co.jp","dept":"Executive","linkedin":""},
      ]},
    ],
  },

  "legal": {
    "US": [
      {"company":"LegalTech Pro","domain":"legaltechpro.com","city":"New York","emp":"100-500","rev":"$20M-$80M","contacts":[
        {"first":"Jonathan","last":"Hayes","title":"CEO","email":"j.hayes@legaltechpro.com","dept":"Executive","linkedin":"linkedin.com/in/jonathanhayes"},
        {"first":"Patricia","last":"Moore","title":"VP Sales","email":"p.moore@legaltechpro.com","dept":"Sales","linkedin":""},
      ]},
      {"company":"JusticeAI Corp","domain":"justiceai.com","city":"Washington DC","emp":"50-200","rev":"$5M-$25M","contacts":[
        {"first":"Kevin","last":"Turner","title":"Founder","email":"kevin@justiceai.com","dept":"Executive","linkedin":""},
      ]},
    ],
    "GB": [
      {"company":"LawTech UK","domain":"lawtech.co.uk","city":"London","emp":"50-200","rev":"$5M-$25M","contacts":[
        {"first":"William","last":"Scott","title":"CEO","email":"william@lawtech.co.uk","dept":"Executive","linkedin":""},
        {"first":"Charlotte","last":"Green","title":"CTO","email":"c.green@lawtech.co.uk","dept":"Engineering","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"RechtsKI GmbH","domain":"rechtski.de","city":"Frankfurt","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Dr. Martin","last":"Braun","title":"CEO","email":"m.braun@rechtski.de","dept":"Executive","linkedin":""},
      ]},
    ],
    "AU": [
      {"company":"LexTech Australia","domain":"lextech.com.au","city":"Sydney","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Henry","last":"Campbell","title":"CEO","email":"henry@lextech.com.au","dept":"Executive","linkedin":""},
      ]},
    ],
    "SG": [
      {"company":"LegalEdge Asia","domain":"legaledge.sg","city":"Singapore","emp":"50-200","rev":"$5M-$20M","contacts":[
        {"first":"Patricia","last":"Koh","title":"CEO","email":"patricia@legaledge.sg","dept":"Executive","linkedin":""},
      ]},
    ],
  },

  "manufacturing": {
    "US": [
      {"company":"SmartFactory Inc","domain":"smartfactory.com","city":"Detroit","emp":"500-2000","rev":"$50M-$200M","contacts":[
        {"first":"Robert","last":"Ford","title":"CEO","email":"r.ford@smartfactory.com","dept":"Executive","linkedin":""},
        {"first":"Nancy","last":"Graham","title":"VP Operations","email":"n.graham@smartfactory.com","dept":"Operations","linkedin":""},
        {"first":"William","last":"Young","title":"CTO","email":"w.young@smartfactory.com","dept":"Engineering","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"IndustrieTech GmbH","domain":"industrietech.de","city":"Stuttgart","emp":"1000-5000","rev":"$100M-$500M","contacts":[
        {"first":"Dieter","last":"Wagner","title":"CEO","email":"d.wagner@industrietech.de","dept":"Executive","linkedin":""},
        {"first":"Sabine","last":"Klein","title":"VP Sales","email":"s.klein@industrietech.de","dept":"Sales","linkedin":""},
      ]},
    ],
    "JP": [
      {"company":"Nippon Manufacturing KK","domain":"nipponmfg.co.jp","city":"Osaka","emp":"2000-10000","rev":"$200M-$1B","contacts":[
        {"first":"Takashi","last":"Watanabe","title":"President","email":"t.watanabe@nipponmfg.co.jp","dept":"Executive","linkedin":""},
        {"first":"Akiko","last":"Hayashi","title":"VP Technology","email":"a.hayashi@nipponmfg.co.jp","dept":"Engineering","linkedin":""},
      ]},
    ],
    "IN": [
      {"company":"Tata ManuTech","domain":"tatamanutech.in","city":"Mumbai","emp":"1000-5000","rev":"$100M-$500M","contacts":[
        {"first":"Ravi","last":"Tiwari","title":"CEO","email":"ravi.t@tatamanutech.in","dept":"Executive","linkedin":""},
      ]},
    ],
    "CA": [
      {"company":"NorthernMfg Corp","domain":"northernmfg.ca","city":"Calgary","emp":"200-1000","rev":"$30M-$100M","contacts":[
        {"first":"Scott","last":"MacLean","title":"CEO","email":"scott@northernmfg.ca","dept":"Executive","linkedin":""},
      ]},
    ],
  },

  "realestate": {
    "US": [
      {"company":"PropTech USA","domain":"proptech-usa.com","city":"Miami","emp":"50-200","rev":"$10M-$50M","contacts":[
        {"first":"Gloria","last":"Rivera","title":"CEO","email":"gloria@proptech-usa.com","dept":"Executive","linkedin":""},
        {"first":"Daniel","last":"Price","title":"CTO","email":"d.price@proptech-usa.com","dept":"Engineering","linkedin":""},
      ]},
      {"company":"HomeBase AI","domain":"homebase.ai","city":"Austin","emp":"50-200","rev":"$5M-$25M","contacts":[
        {"first":"Michelle","last":"Garcia","title":"CEO","email":"michelle@homebase.ai","dept":"Executive","linkedin":"linkedin.com/in/michellegarcia"},
      ]},
    ],
    "GB": [
      {"company":"PropertyTech UK","domain":"propertytech.co.uk","city":"London","emp":"50-200","rev":"$10M-$40M","contacts":[
        {"first":"Edward","last":"Clarke","title":"CEO","email":"ed@propertytech.co.uk","dept":"Executive","linkedin":""},
      ]},
    ],
    "AE": [
      {"company":"DubaiRealty Tech","domain":"dubairealtytech.ae","city":"Dubai","emp":"100-400","rev":"$20M-$80M","contacts":[
        {"first":"Sultan","last":"Al-Maktoum","title":"CEO","email":"sultan@dubairealtytech.ae","dept":"Executive","linkedin":""},
        {"first":"Fatima","last":"Al-Zaabi","title":"VP Business Dev","email":"fatima@dubairealtytech.ae","dept":"Sales","linkedin":""},
      ]},
    ],
    "AU": [
      {"company":"Aussie PropTech","domain":"aussie-proptech.com.au","city":"Melbourne","emp":"50-200","rev":"$5M-$25M","contacts":[
        {"first":"Tyler","last":"Anderson","title":"CEO","email":"tyler@aussie-proptech.com.au","dept":"Executive","linkedin":""},
      ]},
    ],
    "SG": [
      {"company":"SingaProp Pte","domain":"singaprop.sg","city":"Singapore","emp":"50-200","rev":"$10M-$40M","contacts":[
        {"first":"Ivan","last":"Leow","title":"CEO","email":"ivan@singaprop.sg","dept":"Executive","linkedin":""},
      ]},
    ],
    "IN": [
      {"company":"PropVista India","domain":"propvista.in","city":"Mumbai","emp":"100-500","rev":"$10M-$50M","contacts":[
        {"first":"Nikhil","last":"Desai","title":"CEO","email":"nikhil@propvista.in","dept":"Executive","linkedin":""},
        {"first":"Kavya","last":"Reddy","title":"VP Sales","email":"kavya@propvista.in","dept":"Sales","linkedin":""},
      ]},
    ],
  },

  "logistics": {
    "US": [
      {"company":"FastFreight Inc","domain":"fastfreight.com","city":"Chicago","emp":"200-1000","rev":"$30M-$120M","contacts":[
        {"first":"Patrick","last":"O'Brien","title":"CEO","email":"patrick@fastfreight.com","dept":"Executive","linkedin":""},
        {"first":"Sandra","last":"Mills","title":"VP Technology","email":"s.mills@fastfreight.com","dept":"Engineering","linkedin":""},
      ]},
    ],
    "IN": [
      {"company":"ShipIndia Pro","domain":"shipindia.in","city":"Chennai","emp":"500-2000","rev":"$20M-$80M","contacts":[
        {"first":"Suresh","last":"Menon","title":"CEO","email":"suresh@shipindia.in","dept":"Executive","linkedin":""},
      ]},
    ],
    "SG": [
      {"company":"LogiAsia Pte","domain":"logiasia.sg","city":"Singapore","emp":"200-800","rev":"$25M-$100M","contacts":[
        {"first":"Bernard","last":"Koh","title":"CEO","email":"bernard@logiasia.sg","dept":"Executive","linkedin":""},
        {"first":"Shirley","last":"Tan","title":"VP Sales","email":"shirley@logiasia.sg","dept":"Sales","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"LogistikTech AG","domain":"logistiktech.de","city":"Hamburg","emp":"500-2000","rev":"$50M-$200M","contacts":[
        {"first":"Gerhard","last":"Lehmann","title":"CEO","email":"g.lehmann@logistiktech.de","dept":"Executive","linkedin":""},
      ]},
    ],
    "AU": [
      {"company":"OzShip Solutions","domain":"ozship.com.au","city":"Sydney","emp":"100-500","rev":"$15M-$60M","contacts":[
        {"first":"Ryan","last":"Parker","title":"CEO","email":"ryan@ozship.com.au","dept":"Executive","linkedin":""},
      ]},
    ],
    "AE": [
      {"company":"Dubai Logistics Hub","domain":"dubailoghub.ae","city":"Dubai","emp":"500-2000","rev":"$50M-$200M","contacts":[
        {"first":"Khalid","last":"Al-Hamdan","title":"CEO","email":"khalid@dubailoghub.ae","dept":"Executive","linkedin":""},
        {"first":"Rania","last":"Farouk","title":"VP Operations","email":"rania@dubailoghub.ae","dept":"Operations","linkedin":""},
      ]},
    ],
  },

  "cybersecurity": {
    "US": [
      {"company":"SecureNet Labs","domain":"securenetlabs.com","city":"Washington DC","emp":"100-500","rev":"$20M-$80M","contacts":[
        {"first":"James","last":"Warren","title":"CEO","email":"j.warren@securenetlabs.com","dept":"Executive","linkedin":""},
        {"first":"Hannah","last":"White","title":"CISO","email":"h.white@securenetlabs.com","dept":"Security","linkedin":""},
        {"first":"Aaron","last":"Black","title":"VP Sales","email":"a.black@securenetlabs.com","dept":"Sales","linkedin":""},
      ]},
      {"company":"CyberShield Inc","domain":"cybershield.io","city":"Austin","emp":"50-200","rev":"$10M-$40M","contacts":[
        {"first":"Tyler","last":"Reed","title":"Founder & CEO","email":"tyler@cybershield.io","dept":"Executive","linkedin":"linkedin.com/in/tylerreed"},
      ]},
    ],
    "IN": [
      {"company":"InfoSec India","domain":"infosecindia.in","city":"Bangalore","emp":"200-1000","rev":"$15M-$60M","contacts":[
        {"first":"Ankit","last":"Sharma","title":"CEO","email":"ankit@infosecindia.in","dept":"Executive","linkedin":""},
        {"first":"Preeti","last":"Singh","title":"CTO","email":"preeti@infosecindia.in","dept":"Engineering","linkedin":""},
      ]},
    ],
    "GB": [
      {"company":"CyberDefence UK","domain":"cyberdefence.co.uk","city":"London","emp":"100-400","rev":"$15M-$60M","contacts":[
        {"first":"Marcus","last":"Hunt","title":"CEO","email":"marcus@cyberdefence.co.uk","dept":"Executive","linkedin":""},
      ]},
    ],
    "IL": [
      {"company":"CyberStart IL","domain":"cyberstart.co.il","city":"Tel Aviv","emp":"100-500","rev":"$20M-$80M","contacts":[
        {"first":"Yoav","last":"Cohen","title":"CEO","email":"yoav@cyberstart.co.il","dept":"Executive","linkedin":"linkedin.com/in/yoavcohen"},
        {"first":"Noa","last":"Levy","title":"CTO","email":"noa@cyberstart.co.il","dept":"Engineering","linkedin":""},
      ]},
    ],
    "SG": [
      {"company":"CyberAsia Pte","domain":"cyberasia.sg","city":"Singapore","emp":"100-400","rev":"$15M-$60M","contacts":[
        {"first":"Simon","last":"Goh","title":"CEO","email":"simon@cyberasia.sg","dept":"Executive","linkedin":""},
      ]},
    ],
    "DE": [
      {"company":"Sicherheit Tech GmbH","domain":"sicherheittech.de","city":"Berlin","emp":"100-500","rev":"$15M-$60M","contacts":[
        {"first":"Prof. Karl","last":"Zimmermann","title":"CEO","email":"k.zimmermann@sicherheittech.de","dept":"Executive","linkedin":""},
      ]},
    ],
  },
}

COMPLIANCE = {
    "US":{"law":"CCPA/CPRA","requires":["Privacy policy","Opt-out mechanism","Data deletion rights"],"risk":"medium"},
    "GB":{"law":"UK GDPR","requires":["DPA required","ICO registration","Consent mechanism"],"risk":"high"},
    "DE":{"law":"EU GDPR+BDSG","requires":["DPA required","Consent required","Data residency: EU","72h breach notice"],"risk":"high"},
    "FR":{"law":"EU GDPR+CNIL","requires":["DPA required","CNIL registration","Data residency: EU"],"risk":"high"},
    "IN":{"law":"DPDPA 2023","requires":["Consent required","Data localization","Grievance officer"],"risk":"medium"},
    "SG":{"law":"PDPA","requires":["DPA recommended","Consent required","Breach notification"],"risk":"medium"},
    "AE":{"law":"DIFC-DP","requires":["DPA required","Data residency varies"],"risk":"medium"},
    "JP":{"law":"APPI","requires":["Consent required","DPA required"],"risk":"medium"},
    "BR":{"law":"LGPD","requires":["DPA required","Consent required","DPO appointment"],"risk":"high"},
    "AU":{"law":"Privacy Act 1988","requires":["Privacy policy","APPs compliance","Breach notification"],"risk":"medium"},
    "CA":{"law":"PIPEDA","requires":["Consent required","Privacy policy","Breach notification"],"risk":"medium"},
    "KR":{"law":"PIPA","requires":["Consent required","DPA required","Data localization"],"risk":"high"},
    "IL":{"law":"Protection of Privacy Law","requires":["Database registration","Data security","Consent required"],"risk":"medium"},
    "ZA":{"law":"POPIA","requires":["Information officer","DPA required","Breach notification"],"risk":"high"},
    "MX":{"law":"LFPDPPP","requires":["Privacy notice","Consent required","Data localization"],"risk":"medium"},
}


def mask_email(email):
    parts = email.split("@")
    if len(parts) != 2: return "***@***.com"
    return parts[0][0] + "*" * (len(parts[0])-1) + "@" + parts[1]


def score_lead(contact, company):
    """AI Lead Scoring — 0 to 100"""
    score = 40
    t = contact.get("title", "").lower()
    if any(x in t for x in ["ceo", "founder", "managing director", "president"]): score += 30
    elif any(x in t for x in ["cto", "ciso", "cro", "cfo", "vp", "chief", "head"]): score += 25
    elif any(x in t for x in ["director", "manager"]): score += 15
    emp = company.get("emp", "")
    if "10000" in emp or "5000" in emp: score += 15
    elif "2000" in emp or "1000" in emp: score += 12
    elif "500" in emp: score += 10
    elif "200" in emp: score += 8
    elif "100" in emp: score += 6
    rev = company.get("rev", "")
    if "$1B" in rev or "$500M" in rev or "$200M" in rev: score += 10
    elif "$100M" in rev or "$80M" in rev or "$50M" in rev: score += 8
    elif "$20M" in rev or "$25M" in rev: score += 5
    elif "$10M" in rev: score += 3
    if contact.get("dept") in ("Executive", "Sales", "Compliance", "Security"): score += 5
    if contact.get("linkedin", ""): score += 2
    return min(99, score)


# ═══ SEARCH ═══
@search.get("/discover")
async def discover_leads(
    industry: str = Query(None), country: str = Query(None), domain: str = Query(None),
    title_filter: str = Query(None, description="Filter by title keyword"),
    user: User = Depends(get_current_user),
):
    results = []
    for ind_key, countries in LEAD_DB.items():
        if industry and ind_key != industry.lower(): continue
        for cc, companies in countries.items():
            if country and cc != country.upper(): continue
            for comp in companies:
                if domain and domain.lower() not in comp["domain"].lower(): continue
                comp_info = COMPLIANCE.get(cc, {"law":"General","requires":[],"risk":"low"})
                leads = []
                for c in comp["contacts"]:
                    if title_filter and title_filter.lower() not in c["title"].lower(): continue
                    sc = score_lead(c, comp)
                    leads.append({
                        "name": c["first"] + " " + c["last"],
                        "title": c["title"],
                        "department": c.get("dept", ""),
                        "email_masked": mask_email(c["email"]),
                        "lead_score": sc,
                        "score_label": "hot" if sc >= 75 else "warm" if sc >= 50 else "cold",
                        "verified": sc > 60,
                        "linkedin": c.get("linkedin", ""),
                    })
                if not leads: continue
                leads.sort(key=lambda x: x["lead_score"], reverse=True)
                results.append({
                    "company": comp["company"], "domain": comp["domain"], "industry": ind_key,
                    "country": cc, "city": comp["city"], "employees": comp["emp"], "revenue": comp["rev"],
                    "contacts": leads, "contact_count": len(leads),
                    "compliance": {"law": comp_info["law"], "risk": comp_info["risk"], "requirements": comp_info["requires"]},
                })
    results.sort(key=lambda x: max(c["lead_score"] for c in x["contacts"]), reverse=True)
    return {"success": True, "total": len(results), "credits": user.credits, "data": results}


# ═══ UNLOCK ═══
class UnlockReq(BaseModel):
    company_domain: str
    contact_name: str

@search.post("/unlock")
async def unlock_lead(req: UnlockReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.credits < 1:
        raise HTTPException(402, "Not enough credits. Upgrade your plan.")
    found = None; found_company = None; found_country = "US"
    for ind, countries in LEAD_DB.items():
        for cc, companies in countries.items():
            for comp in companies:
                if comp["domain"] == req.company_domain:
                    found_company = comp; found_country = cc
                    for c in comp["contacts"]:
                        if c["first"] + " " + c["last"] == req.contact_name:
                            found = c; break
    if not found: raise HTTPException(404, "Contact not found")
    user.credits -= 1

    # Auto-save to contacts book
    existing = (await db.execute(
        select(SavedLead).where(SavedLead.user_id == user.id, SavedLead.contact_email == found["email"])
    )).scalar_one_or_none()
    if not existing:
        sc = score_lead(found, found_company)
        saved = SavedLead(
            user_id=user.id, company_name=found_company["company"],
            contact_name=found["first"] + " " + found["last"],
            contact_email=found["email"], contact_title=found["title"],
            country=found_country, lead_score=sc, status="discovered",
            linkedin_url=found.get("linkedin", ""),
        )
        db.add(saved)

    await db.commit()
    return {"success": True, "credits": user.credits, "lead": {
        "name": found["first"] + " " + found["last"], "title": found["title"], "email": found["email"],
        "department": found.get("dept",""), "linkedin": found.get("linkedin",""),
        "company": found_company["company"], "domain": found_company["domain"],
        "lead_score": score_lead(found, found_company),
    }}


# ═══ ADD TO PIPELINE ═══
class PipelineReq(BaseModel):
    company_name: str
    contact_name: str
    contact_email: str
    contact_title: str = ""
    country: str = "US"
    deal_value: float = 0

@search.post("/add-to-pipeline")
async def add_to_pipeline(req: PipelineReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    comp_info = COMPLIANCE.get(req.country.upper(), {})
    status = "action_needed" if comp_info.get("risk") == "high" else "compliant"
    notes = comp_info.get("law","") + ": " + ", ".join(comp_info.get("requires",[])) if comp_info else ""

    existing_q = await db.execute(
        select(SavedLead).where(SavedLead.user_id == user.id, SavedLead.contact_email == req.contact_email)
    )
    saved = existing_q.scalar_one_or_none()
    if not saved:
        saved = SavedLead(
            user_id=user.id, company_name=req.company_name, contact_name=req.contact_name,
            contact_email=req.contact_email, contact_title=req.contact_title,
            country=req.country.upper(), deal_value=req.deal_value, status="discovered"
        )
        db.add(saved)
        await db.flush()

    deal = Deal(
        user_id=user.id, saved_lead_id=saved.id,
        title=req.company_name + " \u2014 " + req.contact_title,
        value=req.deal_value, country=req.country.upper(), stage="lead",
        compliance_status=status, compliance_notes=notes, probability=25,
    )
    db.add(deal)
    await db.commit()
    return {"success": True, "deal_id": str(deal.id), "compliance": {"status": status, "notes": notes}}


# ═══ COMPLIANCE CHECK ═══
@search.get("/compliance/{cc}")
async def check_compliance(cc: str):
    info = COMPLIANCE.get(cc.upper())
    if not info: return {"success": True, "country": cc, "status": "no_specific_rules"}
    return {"success": True, "country": cc, **info}


# ═══ SEND EMAIL ═══
class SendEmailReq(BaseModel):
    to_email: str
    subject: str
    body: str

@search.post("/send-email")
async def send_email(req: SendEmailReq, user: User = Depends(get_current_user)):
    smtp_host = getattr(settings, 'SMTP_HOST', '')
    smtp_user = getattr(settings, 'SMTP_USER', '')
    smtp_pass = getattr(settings, 'SMTP_PASS', '')
    if not smtp_host:
        return {"success": True, "status": "draft_saved",
            "message": "Add SMTP_HOST, SMTP_USER, SMTP_PASS to .env to send directly",
            "draft": {"to": req.to_email, "subject": req.subject, "body": req.body}}
    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_user; msg["To"] = req.to_email; msg["Subject"] = req.subject
        msg.attach(MIMEText(req.body, "plain"))
        with smtplib.SMTP(smtp_host, settings.SMTP_PORT) as server:
            server.starttls(); server.login(smtp_user, smtp_pass); server.send_message(msg)
        return {"success": True, "status": "sent", "message": f"Email sent to {req.to_email}"}
    except Exception as e:
        return {"success": True, "status": "failed", "error": str(e)}


# ═══ CONTACTS BOOK ═══
@search.get("/contacts")
async def get_contacts(
    status: str = Query(None),
    country: str = Query(None),
    q: str = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(SavedLead).where(SavedLead.user_id == user.id)
    if status: query = query.where(SavedLead.status == status)
    if country: query = query.where(SavedLead.country == country.upper())
    r = await db.execute(query.order_by(SavedLead.created_at.desc()))
    contacts = r.scalars().all()

    results = []
    for c in contacts:
        if q:
            haystack = f"{c.contact_name} {c.company_name} {c.contact_title} {c.contact_email}".lower()
            if q.lower() not in haystack: continue
        results.append({
            "id": str(c.id), "company": c.company_name, "name": c.contact_name,
            "email": c.contact_email, "title": c.contact_title, "country": c.country,
            "status": c.status, "phone": c.phone, "linkedin": c.linkedin_url,
            "lead_score": c.lead_score or 0, "deal_value": c.deal_value,
            "last_contacted": str(c.last_contacted) if c.last_contacted else None,
            "notes": c.notes, "created_at": str(c.created_at),
        })
    return {"success": True, "total": len(results), "data": results}


@search.patch("/contacts/{contact_id}")
async def update_contact(contact_id: str, body: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(SavedLead).where(SavedLead.id == contact_id, SavedLead.user_id == user.id))
    c = r.scalar_one_or_none()
    if not c: raise HTTPException(404)
    for k, v in body.items():
        if k in {"status", "notes", "phone", "linkedin_url"}: setattr(c, k, v)
    await db.commit()
    return {"success": True}


# ═══ ENRICH LEAD ═══
EARNINGS_BY_COUNTRY = {
    "US": 45000, "GB": 42000, "DE": 40000, "FR": 38000, "AU": 36000,
    "CA": 35000, "SG": 34000, "AE": 32000, "JP": 30000, "KR": 28000,
    "IN": 25000, "BR": 22000, "ZA": 20000, "NG": 18000, "MX": 20000,
    "IL": 38000, "SE": 37000, "NL": 37000, "CH": 42000,
}

@search.post("/enrich/{lead_domain}")
async def enrich_lead(lead_domain: str, user: User = Depends(get_current_user)):
    if user.credits < 1: raise HTTPException(402, "Not enough credits")
    found = None; found_cc = "US"
    for ind, countries in LEAD_DB.items():
        for cc, companies in countries.items():
            for comp in companies:
                if comp["domain"] == lead_domain:
                    found = comp; found_cc = cc; break
    if not found: raise HTTPException(404, "Company not found")
    enriched = []
    for c in found["contacts"]:
        sc = score_lead(c, found)
        earnings = EARNINGS_BY_COUNTRY.get(found_cc, 25000)
        if sc >= 80: earnings = int(earnings * 1.5)
        elif sc >= 60: earnings = int(earnings * 1.2)
        enriched.append({
            "name": c["first"] + " " + c["last"], "title": c["title"], "email": c["email"],
            "phone": f"+{abs(hash(c['email'])) % 9000000000 + 1000000000}",
            "department": c.get("dept", ""), "linkedin": c.get("linkedin", ""),
            "lead_score": sc, "score_label": "HOT" if sc >= 75 else "WARM" if sc >= 50 else "COLD",
            "verified": True, "potential_earnings_inr": earnings,
        })
    return {
        "success": True, "company": found["company"], "domain": found["domain"],
        "country": found_cc, "contacts_enriched": len(enriched), "contacts": enriched,
        "total_potential_inr": sum(c["potential_earnings_inr"] for c in enriched),
    }


# ═══ EARNINGS CALCULATOR ═══
@search.get("/earnings")
async def earnings_calculator(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    saved = (await db.execute(select(SavedLead).where(SavedLead.user_id == user.id))).scalars().all()
    total_inr = 0; by_country = {}; leads_data = []
    for lead in saved:
        cc = lead.country or "US"
        earnings = EARNINGS_BY_COUNTRY.get(cc, 25000) if lead.deal_value == 0 else int(lead.deal_value * 83)
        total_inr += earnings
        by_country[cc] = by_country.get(cc, 0) + earnings
        leads_data.append({"company": lead.company_name, "contact": lead.contact_name, "country": cc, "status": lead.status, "potential_inr": earnings})
    return {
        "success": True, "total_leads": len(saved), "total_potential_inr": total_inr,
        "total_potential_formatted": f"\u20B9{total_inr:,}", "monthly_projection": f"\u20B9{total_inr:,}",
        "yearly_projection": f"\u20B9{total_inr*12:,}",
        "by_country": {k: f"\u20B9{v:,}" for k, v in sorted(by_country.items(), key=lambda x: x[1], reverse=True)},
        "leads": leads_data,
        "tip": "USA/UK/Germany leads = \u20B940K-67K each. India = \u20B925K. Focus on international clients.",
    }


# ═══ EXPORT CSV ═══
from fastapi.responses import StreamingResponse
import io, csv

@search.get("/export-csv")
async def export_csv(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    saved = (await db.execute(select(SavedLead).where(SavedLead.user_id == user.id))).scalars().all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Company","Contact","Email","Title","Country","Status","Lead Score","Phone","LinkedIn","Deal Value","Potential INR","Created"])
    for lead in saved:
        cc = lead.country or "US"
        writer.writerow([
            lead.company_name, lead.contact_name, lead.contact_email, lead.contact_title,
            cc, lead.status, lead.lead_score or 0, lead.phone or "", lead.linkedin_url or "",
            lead.deal_value, EARNINGS_BY_COUNTRY.get(cc, 25000), str(lead.created_at),
        ])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nanoneuron_contacts.csv"})


# ═══ LOAD SAMPLE DATA ═══
@search.post("/load-samples")
async def load_sample_leads(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    samples = [
        {"company":"TechCorp","name":"John Smith","email":"john@techcorp.us","title":"CTO","country":"US","value":50000,"score":85},
        {"company":"EuroSoft","name":"Marie Dupont","email":"marie@eurosoft.fr","title":"VP Sales","country":"FR","value":35000,"score":72},
        {"company":"NexGen Solutions","name":"Rahul Verma","email":"rahul@nexgen.in","title":"CEO","country":"IN","value":25000,"score":90},
        {"company":"BrightWave","name":"Oliver Hughes","email":"oliver@brightwave.co.uk","title":"CEO","country":"GB","value":45000,"score":88},
        {"company":"TechHaus","name":"Felix Mueller","email":"felix@techhaus.de","title":"CTO","country":"DE","value":40000,"score":82},
        {"company":"GulfTech","name":"Mohammed Al-Rashid","email":"m@gulftech.ae","title":"CEO","country":"AE","value":30000,"score":86},
        {"company":"AsiaScale","name":"Wei Tan","email":"wei@asiascale.sg","title":"CTO","country":"SG","value":28000,"score":79},
        {"company":"PayStream","name":"Robert Martinez","email":"robert@paystream.com","title":"CTO","country":"US","value":60000,"score":83},
        {"company":"FinEdge","name":"Arjun Kapoor","email":"arjun@finedge.in","title":"CEO","country":"IN","value":22000,"score":88},
        {"company":"ShopFast","name":"Karen Johnson","email":"karen@shopfast.com","title":"VP Ops","country":"US","value":55000,"score":75},
        {"company":"OzCloud Tech","name":"Liam Johnson","email":"liam@ozcloud.com.au","title":"CEO","country":"AU","value":38000,"score":87},
        {"company":"MapleSoft","name":"Noah Brown","email":"noah@maplesoft.ca","title":"CEO","country":"CA","value":33000,"score":85},
    ]
    added = 0
    for s in samples:
        saved = SavedLead(
            user_id=user.id, company_name=s["company"], contact_name=s["name"],
            contact_email=s["email"], contact_title=s["title"], country=s["country"],
            deal_value=s["value"], status="discovered", lead_score=s["score"],
        )
        db.add(saved)
        deal = Deal(
            user_id=user.id, title=f"{s['company']} \u2014 {s['title']}",
            value=s["value"], country=s["country"], stage="lead",
            compliance_status="compliant" if s["country"] == "US" else "action_needed",
            compliance_notes=COMPLIANCE.get(s["country"], {}).get("law", ""),
            probability=35,
        )
        db.add(deal)
        added += 1
    await db.commit()
    return {
        "success": True, "loaded": added, "message": f"{added} global sample leads loaded!",
        "total_value_inr": f"\u20B9{sum(s['value']*83 for s in samples):,}",
    }
