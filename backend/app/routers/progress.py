"""
Progress and gamification endpoint.
Simplified for core functionality: level, streak, and emission trends.
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from app.models.user import User
from app.models.transaction import Transaction
from app.utils.auth import get_current_user
from app.services.analytics import (
    aggregate_transactions,
    get_carbon_total,
    get_category_breakdown,
    get_tracking_streak,
    get_import_count,
)
from app.constants import DEFAULT_WEEKLY_GOAL, DEFAULT_MONTHLY_GOAL, XP_THRESHOLDS


router = APIRouter(prefix="/progress", tags=["Progress"])

# Level titles for friendly identity
LEVEL_TITLES = [
    "Eco Beginner",      # Level 1
    "Carbon Curious",    # Level 2
    "Green Explorer",    # Level 3
    "Climate Aware",     # Level 4
    "Eco Enthusiast",    # Level 5
    "Green Guardian",    # Level 6
    "Carbon Champion",   # Level 7
    "Eco Warrior",       # Level 8
    "Planet Protector",  # Level 9
    "Climate Hero",      # Level 10
    "Earth Legend",      # Level 11
]

# Next reward teasers
REWARDS = [
    {"at_xp": 50, "name": "First Steps Badge", "icon": "🌱"},
    {"at_xp": 150, "name": "Week Warrior Badge", "icon": "🔥"},
    {"at_xp": 300, "name": "Eco Explorer Badge", "icon": "🌍"},
    {"at_xp": 500, "name": "Green Guardian Badge", "icon": "🛡️"},
    {"at_xp": 750, "name": "Carbon Crusher Badge", "icon": "💪"},
    {"at_xp": 1000, "name": "Planet Hero Badge", "icon": "🏆"},
]


def calculate_level(total_transactions: int, days_tracked: int, import_count: int) -> tuple[int, int, str]:
    """Calculate user level, XP, and title from activity."""
    # XP formula:
    # - 10 XP per transaction
    # - 5 XP per unique day tracked
    # - 2 XP bonus per imported transaction (encourages bulk uploads)
    xp = (total_transactions * 10) + (days_tracked * 5) + (import_count * 2)
    
    level = 1
    for i, threshold in enumerate(XP_THRESHOLDS):
        if xp >= threshold:
            level = i + 1
    
    title = LEVEL_TITLES[min(level - 1, len(LEVEL_TITLES) - 1)]
    
    return level, xp, title


def get_next_reward(xp: int) -> dict | None:
    """Get the next reward the user is working towards."""
    for reward in REWARDS:
        if xp < reward["at_xp"]:
            return {
                "name": reward["name"],
                "icon": reward["icon"],
                "xp_needed": reward["at_xp"] - xp,
                "xp_target": reward["at_xp"],
            }
    return None


@router.get("")
async def get_progress(current_user: User = Depends(get_current_user)):
    """Get user's progress: level, streak, and emission trends."""
    now = datetime.utcnow()
    user_id = current_user.id
    
    # Time boundaries
    week_start = now - timedelta(days=now.weekday())
    last_week_start = week_start - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    # Get carbon totals
    week_carbon = await get_carbon_total(user_id, start_date=week_start)
    last_week_carbon = await get_carbon_total(user_id, start_date=last_week_start, end_date=week_start)
    month_carbon = await get_carbon_total(user_id, start_date=month_start)
    last_month_carbon = await get_carbon_total(user_id, start_date=last_month_start, end_date=month_start)
    
    # Transaction count and tracking stats
    total_transactions = await Transaction.find(Transaction.user_id == user_id).count()
    days_tracked = await get_tracking_streak(user_id)  # Now returns unique days with transactions
    import_count = await get_import_count(user_id)
    
    # Calculate level and title (with import bonus)
    level, xp, title = calculate_level(total_transactions, days_tracked, import_count)
    
    # Get next reward teaser
    next_reward = get_next_reward(xp)
    
    # Emission trends
    week_change = 0
    if last_week_carbon > 0:
        week_change = round(((week_carbon - last_week_carbon) / last_week_carbon) * 100, 1)
    
    month_change = 0
    if last_month_carbon > 0:
        month_change = round(((month_carbon - last_month_carbon) / last_month_carbon) * 100, 1)
    
    trends = [
        {
            "period": "Week",
            "current": round(week_carbon, 1),
            "previous": round(last_week_carbon, 1),
            "change_percent": week_change,
            "goal": DEFAULT_WEEKLY_GOAL,
        },
        {
            "period": "Month",
            "current": round(month_carbon, 1),
            "previous": round(last_month_carbon, 1),
            "change_percent": month_change,
            "goal": DEFAULT_MONTHLY_GOAL,
        },
    ]
    
    # All-time category breakdown
    categories = await get_category_breakdown(user_id)
    
    # Carbon history (last 12 weeks for chart)
    carbon_history = []
    for i in range(12):
        w_end = now - timedelta(weeks=i)
        w_start = w_end - timedelta(days=7)
        carbon = await get_carbon_total(user_id, start_date=w_start, end_date=w_end)
        carbon_history.append({
            "week": f"W{12-i}",
            "date": w_start.strftime("%b %d"),
            "carbon": round(carbon, 1),
        })
    carbon_history.reverse()
    
    # Motivational message based on progress
    motivation = "You're making a difference! 🌍"
    if days_tracked >= 30:
        motivation = f"Amazing! You've tracked {days_tracked} days of data! 🔥"
    elif import_count >= 100:
        motivation = f"Great job importing {import_count} transactions! 📊"
    elif week_carbon < last_week_carbon and last_week_carbon > 0:
        motivation = "Your emissions are down! Keep it up! 📉"
    elif total_transactions < 5:
        motivation = "Welcome! Upload more to see your impact 🌱"
    
    return {
        "gamification": {
            "level": level,
            "title": title,
            "xp": xp,
            "days_tracked": days_tracked,
            "imports": import_count,
            "next_reward": next_reward,
            "motivation": motivation,
        },
        "emission_trends": trends,
        "category_breakdown": categories,
        "carbon_history": carbon_history,
        "summary": {
            "total_transactions": total_transactions,
            "this_month_carbon": round(month_carbon, 1),
            "monthly_goal": DEFAULT_MONTHLY_GOAL,
            "on_track": month_carbon <= DEFAULT_MONTHLY_GOAL,
        },
    }
