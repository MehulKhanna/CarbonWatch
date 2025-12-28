"""
Insights and recommendations endpoint.
Generates personalized tips based on spending patterns.
"""

from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from typing import Optional

from app.models.user import User
from app.utils.auth import get_current_user
from app.services.analytics import get_category_breakdown


router = APIRouter(prefix="/insights", tags=["Insights"])


# Recommendation templates by category
RECOMMENDATIONS = {
    "Travel": {
        "high": {
            "title": "Travel is Your Biggest Impact",
            "tip": "For trips under 300km, trains emit 80% less CO₂ than flights. Consider carpooling or public transit.",
            "savings_percent": 0.6,
        },
        "medium": {
            "title": "Optimize Your Travel",
            "tip": "Use metro or bus for short trips. Walk or cycle for distances under 2km.",
            "savings_percent": 0.4,
        },
    },
    "Food": {
        "high": {
            "title": "Reduce Food Delivery",
            "tip": "Cook at home more often. Delivery adds packaging and transport emissions.",
            "savings_percent": 0.4,
        },
        "medium": {
            "title": "Go Local with Groceries",
            "tip": "Buy from local markets instead of imported goods. Choose seasonal produce.",
            "savings_percent": 0.25,
        },
    },
    "Shopping": {
        "high": {
            "title": "Consolidate Your Orders",
            "tip": "Batch online orders to reduce delivery trips. Use 'no-rush' delivery when available.",
            "savings_percent": 0.3,
        },
        "medium": {
            "title": "Consider Secondhand",
            "tip": "Check OLX or local thrift stores for furniture and electronics.",
            "savings_percent": 0.5,
        },
    },
    "Electricity": {
        "high": {
            "title": "Optimize AC Usage",
            "tip": "Set AC to 24-26°C. Each degree lower uses 6% more electricity.",
            "savings_percent": 0.3,
        },
        "medium": {
            "title": "Appliance Efficiency",
            "tip": "Unplug chargers when not in use. Use LED bulbs. Run washing machine with full loads.",
            "savings_percent": 0.2,
        },
    },
    "Gas": {
        "medium": {
            "title": "Efficient Cooking",
            "tip": "Use pressure cookers to reduce cooking time. Cover pots while cooking.",
            "savings_percent": 0.25,
        },
    },
    "Water": {
        "medium": {
            "title": "Water Conservation",
            "tip": "Fix leaky taps. Take shorter showers. Water plants in the evening.",
            "savings_percent": 0.2,
        },
    },
    "Home": {
        "medium": {
            "title": "Home Energy Efficiency",
            "tip": "Use natural light during day. Ensure windows are sealed properly.",
            "savings_percent": 0.25,
        },
    },
}


def generate_recommendations(categories: list[dict]) -> list[dict]:
    """Generate recommendations based on category breakdown."""
    recommendations = []
    total_carbon = sum(c["carbon"] for c in categories) or 1
    
    for cat in categories:
        category = cat["category"]
        carbon = cat["carbon"]
        percentage = (carbon / total_carbon) * 100
        
        if category not in RECOMMENDATIONS:
            continue
        
        # Determine priority based on percentage
        if percentage > 35:
            priority = "high"
            rec_data = RECOMMENDATIONS[category].get("high") or RECOMMENDATIONS[category].get("medium")
        elif percentage > 15 or carbon > 10:
            priority = "medium"
            rec_data = RECOMMENDATIONS[category].get("medium")
        else:
            continue
        
        if not rec_data:
            continue
        
        potential_savings = round(carbon * rec_data["savings_percent"], 1)
        
        recommendations.append({
            "id": f"{category.lower()}-{priority}",
            "category": category,
            "title": rec_data["title"],
            "tip": rec_data["tip"],
            "priority": priority,
            "potential_savings": f"{potential_savings} kg CO₂/month",
            "current_carbon": round(carbon, 1),
            "percentage": round(percentage, 1),
        })
    
    # Sort by priority (high first)
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 2))
    
    return recommendations


@router.get("")
async def get_insights(
    current_user: User = Depends(get_current_user),
    period: Optional[str] = Query(None, description="Time period: week, month, year, or all")
):
    """Get personalized insights and recommendations for a time period."""
    now = datetime.utcnow()
    
    # Calculate date range based on period
    start_date = None
    period_label = "all time"
    
    if period == "week":
        start_date = now - timedelta(days=7)
        period_label = "this week"
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = "this month"
    elif period == "year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = "this year"
    
    # Get category breakdown for the selected period
    categories = await get_category_breakdown(current_user.id, start_date=start_date)
    
    # Generate recommendations
    recommendations = generate_recommendations(categories)
    
    # Calculate total potential savings
    total_potential = sum(
        float(r["potential_savings"].split()[0])
        for r in recommendations
        if r["potential_savings"]
    )
    
    # Add a general tip if we don't have many recommendations
    if len(recommendations) < 2:
        recommendations.append({
            "id": "general-track",
            "category": "General",
            "title": "Keep Tracking",
            "tip": "Add more transactions to get personalized insights based on your spending patterns.",
            "priority": "low",
            "potential_savings": "Better insights",
            "current_carbon": 0,
            "percentage": 0,
        })
    
    # Generate primary insight message (friendly, encouraging tone)
    primary_insight = None
    if recommendations and recommendations[0]["category"] != "General":
        top = recommendations[0]
        savings = top["potential_savings"].split()[0] if top["potential_savings"] else "some"
        primary_insight = {
            "category": top["category"],
            "message": f"{top['category']} is your biggest impact {period_label}. {top['tip']}",
            "savings": f"~{savings} kg CO₂",
            "encouragement": "Small changes add up! 🌱"
        }
    
    return {
        "period": period or "all",
        "period_label": period_label,
        "recommendations": recommendations[:5],
        "personalized_tips": recommendations[:3],  # Alias for frontend compatibility
        "primary_insight": primary_insight,
        "potential_monthly_savings": round(total_potential, 1),
        "category_breakdown": categories,
    }
