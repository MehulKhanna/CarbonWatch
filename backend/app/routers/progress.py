from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

from app.models.user import User
from app.models.transaction import Transaction
from app.models.goal import Goal
from app.utils.auth import get_current_user


router = APIRouter(prefix="/progress", tags=["Progress"])


class GoalCreate(BaseModel):
    title: str
    target: float
    unit: str
    deadline: datetime


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target: Optional[float] = None
    current: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[datetime] = None
    completed: Optional[bool] = None


async def run_aggregation(pipeline: list) -> list:
    """Run an aggregation pipeline on the Transaction collection."""
    collection = Transaction.get_pymongo_collection()
    cursor = collection.aggregate(pipeline)
    return await cursor.to_list(length=None)


# ========== ACHIEVEMENT DEFINITIONS ==========
# Organized by paths for gamification

ACHIEVEMENT_PATHS = {
    "getting_started": {
        "name": "Getting Started",
        "description": "Begin your sustainability journey",
        "icon": "rocket",
        "color": "#3b82f6",  # Blue
    },
    "tracker": {
        "name": "Master Tracker",
        "description": "Consistently track your carbon footprint",
        "icon": "chart",
        "color": "#8b5cf6",  # Purple
    },
    "travel": {
        "name": "Green Traveler",
        "description": "Reduce your travel emissions",
        "icon": "car",
        "color": "#10b981",  # Green
    },
    "food": {
        "name": "Conscious Eater",
        "description": "Make sustainable food choices",
        "icon": "leaf",
        "color": "#22c55e",  # Light green
    },
    "shopping": {
        "name": "Mindful Consumer",
        "description": "Shop responsibly",
        "icon": "bag",
        "color": "#f59e0b",  # Amber
    },
    "utilities": {
        "name": "Energy Saver",
        "description": "Reduce electricity, gas, and water consumption",
        "icon": "bolt",
        "color": "#eab308",  # Yellow
    },
    "streaks": {
        "name": "Consistency Champion",
        "description": "Maintain eco-friendly habits",
        "icon": "fire",
        "color": "#ef4444",  # Red
    },
    "milestones": {
        "name": "Carbon Champion",
        "description": "Hit major carbon reduction milestones",
        "icon": "trophy",
        "color": "#f97316",  # Orange
    },
}

