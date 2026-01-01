from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    amount = Column(Float)
    type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    description = Column(String, default="")
