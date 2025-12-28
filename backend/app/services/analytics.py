"""
Shared database utilities for aggregation queries.
"""

from datetime import datetime, timedelta
from typing import Any
from beanie import PydanticObjectId
from bson import ObjectId

from app.models.transaction import Transaction


def to_object_id(user_id: PydanticObjectId) -> ObjectId:
    """Convert PydanticObjectId to bson ObjectId for raw queries."""
    return ObjectId(str(user_id))


async def aggregate_transactions(pipeline: list[dict]) -> list[dict]:
    """Run an aggregation pipeline on the Transaction collection."""
    collection = Transaction.get_pymongo_collection()
    cursor = collection.aggregate(pipeline)
    return await cursor.to_list(length=None)


async def get_carbon_total(
    user_id: PydanticObjectId,
    start_date: datetime = None,
    end_date: datetime = None,
    category: str = None,
) -> float:
    """Get total carbon emissions for a user with optional filters."""
    match = {"user_id": to_object_id(user_id)}
    
    if start_date or end_date:
        match["date"] = {}
        if start_date:
            match["date"]["$gte"] = start_date
        if end_date:
            match["date"]["$lt"] = end_date
    
    if category:
        match["category"] = category
    
    pipeline = [
        {"$match": match},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    
    result = await aggregate_transactions(pipeline)
    return result[0]["total"] if result else 0.0


async def get_category_breakdown(
    user_id: PydanticObjectId,
    start_date: datetime = None,
    end_date: datetime = None,
) -> list[dict]:
    """Get carbon breakdown by category for a user."""
    match = {"user_id": to_object_id(user_id)}
    
    if start_date or end_date:
        match["date"] = {}
        if start_date:
            match["date"]["$gte"] = start_date
        if end_date:
            match["date"]["$lt"] = end_date
    
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$category",
            "carbon": {"$sum": "$carbon"},
            "amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    result = await aggregate_transactions(pipeline)
    total = sum(c["carbon"] for c in result) or 1
    
    return [
        {
            "category": c["_id"],
            "carbon": round(c["carbon"], 2),
            "amount": round(c["amount"], 2),
            "count": c["count"],
            "percentage": round((c["carbon"] / total) * 100, 1),
        }
        for c in result
    ]


async def get_tracking_streak(user_id: PydanticObjectId) -> int:
    """
    Calculate user's engagement score based on tracked days.
    For uploaded historical data, we count unique days with transactions
    as a measure of tracking consistency.
    """
    pipeline = [
        {"$match": {"user_id": to_object_id(user_id)}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}}}},
        {"$count": "total_days"}
    ]
    
    result = await aggregate_transactions(pipeline)
    return result[0]["total_days"] if result else 0


async def get_transaction_count(user_id: PydanticObjectId) -> int:
    """Get total transaction count for a user."""
    return await Transaction.find(Transaction.user_id == user_id).count()


async def get_import_count(user_id: PydanticObjectId) -> int:
    """Get count of imported transactions (for bonus XP)."""
    pipeline = [
        {"$match": {"user_id": to_object_id(user_id), "source": "import"}},
        {"$count": "total"}
    ]
    result = await aggregate_transactions(pipeline)
    return result[0]["total"] if result else 0