# All achievements organized by path
ACHIEVEMENTS = [
    # ========== GETTING STARTED PATH ==========
    {
        "id": "first_steps",
        "path": "getting_started",
        "title": "First Steps",
        "description": "Add your first transaction",
        "icon_key": "first_steps",
        "condition": lambda stats: stats["total_transactions"] >= 1,
        "progress": lambda stats: min(1, stats["total_transactions"]),
        "target": 1,
        "xp": 10,
    },
    {
        "id": "week_one",
        "path": "getting_started",
        "title": "Week One",
        "description": "Track for 7 consecutive days",
        "icon_key": "calendar",
        "condition": lambda stats: stats["tracking_streak"] >= 7,
        "progress": lambda stats: min(7, stats["tracking_streak"]),
        "target": 7,
        "xp": 25,
    },
    {
        "id": "full_picture",
        "path": "getting_started",
        "title": "Full Picture",
        "description": "Have transactions in all 5 categories",
        "icon_key": "grid",
        "condition": lambda stats: stats["categories_used"] >= 5,
        "progress": lambda stats: stats["categories_used"],
        "target": 5,
        "xp": 30,
    },
    {
        "id": "data_importer",
        "path": "getting_started",
        "title": "Data Importer",
        "description": "Import transactions from a bank statement",
        "icon_key": "upload",
        "condition": lambda stats: stats["imported_transactions"] >= 1,
        "progress": lambda stats: min(1, stats["imported_transactions"]),
        "target": 1,
        "xp": 20,
    },
    
    # ========== TRACKER PATH ==========
    {
        "id": "tracker_10",
        "path": "tracker",
        "title": "Getting the Hang",
        "description": "Track 10 transactions",
        "icon_key": "check",
        "condition": lambda stats: stats["total_transactions"] >= 10,
        "progress": lambda stats: min(10, stats["total_transactions"]),
        "target": 10,
        "xp": 15,
    },
    {
        "id": "tracker_50",
        "path": "tracker",
        "title": "Eco Warrior",
        "description": "Track 50 transactions",
        "icon_key": "shield",
        "condition": lambda stats: stats["total_transactions"] >= 50,
        "progress": lambda stats: min(50, stats["total_transactions"]),
        "target": 50,
        "xp": 50,
    },
    {
        "id": "tracker_100",
        "path": "tracker",
        "title": "Carbon Detective",
        "description": "Track 100 transactions",
        "icon_key": "search",
        "condition": lambda stats: stats["total_transactions"] >= 100,
        "progress": lambda stats: min(100, stats["total_transactions"]),
        "target": 100,
        "xp": 100,
    },
    {
        "id": "tracker_250",
        "path": "tracker",
        "title": "Master Tracker",
        "description": "Track 250 transactions",
        "icon_key": "star",
        "condition": lambda stats: stats["total_transactions"] >= 250,
        "progress": lambda stats: min(250, stats["total_transactions"]),
        "target": 250,
        "xp": 200,
    },
    {
        "id": "tracker_500",
        "path": "tracker",
        "title": "Data Legend",
        "description": "Track 500 transactions",
        "icon_key": "crown",
        "condition": lambda stats: stats["total_transactions"] >= 500,
        "progress": lambda stats: min(500, stats["total_transactions"]),
        "target": 500,
        "xp": 500,
    },
    
    # ========== TRAVEL PATH ==========
    {
        "id": "travel_aware",
        "path": "travel",
        "title": "Travel Aware",
        "description": "Track your first travel expense",
        "icon_key": "car",
        "condition": lambda stats: stats["travel_count"] >= 1,
        "progress": lambda stats: min(1, stats["travel_count"]),
        "target": 1,
        "xp": 10,
    },
    {
        "id": "green_commuter",
        "path": "travel",
        "title": "Green Commuter",
        "description": "Keep travel emissions under 20kg this month",
        "icon_key": "leaf",
        "condition": lambda stats: stats["travel_carbon_month"] < 20 and stats["travel_count"] >= 1,
        "progress": lambda stats: max(0, 20 - stats["travel_carbon_month"]),
        "target": 20,
        "xp": 40,
    },
    {
        "id": "low_flyer",
        "path": "travel",
        "title": "Low Flyer",
        "description": "No flight bookings this quarter",
        "icon_key": "plane",
        "condition": lambda stats: stats["flight_count_quarter"] == 0 and stats["total_transactions"] >= 10,
        "progress": lambda stats: 1 if stats["flight_count_quarter"] == 0 else 0,
        "target": 1,
        "xp": 75,
    },
    {
        "id": "public_transit_fan",
        "path": "travel",
        "title": "Transit Fan",
        "description": "Use public transit 10 times",
        "icon_key": "train",
        "condition": lambda stats: stats["public_transit_count"] >= 10,
        "progress": lambda stats: min(10, stats["public_transit_count"]),
        "target": 10,
        "xp": 50,
    },
    {
        "id": "zero_emission_month",
        "path": "travel",
        "title": "Zero Emission Travel",
        "description": "No travel emissions for a full month",
        "icon_key": "sparkle",
        "condition": lambda stats: stats["travel_carbon_month"] == 0 and stats["total_transactions"] >= 5,
        "progress": lambda stats: 1 if stats["travel_carbon_month"] == 0 else 0,
        "target": 1,
        "xp": 100,
    },
    
    # ========== FOOD PATH ==========
    {
        "id": "foodie",
        "path": "food",
        "title": "Foodie Tracker",
        "description": "Track 10 food transactions",
        "icon_key": "utensils",
        "condition": lambda stats: stats["food_count"] >= 10,
        "progress": lambda stats: min(10, stats["food_count"]),
        "target": 10,
        "xp": 15,
    },
    {
        "id": "home_cook",
        "path": "food",
        "title": "Home Cook",
        "description": "Keep food delivery under 5 transactions this month",
        "icon_key": "home",
        "condition": lambda stats: stats["delivery_count_month"] < 5 and stats["food_count"] >= 1,
        "progress": lambda stats: max(0, 5 - stats["delivery_count_month"]),
        "target": 5,
        "xp": 35,
    },
    {
        "id": "local_buyer",
        "path": "food",
        "title": "Local Buyer",
        "description": "Shop at local markets 5 times",
        "icon_key": "store",
        "condition": lambda stats: stats["local_market_count"] >= 5,
        "progress": lambda stats: min(5, stats["local_market_count"]),
        "target": 5,
        "xp": 40,
    },
    {
        "id": "sustainable_eater",
        "path": "food",
        "title": "Sustainable Eater",
        "description": "Keep food emissions under 15kg for 3 months",
        "icon_key": "seedling",
        "condition": lambda stats: stats["low_food_months"] >= 3,
        "progress": lambda stats: min(3, stats["low_food_months"]),
        "target": 3,
        "xp": 100,
    },
    
    # ========== SHOPPING PATH ==========
    {
        "id": "conscious_buyer",
        "path": "shopping",
        "title": "Conscious Buyer",
        "description": "Track 10 shopping transactions",
        "icon_key": "bag",
        "condition": lambda stats: stats["shopping_count"] >= 10,
        "progress": lambda stats: min(10, stats["shopping_count"]),
        "target": 10,
        "xp": 15,
    },
    {
        "id": "minimalist_month",
        "path": "shopping",
        "title": "Minimalist Month",
        "description": "Keep shopping under 5 transactions this month",
        "icon_key": "minus",
        "condition": lambda stats: stats["shopping_count_month"] < 5 and stats["total_transactions"] >= 5,
        "progress": lambda stats: max(0, 5 - stats["shopping_count_month"]),
        "target": 5,
        "xp": 50,
    },
    {
        "id": "low_carbon_shopper",
        "path": "shopping",
        "title": "Low Carbon Shopper",
        "description": "Keep shopping emissions under 10kg this month",
        "icon_key": "tag",
        "condition": lambda stats: stats["shopping_carbon_month"] < 10 and stats["shopping_count"] >= 1,
        "progress": lambda stats: max(0, 10 - stats["shopping_carbon_month"]),
        "target": 10,
        "xp": 40,
    },
    {
        "id": "no_impulse",
        "path": "shopping",
        "title": "No Impulse Buying",
        "description": "No shopping transactions for 2 weeks",
        "icon_key": "clock",
        "condition": lambda stats: stats["days_since_shopping"] >= 14,
        "progress": lambda stats: min(14, stats["days_since_shopping"]),
        "target": 14,
        "xp": 60,
    },
    
    # ========== UTILITIES PATH ==========
    {
        "id": "bill_tracker",
        "path": "utilities",
        "title": "Bill Tracker",
        "description": "Track your first electricity, gas, or water bill",
        "icon_key": "bolt",
        "condition": lambda stats: stats["utilities_count"] >= 1,
        "progress": lambda stats: min(1, stats["utilities_count"]),
        "target": 1,
        "xp": 10,
    },
    {
        "id": "energy_conscious",
        "path": "utilities",
        "title": "Energy Conscious",
        "description": "Keep combined utility emissions under 5kg this month",
        "icon_key": "lightbulb",
        "condition": lambda stats: stats["utilities_carbon_month"] < 5 and stats["utilities_count"] >= 1,
        "progress": lambda stats: max(0, 5 - stats["utilities_carbon_month"]),
        "target": 5,
        "xp": 45,
    },
    {
        "id": "reduced_bills",
        "path": "utilities",
        "title": "Reduced Bills",
        "description": "Combined utility emissions decreased from last month",
        "icon_key": "trending_down",
        "condition": lambda stats: stats["utilities_carbon_month"] < stats["utilities_carbon_last_month"] and stats["utilities_count"] >= 1,
        "progress": lambda stats: 1 if stats["utilities_carbon_month"] < stats["utilities_carbon_last_month"] else 0,
        "target": 1,
        "xp": 35,
    },
    
    # ========== STREAKS PATH ==========
    {
        "id": "streak_7",
        "path": "streaks",
        "title": "Week Warrior",
        "description": "Track for 7 days straight",
        "icon_key": "fire",
        "condition": lambda stats: stats["tracking_streak"] >= 7,
        "progress": lambda stats: min(7, stats["tracking_streak"]),
        "target": 7,
        "xp": 25,
    },
    {
        "id": "streak_14",
        "path": "streaks",
        "title": "Fortnight Fighter",
        "description": "Track for 14 days straight",
        "icon_key": "fire",
        "condition": lambda stats: stats["tracking_streak"] >= 14,
        "progress": lambda stats: min(14, stats["tracking_streak"]),
        "target": 14,
        "xp": 50,
    },
    {
        "id": "streak_30",
        "path": "streaks",
        "title": "Monthly Master",
        "description": "Track for 30 days straight",
        "icon_key": "fire",
        "condition": lambda stats: stats["tracking_streak"] >= 30,
        "progress": lambda stats: min(30, stats["tracking_streak"]),
        "target": 30,
        "xp": 100,
    },
    {
        "id": "streak_60",
        "path": "streaks",
        "title": "Habit Formed",
        "description": "Track for 60 days straight",
        "icon_key": "medal",
        "condition": lambda stats: stats["tracking_streak"] >= 60,
        "progress": lambda stats: min(60, stats["tracking_streak"]),
        "target": 60,
        "xp": 200,
    },
    {
        "id": "streak_100",
        "path": "streaks",
        "title": "Century Club",
        "description": "Track for 100 days straight",
        "icon_key": "trophy",
        "condition": lambda stats: stats["tracking_streak"] >= 100,
        "progress": lambda stats: min(100, stats["tracking_streak"]),
        "target": 100,
        "xp": 500,
    },
    
    # ========== MILESTONES PATH ==========
    {
        "id": "first_reduction",
        "path": "milestones",
        "title": "First Reduction",
        "description": "Reduce emissions from last week",
        "icon_key": "arrow_down",
        "condition": lambda stats: stats["week_carbon"] < stats["last_week_carbon"] and stats["total_transactions"] >= 5,
        "progress": lambda stats: 1 if stats["week_carbon"] < stats["last_week_carbon"] else 0,
        "target": 1,
        "xp": 30,
    },
    {
        "id": "under_50_week",
        "path": "milestones",
        "title": "Under 50kg Week",
        "description": "Weekly emissions under 50kg",
        "icon_key": "target",
        "condition": lambda stats: stats["week_carbon"] < 50 and stats["total_transactions"] >= 5,
        "progress": lambda stats: max(0, 50 - stats["week_carbon"]),
        "target": 50,
        "xp": 40,
    },
    {
        "id": "under_100_month",
        "path": "milestones",
        "title": "Under 100kg Month",
        "description": "Monthly emissions under 100kg",
        "icon_key": "target",
        "condition": lambda stats: stats["month_carbon"] < 100 and stats["total_transactions"] >= 10,
        "progress": lambda stats: max(0, 100 - stats["month_carbon"]),
        "target": 100,
        "xp": 75,
    },
    {
        "id": "carbon_champion",
        "path": "milestones",
        "title": "Carbon Champion",
        "description": "Total saved emissions exceed 500kg",
        "icon_key": "crown",
        "condition": lambda stats: stats["total_saved"] >= 500,
        "progress": lambda stats: min(500, stats["total_saved"]),
        "target": 500,
        "xp": 200,
    },
    {
        "id": "planet_protector",
        "path": "milestones",
        "title": "Planet Protector",
        "description": "Total saved emissions exceed 1000kg (1 tonne!)",
        "icon_key": "globe",
        "condition": lambda stats: stats["total_saved"] >= 1000,
        "progress": lambda stats: min(1000, stats["total_saved"]),
        "target": 1000,
        "xp": 500,
    },
    {
        "id": "climate_hero",
        "path": "milestones",
        "title": "Climate Hero",
        "description": "Total saved emissions exceed 5000kg (5 tonnes!)",
        "icon_key": "superhero",
        "condition": lambda stats: stats["total_saved"] >= 5000,
        "progress": lambda stats: min(5000, stats["total_saved"]),
        "target": 5000,
        "xp": 1000,
    },
]


