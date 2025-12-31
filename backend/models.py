from sqlalchemy import Column, Integer, Float, String, DateTime
from database import Base
from datetime import datetime
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float,nullable=False)
    type = Column(String,nullable=False)
    created_at = Column(DateTime,default=datetime.utcnow)
