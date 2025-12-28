from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal


Category = Literal["Travel", "Food", "Shopping", "Electricity", "Gas", "Water", "Home"]


# Request schemas
class TransactionCreate(BaseModel):
    name: str
    category: Category
    date: datetime
    amount: float
    carbon: Optional[float] = None
    description: Optional[str] = None


class TransactionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Category] = None
    date: Optional[datetime] = None
    amount: Optional[float] = None
    carbon: Optional[float] = None
    description: Optional[str] = None


# Response schemas
class TransactionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    date: datetime
    amount: float
    carbon: float
    description: Optional[str]
    source: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_transaction(cls, tx):
        return cls(
            id=str(tx.id),
            user_id=str(tx.user_id),
            name=tx.name,
            category=tx.category,
            date=tx.date,
            amount=tx.amount,
            carbon=tx.carbon,
            description=tx.description,
            source=tx.source,
            created_at=tx.created_at,
            updated_at=tx.updated_at,
        )


class TransactionsListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_emissions: float


class ImportResponse(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    total_carbon: float
    message: str
