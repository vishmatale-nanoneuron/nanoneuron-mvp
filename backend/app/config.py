from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://admin:secret123@localhost:5432/nanoneuron_crm"
    JWT_SECRET: str = "NanoneuronMVP2026SecretKey"
    JWT_ALGORITHM: str = "HS256"
    ANTHROPIC_API_KEY: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://nanoneuron.ai", "https://www.nanoneuron.ai"]
    FOUNDER_EMAIL: str = ""          # Set in Railway — only this email gets /api/founder/*
    FOUNDER_SECRET: str = ""         # Extra header secret for double verification
    FREE_CREDITS: int = 10
    CREDIT_COST_PER_LEAD: int = 1
    SMTP_HOST: str = ""
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_PORT: int = 587

    # Bank — Domestic India
    BANK_NAME: str = "Axis Bank"
    BANK_ACCOUNT_NUMBER: str = ""
    BANK_ACCOUNT_HOLDER: str = ""
    BANK_IFSC: str = ""

    # SWIFT USD
    SWIFT_USD_BENEFICIARY: str = ""
    SWIFT_USD_ACCOUNT: str = ""
    SWIFT_USD_BANK_SWIFT: str = "AXISINBBA02"
    SWIFT_USD_CORRESPONDENT: str = "JP Morgan Chase Bank New York"
    SWIFT_USD_CORRESPONDENT_SWIFT: str = "CHASUS33"
    SWIFT_USD_NOSTRO: str = "11407376"
    SWIFT_USD_IBAN: str = "FED ABA 0210-0002-1"

    # SWIFT GBP
    SWIFT_GBP_CORRESPONDENT: str = "JP Morgan Chase London"
    SWIFT_GBP_CORRESPONDENT_SWIFT: str = "CHASGB2L"
    SWIFT_GBP_NOSTRO: str = "11131588"
    SWIFT_GBP_IBAN: str = "GB48CHAS60924211131588"

    # SWIFT EUR
    SWIFT_EUR_CORRESPONDENT: str = "JP Morgan Chase Frankfurt"
    SWIFT_EUR_CORRESPONDENT_SWIFT: str = "CHASDEFX"
    SWIFT_EUR_NOSTRO: str = "6231605392"
    SWIFT_EUR_IBAN: str = "DE81501108006231605392"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
