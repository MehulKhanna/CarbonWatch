"""
Centralized constants for Carbon Watch.
All category definitions, carbon factors, and keyword lists in one place.
"""

from typing import Literal

# =============================================================================
# CATEGORIES
# =============================================================================

CATEGORIES = ["Travel", "Food", "Shopping", "Electricity", "Gas", "Water", "Home"]
Category = Literal["Travel", "Food", "Shopping", "Electricity", "Gas", "Water", "Home"]


# =============================================================================
# CARBON EMISSION FACTORS (kg CO2 per INR spent)
# Calibrated for Indian context
# =============================================================================

CARBON_FACTORS = {
    "Travel": 0.0030,
    "Food": 0.0016,
    "Shopping": 0.0025,
    "Electricity": 0.0008,
    "Gas": 0.0012,
    "Water": 0.0003,
    "Home": 0.0028,
}

# Merchant-specific factors for more accurate calculation
MERCHANT_FACTORS = {
    # Airlines (high emissions)
    "indigo": 0.0044,
    "air india": 0.0044,
    "spicejet": 0.0042,
    "vistara": 0.0044,
    "akasa": 0.0042,
    
    # Fuel stations
    "indian oil": 0.0031,
    "hp petrol": 0.0031,
    "bharat petroleum": 0.0031,
    "bpcl": 0.0031,
    "shell": 0.0031,
    "petrol": 0.0031,
    
    # Rideshare
    "uber": 0.0019,
    "ola": 0.0019,
    "rapido": 0.0015,
    "metro": 0.0006,
    "irctc": 0.0025,
    
    # Fast food
    "mcdonald": 0.00056,
    "burger king": 0.00056,
    "kfc": 0.00056,
    "dominos": 0.00050,
    "pizza hut": 0.00050,
    
    # Cafes
    "starbucks": 0.00031,
    "cafe coffee day": 0.00028,
    "ccd": 0.00028,
    
    # Grocery delivery
    "bigbasket": 0.00035,
    "dmart": 0.00032,
    "blinkit": 0.00038,
    "zepto": 0.00038,
    "swiggy": 0.00045,
    "zomato": 0.00045,
    
    # Online shopping
    "amazon": 0.00069,
    "flipkart": 0.00065,
    "myntra": 0.00060,
    "nykaa": 0.00055,
    
    # Utilities
    "electricity": 0.00015,
    "bescom": 0.00015,
    "tata power": 0.00015,
    "gas bill": 0.00012,
    "mahanagar gas": 0.00012,
    "water bill": 0.00006,
}


# =============================================================================
# CATEGORIZATION KEYWORDS
# =============================================================================

# Keywords to ignore (P2P transfers, banking operations, etc.)
IGNORE_KEYWORDS = [
    "neft", "imps", "rtgs", "fund transfer", "a/c transfer",
    "int.pb.", "interest", "int.paid",
    "atm", "cash withdrawal", "cash deposit",
    "self transfer", "own account",
    "emi ", "loan repay", "insurance premium", "lic premium", "sip ",
    "mutual fund", "mf purchase", "investment",
    "bank charge", "service charge", "sms charge", "annual fee",
    "gst on", "tds ",
    "salary credit", "credit interest",
]

# Category-specific keywords for transaction categorization
CATEGORY_KEYWORDS = {
    "Travel": [
        "indigo", "air india", "spicejet", "vistara", "akasa",
        "uber", "ola", "rapido", "taxi", "cab",
        "petrol", "diesel", "fuel", "indian oil", "bpcl", "shell",
        "irctc", "railway", "redbus", "metro", "toll", "fastag",
        "makemytrip", "goibibo", "yatra", "cleartrip",
    ],
    "Food": [
        "srm ist canteen", "canteen",
        "restaurant", "cafe", "coffee", "starbucks", "ccd",
        "mcdonald", "burger", "pizza", "dominos", "kfc", "subway",
        "swiggy", "zomato", "food", "eatsure",
        "bigbasket", "dmart", "blinkit", "zepto", "instamart", "jiomart",
        "grofers", "reliance fresh", "more supermarket", "vendolite",
    ],
    "Shopping": [
        "blinkit", "zepto", "instamart", "jiomart", "durga swami",
        "amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho",
        "snapdeal", "croma", "reliance digital",
        "shoppers stop", "lifestyle", "central", "westside",
        "decathlon", "puma", "nike", "adidas", "bistro"
        "electronics", "mobile", "supermarket", "super market"
    ],
    "Electricity": [
        "electricity", "bescom", "tata power", "adani electricity",
        "torrent power", "reliance energy", "power bill", "mseb",
    ],
    "Gas": [
        "gas bill", "png", "mahanagar gas", "indraprastha gas", "igl",
        "lpg", "hp gas", "bharat gas", "indane", "cooking gas",
    ],
    "Water": [
        "water bill", "municipal", "water supply", "jal board",
        "bwssb", "delhi jal board",
    ],
    "Home": [
        "ikea", "pepperfry", "urban ladder", "hometown",
        "asian paints", "berger",
        "rent", "society", "maintenance", "housing",
        "jio", "airtel", "vodafone", "bsnl",
        "broadband", "internet", "wifi", "dth", "tata sky",
    ],
}


# =============================================================================
# GAMIFICATION (simplified)
# =============================================================================

XP_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000, 5000]

# Default goals
DEFAULT_WEEKLY_GOAL = 50  # kg CO2
DEFAULT_MONTHLY_GOAL = 150  # kg CO2
