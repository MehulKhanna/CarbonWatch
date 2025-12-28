from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field, computed_field
from datetime import datetime
from typing import Optional


class Goal(Document):
    user_id: Indexed(PydanticObjectId)
    title: str
    target: float
    current: float = 0
    unit: str
    deadline: datetime
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @computed_field
    @property
    def progress(self) -> float:
        if self.target == 0:
            return 0
        return min(100, (self.current / self.target) * 100)
    
    class Settings:
        name = "goals"
        
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Reduce Monthly Emissions",
                "target": 100,
                "unit": "kg CO2",
            }
        }
