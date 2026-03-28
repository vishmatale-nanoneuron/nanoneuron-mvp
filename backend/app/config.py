from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://admin:secret123@localhost:5432/nanoneuron_crm"
    JWT_SECRET: str = "NanoneuronMVP2026SecretKey"
    JWT_ALGORITHM: str = "HS256"
    ANTHROPIC_API_KEY: str = ""
    HUNTER_API_KEY: str = ""          # hunter.io — email enrichment (set in Railway)
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://nanoneuron.ai",
        "https://www.nanoneuron.ai",
        "https://nanoneuron-mvp.pages.dev",  # Cloudflare Pages default domain
    ]
    EXTRA_CORS_ORIGINS: str = ""  # Set in Railway: comma-separated extra origins
    FOUNDER_EMAIL: str = ""          # Set in Railway — only this email gets /api/founder/*
    FOUNDER_SECRET: str = ""         # Extra header secret for double verification

    # Seller / Company details for invoices
    COMPANY_NAME: str = "Nanoneuron Services"
    COMPANY_GSTIN: str = "27EPIPM6974Q1Z0"   # Maharashtra — state code 27
    COMPANY_STATE: str = "Maharashtra"
    COMPANY_ADDRESS: str = ""                 # Set in Railway — registered office address
    COMPANY_SAC: str = "998314"              # SAC: Information Technology Services
    FREE_CREDITS: int = 10
    CREDIT_COST_PER_LEAD: int = 1
    SMTP_HOST: str = ""
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_PORT: int = 587

    # Bank — Domestic India (NEFT / RTGS / IMPS)
    BANK_NAME: str = "Axis Bank Ltd"
    BANK_ACCOUNT_NUMBER: str = ""        # Set in Railway
    BANK_ACCOUNT_HOLDER: str = ""        # Set in Railway
    BANK_IFSC: str = ""                  # Set in Railway

    # SWIFT — Beneficiary (same Axis Bank account for all currencies)
    SWIFT_BENEFICIARY_NAME: str = ""     # Set in Railway — your account holder name
    SWIFT_BENEFICIARY_ACCOUNT: str = ""  # Set in Railway — your account number
    SWIFT_BENEFICIARY_BANK: str = "Axis Bank Ltd"
    SWIFT_BENEFICIARY_BANK_CODE: str = "AXISINBBA02"

    # SWIFT USD
    SWIFT_USD_CORRESPONDENT: str = "JP Morgan Chase Bank, New York"
    SWIFT_USD_CORRESPONDENT_SWIFT: str = "CHASUS33"
    SWIFT_USD_NOSTRO: str = "11407376"
    SWIFT_USD_IBAN: str = "FED ABA 0210-0002-1"

    # SWIFT GBP
    SWIFT_GBP_CORRESPONDENT: str = "JP Morgan Chase, London"
    SWIFT_GBP_CORRESPONDENT_SWIFT: str = "CHASGB2L"
    SWIFT_GBP_NOSTRO: str = "11131588"
    SWIFT_GBP_IBAN: str = "GB48CHAS60924211131588"

    # SWIFT EUR
    SWIFT_EUR_CORRESPONDENT: str = "JP Morgan Chase, Frankfurt"
    SWIFT_EUR_CORRESPONDENT_SWIFT: str = "CHASDEFX"
    SWIFT_EUR_NOSTRO: str = "6231605392"
    SWIFT_EUR_IBAN: str = "DE81501108006231605392"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