async def calculate_user_stats(user_id: PydanticObjectId) -> dict:
    """Calculate all statistics needed for achievements."""
    now = datetime.utcnow()
    
    # Time ranges
    week_start = now - timedelta(days=now.weekday())
    last_week_start = week_start - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    quarter_start = now.replace(month=((now.month - 1) // 3) * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    stats = {}
    
    # Total transactions
    stats["total_transactions"] = await Transaction.find(Transaction.user_id == user_id).count()
    
    # Imported transactions
    stats["imported_transactions"] = await Transaction.find(
        Transaction.user_id == user_id,
        Transaction.source == "import"
    ).count()
    
    # Categories used
    cat_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$category"}}
    ]
    result = await run_aggregation(cat_pipeline)
    stats["categories_used"] = len(result)
    
    # Category-specific counts
    for category in ["Travel", "Food", "Shopping", "Electricity", "Gas", "Water", "Home"]:
        cat_count = await Transaction.find(
            Transaction.user_id == user_id,
            Transaction.category == category
        ).count()
        stats[f"{category.lower()}_count"] = cat_count
    
    # Combined utilities count for backwards compatibility
    stats["utilities_count"] = stats.get("electricity_count", 0) + stats.get("gas_count", 0) + stats.get("water_count", 0)
    
    # Weekly carbon
    week_pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": week_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    result = await run_aggregation(week_pipeline)
    stats["week_carbon"] = result[0]["total"] if result else 0
    
    # Last week carbon
    last_week_pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": last_week_start, "$lt": week_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    result = await run_aggregation(last_week_pipeline)
    stats["last_week_carbon"] = result[0]["total"] if result else 0
    
    # Monthly carbon
    month_pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    result = await run_aggregation(month_pipeline)
    stats["month_carbon"] = result[0]["total"] if result else 0
    
    # Last month carbon
    last_month_pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": last_month_start, "$lt": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    result = await run_aggregation(last_month_pipeline)
    stats["last_month_carbon"] = result[0]["total"] if result else 0
    
    # Category-specific monthly carbon
    for category in ["Travel", "Food", "Shopping", "Electricity", "Gas", "Water"]:
        cat_pipeline = [
            {"$match": {"user_id": user_id, "category": category, "date": {"$gte": month_start}}},
            {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
        ]
        result = await run_aggregation(cat_pipeline)
        stats[f"{category.lower()}_carbon_month"] = result[0]["total"] if result else 0
        
        # Last month for comparison
        last_cat_pipeline = [
            {"$match": {"user_id": user_id, "category": category, "date": {"$gte": last_month_start, "$lt": month_start}}},
            {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
        ]
        result = await run_aggregation(last_cat_pipeline)
        stats[f"{category.lower()}_carbon_last_month"] = result[0]["total"] if result else 0
    
    # Combined utilities carbon for backwards compatibility
    stats["utilities_carbon_month"] = (
        stats.get("electricity_carbon_month", 0) + 
        stats.get("gas_carbon_month", 0) + 
        stats.get("water_carbon_month", 0)
    )
    stats["utilities_carbon_last_month"] = (
        stats.get("electricity_carbon_last_month", 0) + 
        stats.get("gas_carbon_last_month", 0) + 
        stats.get("water_carbon_last_month", 0)
    )
    
    # Shopping count this month
    stats["shopping_count_month"] = await Transaction.find(
        Transaction.user_id == user_id,
        Transaction.category == "Shopping",
        Transaction.date >= month_start
    ).count()
    
    # Flight count this quarter (check for airline keywords)
    flight_keywords = ["indigo", "air india", "spicejet", "vistara", "goair", "akasa", "flight", "airline"]
    flight_count = 0
    travel_transactions = await Transaction.find(
        Transaction.user_id == user_id,
        Transaction.category == "Travel",
        Transaction.date >= quarter_start
    ).to_list()
    for t in travel_transactions:
        name_lower = t.name.lower()
        if any(kw in name_lower for kw in flight_keywords):
            flight_count += 1
    stats["flight_count_quarter"] = flight_count
    
    # Public transit count
    transit_keywords = ["metro", "bus", "train", "railway", "irctc", "redbus", "local"]
    transit_count = 0
    all_travel = await Transaction.find(
        Transaction.user_id == user_id,
        Transaction.category == "Travel"
    ).to_list()
    for t in all_travel:
        name_lower = t.name.lower()
        if any(kw in name_lower for kw in transit_keywords):
            transit_count += 1
    stats["public_transit_count"] = transit_count
    
    # Food delivery count this month
    delivery_keywords = ["swiggy", "zomato", "eatsure", "delivery"]
    delivery_count = 0
    food_transactions = await Transaction.find(
        Transaction.user_id == user_id,
        Transaction.category == "Food",
        Transaction.date >= month_start
    ).to_list()
    for t in food_transactions:
        name_lower = t.name.lower()
        if any(kw in name_lower for kw in delivery_keywords):
            delivery_count += 1
    stats["delivery_count_month"] = delivery_count
    
    # Local market count
    local_keywords = ["dmart", "d-mart", "more", "spencer", "reliance fresh", "market", "grocer", "kirana"]
    local_count = 0
    for t in food_transactions:
        name_lower = t.name.lower()
        if any(kw in name_lower for kw in local_keywords):
            local_count += 1
    stats["local_market_count"] = local_count
    
    # Low food months (simplified - check if this month is low)
    stats["low_food_months"] = 1 if stats["food_carbon_month"] < 15 else 0
    
    # Days since last shopping
    last_shopping = await Transaction.find(
        Transaction.user_id == user_id,
        Transaction.category == "Shopping"
    ).sort(-Transaction.date).first_or_none()
    if last_shopping:
        stats["days_since_shopping"] = (now - last_shopping.date).days
    else:
        stats["days_since_shopping"] = 999  # No shopping ever
    
    # Tracking streak (simplified - count days with transactions in last 30 days)
    dates_pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": now - timedelta(days=100)}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}}}},
        {"$sort": {"_id": -1}}
    ]
    result = await run_aggregation(dates_pipeline)
    dates = [r["_id"] for r in result]
    
    # Calculate streak
    streak = 0
    current_date = now.date()
    for i in range(100):
        check_date = (current_date - timedelta(days=i)).isoformat()
        if check_date in dates:
            streak += 1
        else:
            break
    stats["tracking_streak"] = streak
    
    # Total saved (estimated - assume average is 200kg/month, saved = 200 - actual)
    total_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
    ]
    result = await run_aggregation(total_pipeline)
    total_carbon = result[0]["total"] if result else 0
    
    # Get account age in months (simplified)
    first_transaction = await Transaction.find(
        Transaction.user_id == user_id
    ).sort(Transaction.date).first_or_none()
    
    if first_transaction:
        months_active = max(1, (now - first_transaction.date).days // 30)
        expected_carbon = months_active * 200  # Average Indian is ~200kg/month
        stats["total_saved"] = max(0, expected_carbon - total_carbon)
    else:
        stats["total_saved"] = 0
    
    return stats


@router.get("")
async def get_progress(current_user: User = Depends(get_current_user)):
    """Get user's progress, achievements, and emission trends."""
    now = datetime.utcnow()
    
    # Calculate all user stats
    stats = await calculate_user_stats(current_user.id)
    
    # Calculate emission trends
    trends = []
    
    # Weekly
    week_start = now - timedelta(days=now.weekday())
    week_goal = 50
    week_change = ((stats["week_carbon"] - stats["last_week_carbon"]) / stats["last_week_carbon"]) * 100 if stats["last_week_carbon"] else 0
    
    trends.append({
        "period": "Week",
        "current": round(stats["week_carbon"], 1),
        "previous": round(stats["last_week_carbon"], 1),
        "change_percent": round(week_change, 1),
        "goal": week_goal,
        "progress_percent": min(100, round((1 - stats["week_carbon"] / week_goal) * 100, 0)) if week_goal else 0,
    })
    
    # Monthly
    month_goal = 150
    month_change = ((stats["month_carbon"] - stats["last_month_carbon"]) / stats["last_month_carbon"]) * 100 if stats["last_month_carbon"] else 0
    
    trends.append({
        "period": "Month",
        "current": round(stats["month_carbon"], 1),
        "previous": round(stats["last_month_carbon"], 1),
        "change_percent": round(month_change, 1),
        "goal": month_goal,
        "progress_percent": min(100, round((1 - stats["month_carbon"] / month_goal) * 100, 0)) if month_goal else 0,
    })
    
    # Quarterly (simplified)
    quarter_carbon = stats["month_carbon"] * 3  # Estimate
    quarter_goal = 400
    
    trends.append({
        "period": "Quarter",
        "current": round(quarter_carbon, 1),
        "previous": 0,
        "change_percent": 0,
        "goal": quarter_goal,
        "progress_percent": min(100, round((1 - quarter_carbon / quarter_goal) * 100, 0)) if quarter_goal else 0,
    })
    
    # Process achievements
    achievements = []
    total_xp = 0
    unlocked_count = 0
    
    for achievement in ACHIEVEMENTS:
        try:
            unlocked = achievement["condition"](stats)
            progress = achievement["progress"](stats)
        except Exception:
            unlocked = False
            progress = 0
        
        if unlocked:
            total_xp += achievement["xp"]
            unlocked_count += 1
        
        achievements.append({
            "id": achievement["id"],
            "path": achievement["path"],
            "title": achievement["title"],
            "description": achievement["description"],
            "icon_key": achievement["icon_key"],
            "unlocked": unlocked,
            "unlocked_date": "Achieved" if unlocked else None,
            "progress": progress,
            "target": achievement["target"],
            "xp": achievement["xp"],
        })
    
    # Calculate level from XP
    level = 1
    xp_thresholds = [0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000, 5000]
    for i, threshold in enumerate(xp_thresholds):
        if total_xp >= threshold:
            level = i + 1
    next_level_xp = xp_thresholds[min(level, len(xp_thresholds) - 1)]
    current_level_xp = xp_thresholds[min(level - 1, len(xp_thresholds) - 1)]
    
    # Path progress
    path_progress = {}
    for path_id, path_info in ACHIEVEMENT_PATHS.items():
        path_achievements = [a for a in achievements if a["path"] == path_id]
        unlocked_in_path = sum(1 for a in path_achievements if a["unlocked"])
        path_progress[path_id] = {
            **path_info,
            "total": len(path_achievements),
            "unlocked": unlocked_in_path,
            "progress_percent": round((unlocked_in_path / len(path_achievements)) * 100) if path_achievements else 0,
        }
    
    # Generate tips
    tips = []
    if stats["travel_carbon_month"] > 30:
        tips.append("Consider using public transport or carpooling to reduce travel emissions")
    if stats["shopping_carbon_month"] > 20:
        tips.append("Try buying from local stores to reduce delivery-related carbon emissions")
    if stats["month_carbon"] > month_goal:
        tips.append(f"You're {round(stats['month_carbon'] - month_goal, 1)}kg over your monthly goal. Focus on high-impact categories")
    if stats["tracking_streak"] < 7:
        tips.append("Track daily to build a streak and unlock more achievements!")
    if stats["categories_used"] < 5:
        tips.append("Add transactions in all 5 categories to unlock the 'Full Picture' badge")
    
    if not tips:
        tips = [
            "Great job keeping your emissions low!",
            "Consider tracking more transactions for better insights",
            "Share your eco-friendly tips with friends and family"
        ]
    
    # Get user's goals
    goals = await Goal.find(Goal.user_id == current_user.id).to_list()
    goals_data = [
        {
            "id": str(goal.id),
            "title": goal.title,
            "target": goal.target,
            "current": goal.current,
            "unit": goal.unit,
            "deadline": goal.deadline.isoformat(),
            "completed": goal.completed,
            "progress": goal.progress,
        }
        for goal in goals
    ]
    
    # Carbon over time (last 12 weeks for chart)
    carbon_history = []
    for i in range(12):
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(days=7)
        
        hist_pipeline = [
            {"$match": {"user_id": current_user.id, "date": {"$gte": week_start, "$lt": week_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$carbon"}}}
        ]
        result = await run_aggregation(hist_pipeline)
        carbon = result[0]["total"] if result else 0
        
        carbon_history.append({
            "week": f"W{12-i}",
            "date": week_start.strftime("%b %d"),
            "carbon": round(carbon, 1),
        })
    
    carbon_history.reverse()
    
    # Category breakdown for chart
    category_breakdown = []
    for category in ["Travel", "Food", "Shopping", "Electricity", "Gas", "Water", "Home"]:
        carbon = stats.get(f"{category.lower()}_carbon_month", 0)
        category_breakdown.append({
            "category": category,
            "carbon": round(carbon, 1),
        })
    
    return {
        "emission_trends": trends,
        "achievements": achievements,
        "tips": tips,
        "goals": goals_data,
        "paths": path_progress,
        "gamification": {
            "level": level,
            "total_xp": total_xp,
            "current_level_xp": current_level_xp,
            "next_level_xp": next_level_xp,
            "xp_progress": round(((total_xp - current_level_xp) / (next_level_xp - current_level_xp)) * 100) if next_level_xp > current_level_xp else 100,
            "achievements_unlocked": unlocked_count,
            "total_achievements": len(ACHIEVEMENTS),
            "streak": stats["tracking_streak"],
        },
        "charts": {
            "carbon_history": carbon_history,
            "category_breakdown": category_breakdown,
        },
        "summary": {
            "total_transactions": stats["total_transactions"],
            "this_month_carbon": round(stats["month_carbon"], 1),
            "monthly_goal": month_goal,
            "on_track": stats["month_carbon"] <= month_goal,
            "total_saved": round(stats["total_saved"], 1),
        },
        "motivational_message": get_motivational_message(stats, level),
    }


def get_motivational_message(stats: dict, level: int) -> str:
    """Generate a motivational message based on user stats."""
    messages = []
    
    if stats["week_carbon"] < stats["last_week_carbon"]:
        messages.append("🎉 Your emissions are down this week! Keep it up!")
    
    if stats["tracking_streak"] >= 7:
        messages.append(f"🔥 Amazing {stats['tracking_streak']}-day tracking streak!")
    
    if stats["month_carbon"] < 100:
        messages.append("🌟 You're a carbon reduction superstar!")
    
    if level >= 5:
        messages.append(f"👑 Level {level} Eco Warrior - You're making a real difference!")
    
    if not messages:
        if stats["total_transactions"] < 5:
            return "🌱 Welcome! Start tracking to see your environmental impact."
        elif stats["month_carbon"] > 150:
            return "💪 Every small step counts. Let's find ways to reduce together!"
        else:
            return "🌍 You're doing great! Keep making eco-friendly choices."
    
    return messages[0]


@router.post("/goals", status_code=status.HTTP_201_CREATED)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new goal."""
    goal = Goal(
        user_id=current_user.id,
        title=data.title,
        target=data.target,
        unit=data.unit,
        deadline=data.deadline,
    )
    await goal.insert()
    
    return {
        "id": str(goal.id),
        "title": goal.title,
        "target": goal.target,
        "current": goal.current,
        "unit": goal.unit,
        "deadline": goal.deadline.isoformat(),
        "completed": goal.completed,
        "progress": goal.progress,
    }


@router.patch("/goals/{goal_id}")
async def update_goal(
    goal_id: str,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a goal."""
    try:
        goal = await Goal.find_one(
            Goal.id == PydanticObjectId(goal_id),
            Goal.user_id == current_user.id,
        )
    except Exception:
        goal = None
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    goal.updated_at = datetime.utcnow()
    await goal.save()
    
    return {
        "id": str(goal.id),
        "title": goal.title,
        "target": goal.target,
        "current": goal.current,
        "unit": goal.unit,
        "deadline": goal.deadline.isoformat(),
        "completed": goal.completed,
        "progress": goal.progress,
    }


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a goal."""
    try:
        goal = await Goal.find_one(
            Goal.id == PydanticObjectId(goal_id),
            Goal.user_id == current_user.id,
        )
    except Exception:
        goal = None
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    await goal.delete()
