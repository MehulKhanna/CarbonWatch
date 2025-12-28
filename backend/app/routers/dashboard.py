from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from app.models.user import User
from app.models.transaction import Transaction
from app.utils.auth import get_current_user


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


async def run_aggregation(pipeline: list) -> list:
    """Run an aggregation pipeline on the Transaction collection."""
    collection = Transaction.get_pymongo_collection()
    cursor = collection.aggregate(pipeline)
    return await cursor.to_list(length=None)


@router.get("")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics for the current user."""
    now = datetime.utcnow()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    # Current month total carbon
    current_month_pipeline = [
        {"$match": {"user_id": current_user.id, "date": {"$gte": current_month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    result = await run_aggregation(current_month_pipeline)
    current_month_carbon = result[0]["total"] if result else 0
    
    # Last month total carbon
    last_month_pipeline = [
        {"$match": {
            "user_id": current_user.id, 
            "date": {"$gte": last_month_start, "$lt": current_month_start}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    result = await run_aggregation(last_month_pipeline)
    last_month_carbon = result[0]["total"] if result else 0
    
    # Calculate monthly change
    if last_month_carbon > 0:
        monthly_change = round(((current_month_carbon - last_month_carbon) / last_month_carbon) * 100, 1)
    else:
        monthly_change = 0
    
    # Category breakdown
    category_pipeline = [
        {"$match": {"user_id": current_user.id, "date": {"$gte": current_month_start}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$carbon"}}}
    ]
    categories = await run_aggregation(category_pipeline)
    
    total_carbon = sum(c["total"] for c in categories) or 1  # Avoid division by zero
    
    category_breakdown = [
        {
            "category": c["_id"],
            "amount": round(c["total"], 2),
            "percentage": round((c["total"] / total_carbon) * 100, 1),
        }
        for c in categories
    ]
    
    # Sort by percentage descending
    category_breakdown.sort(key=lambda x: x["percentage"], reverse=True)
    
    # Highest impact category
    highest_impact = category_breakdown[0] if category_breakdown else {"category": "None", "percentage": 0}
    
    # Monthly goal (example: 150 kg)
    monthly_goal_target = 150
    
    # 12-month trend data
    trend_data = []
    for i in range(11, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        month_pipeline = [
            {"$match": {
                "user_id": current_user.id,
                "date": {"$gte": month_start, "$lt": month_end}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
        ]
        result = await run_aggregation(month_pipeline)
        month_carbon = result[0]["total"] if result else 0
        
        trend_data.append({
            "month": month_start.strftime("%b"),
            "value": round(month_carbon, 1),
        })
    
    return {
        "stats": {
            "totalCarbon": round(current_month_carbon, 1),
            "monthlyChange": monthly_change,
            "highestImpact": {
                "category": highest_impact["category"],
                "percentage": highest_impact["percentage"],
            },
            "monthlyGoal": {
                "target": monthly_goal_target,
                "current": round(current_month_carbon, 1),
                "remaining": max(0, round(current_month_carbon - monthly_goal_target, 1)),
            },
        },
        "categoryBreakdown": category_breakdown,
        "trendData": trend_data,
    }
