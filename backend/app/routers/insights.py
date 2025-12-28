from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from app.models.user import User
from app.models.transaction import Transaction
from app.utils.auth import get_current_user


router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("")
async def get_insights(current_user: User = Depends(get_current_user)):
    """Get personalized insights and recommendations."""
    now = datetime.utcnow()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get category breakdown for insights using Motor collection directly
    collection = Transaction.get_pymongo_collection()
    category_pipeline = [
        {"$match": {"user_id": current_user.id, "date": {"$gte": current_month_start}}},
        {"$group": {
            "_id": "$category",
            "carbon": {"$sum": "$carbon"},
            "amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    cursor = collection.aggregate(category_pipeline)
    result = await cursor.to_list(length=None)
    categories = {c["_id"]: {"carbon": c["carbon"], "amount": c["amount"], "count": c["count"]} for c in result}
    
    total_carbon = sum(c["carbon"] for c in categories.values()) or 1
    total_transactions = sum(c["count"] for c in categories.values())
    
    # Generate recommendations based on spending patterns
    recommendations = []
    
    # Travel recommendations
    if "Travel" in categories:
        travel_data = categories["Travel"]
        travel_pct = (travel_data["carbon"] / total_carbon) * 100
        
        if travel_pct > 40:
            recommendations.append({
                "id": "travel-critical",
                "title": "Travel is Your Biggest Impact",
                "description": f"Travel accounts for {travel_pct:.0f}% of your carbon footprint this month.",
                "tip": "For trips under 300km, trains emit 80% less CO₂ than flights. Consider carpooling for daily commutes.",
                "potential_savings": f"Up to {travel_data['carbon'] * 0.6:.0f} kg CO₂/month",
                "priority": "high",
                "category": "Travel",
            })
        elif travel_pct > 25:
            recommendations.append({
                "id": "travel-high",
                "title": "Optimize Your Travel",
                "description": f"Your travel spending accounts for {travel_pct:.0f}% of your carbon footprint.",
                "tip": "Use metro or bus for trips under 10km. Many Indian cities now have excellent public transport.",
                "potential_savings": f"Up to {travel_data['carbon'] * 0.4:.0f} kg CO₂/month",
                "priority": "high",
                "category": "Travel",
            })
        
        if travel_data["count"] > 15:
            recommendations.append({
                "id": "travel-frequency",
                "title": "Reduce Trip Frequency",
                "description": f"You've made {travel_data['count']} travel transactions this month.",
                "tip": "Combine multiple errands into single trips. Walk or cycle for distances under 2km.",
                "potential_savings": "20-30 kg CO₂/month",
                "priority": "medium",
                "category": "Travel",
            })
    
    # Food recommendations
    if "Food" in categories:
        food_data = categories["Food"]
        food_pct = (food_data["carbon"] / total_carbon) * 100
        
        if food_data["count"] > 20:
            recommendations.append({
                "id": "food-delivery",
                "title": "Reduce Food Delivery",
                "description": f"You've ordered food {food_data['count']} times. Delivery adds packaging and transport emissions.",
                "tip": "Cook at home 3 more times per week. Try batch cooking on weekends to save time.",
                "potential_savings": "15-25 kg CO₂/month",
                "priority": "high",
                "category": "Food",
            })
        elif food_data["count"] > 10:
            recommendations.append({
                "id": "food-choices",
                "title": "Smarter Food Choices",
                "description": "Your food habits have room for improvement.",
                "tip": "Choose local restaurants over chains. They often source ingredients locally, reducing transport emissions.",
                "potential_savings": "10-15 kg CO₂/month",
                "priority": "medium",
                "category": "Food",
            })
        
        if food_pct > 30:
            recommendations.append({
                "id": "food-local",
                "title": "Go Local with Groceries",
                "description": "Consider buying from local markets instead of imported goods.",
                "tip": "Visit your nearby sabzi mandi or D-Mart for seasonal, local produce. Avoid imported fruits and veggies.",
                "potential_savings": "8-12 kg CO₂/month",
                "priority": "medium",
                "category": "Food",
            })
    
    # Shopping recommendations
    if "Shopping" in categories:
        shopping_data = categories["Shopping"]
        
        if shopping_data["count"] > 15:
            recommendations.append({
                "id": "shopping-frequency",
                "title": "Consolidate Your Orders",
                "description": f"You've made {shopping_data['count']} shopping transactions this month.",
                "tip": "Batch your online orders to reduce delivery trips. Use 'no-rush' delivery options when available.",
                "potential_savings": "10-15 kg CO₂/month",
                "priority": "high",
                "category": "Shopping",
            })
        elif shopping_data["count"] > 8:
            recommendations.append({
                "id": "shopping-habits",
                "title": "Mindful Shopping",
                "description": "Multiple small purchases add up in packaging and delivery emissions.",
                "tip": "Make a shopping list and order once a week. Choose products with minimal packaging.",
                "potential_savings": "5-10 kg CO₂/month",
                "priority": "medium",
                "category": "Shopping",
            })
        
        if shopping_data["carbon"] > 20:
            recommendations.append({
                "id": "shopping-secondhand",
                "title": "Consider Secondhand",
                "description": "New products have a significant carbon footprint from manufacturing.",
                "tip": "Check OLX, Facebook Marketplace, or local thrift stores for furniture and electronics.",
                "potential_savings": "15-30 kg CO₂/month",
                "priority": "medium",
                "category": "Shopping",
            })
    
    # Utilities recommendations
    if "Electricity" in categories:
        electricity_data = categories["Electricity"]
        
        if electricity_data["carbon"] > 20:
            recommendations.append({
                "id": "electricity-ac",
                "title": "Optimize AC Usage",
                "description": "Air conditioning is likely a major contributor to your electricity emissions.",
                "tip": "Set AC to 24-26°C instead of lower. Each degree lower uses 6% more electricity. Use fans alongside AC.",
                "potential_savings": "15-25 kg CO₂/month",
                "priority": "high",
                "category": "Electricity",
            })
        
        if electricity_data["count"] >= 1:
            recommendations.append({
                "id": "electricity-appliances",
                "title": "Appliance Efficiency",
                "description": "Small changes in appliance usage can make a big difference.",
                "tip": "Unplug chargers when not in use. Use LED bulbs. Run washing machine with full loads only.",
                "potential_savings": "8-12 kg CO₂/month",
                "priority": "medium",
                "category": "Electricity",
            })
    
    if "Gas" in categories:
        gas_data = categories["Gas"]
        
        if gas_data["carbon"] > 10:
            recommendations.append({
                "id": "gas-cooking",
                "title": "Efficient Cooking",
                "description": "Your cooking gas usage contributes significantly to emissions.",
                "tip": "Use pressure cookers to reduce cooking time by 70%. Cover pots while cooking. Use the right burner size for your vessels.",
                "potential_savings": "5-10 kg CO₂/month",
                "priority": "medium",
                "category": "Gas",
            })
    
    if "Water" in categories:
        water_data = categories["Water"]
        
        if water_data["carbon"] > 5:
            recommendations.append({
                "id": "water-conservation",
                "title": "Water Conservation",
                "description": "Reducing water usage also reduces energy used for pumping and treatment.",
                "tip": "Fix leaky taps. Take shorter showers. Use bucket baths instead of showers. Water plants in the evening.",
                "potential_savings": "2-5 kg CO₂/month",
                "priority": "low",
                "category": "Water",
            })
    
    # Home recommendations
    if "Home" in categories:
        home_data = categories["Home"]
        
        if home_data["carbon"] > 15:
            recommendations.append({
                "id": "home-efficiency",
                "title": "Home Energy Efficiency",
                "description": "Your home-related spending has a notable carbon impact.",
                "tip": "Use natural light during day. Ensure windows are sealed properly. Consider solar water heaters.",
                "potential_savings": "10-20 kg CO₂/month",
                "priority": "medium",
                "category": "Home",
            })
    
    # General recommendations based on total usage
    if total_transactions < 5:
        recommendations.append({
            "id": "general-track",
            "title": "Track More Transactions",
            "description": "Add more transactions to get accurate, personalized insights.",
            "tip": "Import your bank statement or add transactions daily for the best analysis.",
            "potential_savings": "Better insights",
            "priority": "low",
            "category": "General",
        })
    
    # Always include some actionable tips
    if len(recommendations) < 3:
        if "Shopping" not in categories or categories.get("Shopping", {}).get("count", 0) < 5:
            recommendations.append({
                "id": "general-reusable",
                "title": "Go Reusable",
                "description": "Single-use items contribute to both waste and carbon emissions.",
                "tip": "Carry a reusable water bottle, coffee cup, and shopping bags. Refuse plastic straws and cutlery.",
                "potential_savings": "5-8 kg CO₂/month",
                "priority": "low",
                "category": "Shopping",
            })
        
        if "Travel" not in categories or categories.get("Travel", {}).get("count", 0) < 5:
            recommendations.append({
                "id": "general-walk",
                "title": "Walk More",
                "description": "Short trips in vehicles add up quickly.",
                "tip": "For distances under 1km, walk instead of taking an auto or cab. It's healthier too!",
                "potential_savings": "3-5 kg CO₂/month",
                "priority": "low",
                "category": "Travel",
            })
    
    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 2))
    
    # Calculate total potential savings
    def parse_savings(savings_str: str) -> float:
        """Parse potential savings string to get a numeric value."""
        try:
            import re
            numbers = re.findall(r'[\d.]+', savings_str)
            if len(numbers) >= 2:
                return (float(numbers[0]) + float(numbers[1])) / 2
            elif len(numbers) == 1:
                return float(numbers[0])
            return 0
        except (ValueError, IndexError):
            return 0
    
    total_potential = sum(
        parse_savings(r["potential_savings"])
        for r in recommendations
        if r["potential_savings"] and any(c.isdigit() for c in r["potential_savings"])
    )
    
    return {
        "recommendations": recommendations,
        "potential_monthly_savings": round(total_potential),
        "category_breakdown": [
            {"category": k, "carbon": round(v["carbon"], 2), "count": v["count"]}
            for k, v in categories.items()
        ],
    }
