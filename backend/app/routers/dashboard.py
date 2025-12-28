"""
Dashboard endpoint.
Provides overview statistics and trend data.
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from app.models.user import User
from app.utils.auth import get_current_user
from app.services.analytics import (
    aggregate_transactions,
    get_carbon_total,
    get_category_breakdown,
)
from app.constants import DEFAULT_MONTHLY_GOAL


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics for the current user."""
    now = datetime.utcnow()
    user_id = current_user.id
    
    # Time boundaries
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    # All-time total for headline stat
    all_time_carbon = await get_carbon_total(user_id)
    
    # Current and last month carbon for comparison
    current_month_carbon = await get_carbon_total(user_id, start_date=month_start)
    last_month_carbon = await get_carbon_total(user_id, start_date=last_month_start, end_date=month_start)
    
    # Calculate monthly change
    monthly_change = 0
    if last_month_carbon > 0:
        monthly_change = round(((current_month_carbon - last_month_carbon) / last_month_carbon) * 100, 1)
    
    # Category breakdown for ALL transactions (not just this month)
    categories = await get_category_breakdown(user_id)
    categories.sort(key=lambda x: x["percentage"], reverse=True)
    
    # Highest impact category
    highest_impact = {"category": "None", "percentage": 0}
    if categories:
        highest_impact = {
            "category": categories[0]["category"],
            "percentage": categories[0]["percentage"],
        }
    
    # 12-month trend data
    trend_data = []
    for i in range(11, -1, -1):
        m_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        m_end = (m_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        carbon = await get_carbon_total(user_id, start_date=m_start, end_date=m_end)
        trend_data.append({
            "month": m_start.strftime("%b"),
            "value": round(carbon, 1),
        })
    
    return {
        "stats": {
            "totalCarbon": round(current_month_carbon, 1),
            "allTimeCarbon": round(all_time_carbon, 1),
            "monthlyChange": monthly_change,
            "highestImpact": highest_impact,
            "monthlyGoal": {
                "target": DEFAULT_MONTHLY_GOAL,
                "current": round(current_month_carbon, 1),
                "remaining": max(0, round(current_month_carbon - DEFAULT_MONTHLY_GOAL, 1)),
            },
        },
        "categoryBreakdown": [
            {
                "category": c["category"],
                "amount": c["carbon"],
                "percentage": c["percentage"],
            }
            for c in categories
        ],
        "trendData": trend_data,
    }
