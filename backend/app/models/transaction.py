from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional, Literal


Category = Literal["Travel", "Food", "Shopping", "Electricity", "Gas", "Water", "Home"]


class Transaction(Document):
    user_id: Indexed(PydanticObjectId)
    name: str
    description: Optional[str] = None
    category: Category
    date: Indexed(datetime)
    amount: float
    carbon: float  # kg CO2
    source: str = "manual"  # manual, import
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "transactions"
        
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Flight to Mumbai",
                "category": "Travel",
                "amount": 15000,
                "carbon": 120.5,
            }
        }
