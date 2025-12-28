# Carbon emission factors by category (kg CO2 per INR spent)
# These are calibrated values for Indian context

CARBON_FACTORS = {
    "Travel": 0.0030,       # Includes flights, petrol, rideshare
    "Food": 0.0016,         # Restaurants, groceries
    "Shopping": 0.0025,     # General retail, online shopping
    "Electricity": 0.0008,  # Electricity bills
    "Gas": 0.0012,          # Cooking gas (LPG / PNG)
    "Water": 0.0003,        # Water bills
    "Home": 0.0028,         # Home improvement, furniture
}

# More specific factors for common Indian merchants (kg CO2 per INR)
MERCHANT_FACTORS = {
    # Airlines (high emissions)
    "indigo": 0.0044,
    "air india": 0.0044,
    "spicejet": 0.0042,
    "vistara": 0.0044,
    "go air": 0.0042,
    "akasa": 0.0042,
    "airindia": 0.0044,
    
    # Petrol/Gas stations
    "indian oil": 0.0031,
    "iocl": 0.0031,
    "hp petrol": 0.0031,
    "hindustan petroleum": 0.0031,
    "bharat petroleum": 0.0031,
    "bpcl": 0.0031,
    "reliance petrol": 0.0031,
    "shell": 0.0031,
    "petrol": 0.0031,
    "diesel": 0.0031,
    "fuel": 0.0031,
    
    # Rideshare/Transport
    "uber": 0.0019,
    "ola": 0.0019,
    "rapido": 0.0015,
    "auto": 0.0012,
    "metro": 0.0006,
    "irctc": 0.0025,
    "railways": 0.0015,
    "redbus": 0.0018,
    
    # Fast food (higher emissions)
    "mcdonald": 0.00056,
    "burger king": 0.00056,
    "kfc": 0.00056,
    "dominos": 0.00050,
    "pizza hut": 0.00050,
    "subway": 0.00045,
    
    # Coffee shops/Cafes
    "starbucks": 0.00031,
    "cafe coffee day": 0.00028,
    "ccd": 0.00028,
    "barista": 0.00028,
    "costa coffee": 0.00028,
    "blue tokai": 0.00025,
    
    # Grocery/Supermarkets
    "bigbasket": 0.00035,
    "big basket": 0.00035,
    "dmart": 0.00032,
    "d-mart": 0.00032,
    "reliance fresh": 0.00035,
    "more supermarket": 0.00033,
    "spencer": 0.00035,
    "nature's basket": 0.00038,
    "grofers": 0.00035,
    "blinkit": 0.00038,
    "zepto": 0.00038,
    "instamart": 0.00038,
    "jiomart": 0.00035,
    
    # Food delivery
    "swiggy": 0.00045,
    "zomato": 0.00045,
    "eatsure": 0.00042,
    
    # Online shopping
    "amazon": 0.00069,
    "flipkart": 0.00065,
    "myntra": 0.00060,
    "ajio": 0.00060,
    "nykaa": 0.00055,
    "meesho": 0.00055,
    "snapdeal": 0.00060,
    "tata cliq": 0.00058,
    "croma": 0.00065,
    "reliance digital": 0.00065,
    
    # Utilities/Services
    "electricity": 0.00015,
    "bescom": 0.00015,
    "tata power": 0.00015,
    "adani electricity": 0.00015,
    "torrent power": 0.00015,
    "reliance energy": 0.00015,
    "gas bill": 0.00012,
    "png": 0.00012,
    "mahanagar gas": 0.00012,
    "indraprastha gas": 0.00012,
    "water bill": 0.00006,
    
    # Telecom
    "jio": 0.00008,
    "airtel": 0.00008,
    "vi ": 0.00008,
    "vodafone": 0.00008,
    "idea": 0.00008,
    "bsnl": 0.00008,
    
    # Entertainment
    "bookmyshow": 0.00020,
    "pvr": 0.00025,
    "inox": 0.00025,
    "netflix": 0.00015,
    "hotstar": 0.00015,
    "prime video": 0.00015,
    
    # Home & Furniture
    "ikea": 0.00028,
    "pepperfry": 0.00025,
    "urban ladder": 0.00025,
    "hometown": 0.00025,
    "home centre": 0.00025,
}

# Indian bank-specific patterns for categorization
INDIAN_BANK_PATTERNS = {
    "hdfc": True,
    "icici": True,
    "sbi": True,
    "axis": True,
    "kotak": True,
    "yes bank": True,
    "pnb": True,
    "bob": True,
    "idbi": True,
    "canara": True,
    "union bank": True,
    "indian bank": True,
    "indusind": True,
    "rbl": True,
    "federal bank": True,
}


def calculate_carbon(
    amount: float,
    category: str,
    merchant_name: str = ""
) -> float:
    """
    Calculate carbon emissions for a transaction.
    
    Args:
        amount: Transaction amount in INR
        category: Category of the transaction
        merchant_name: Name of the merchant (optional, for more accurate calculation)
    
    Returns:
        Estimated CO2 emissions in kg
    """
    # First, try to match merchant for more accurate calculation
    merchant_lower = merchant_name.lower()
    for merchant_key, factor in MERCHANT_FACTORS.items():
        if merchant_key in merchant_lower:
            return round(amount * factor, 2)
    
    # Fall back to category-based calculation
    factor = CARBON_FACTORS.get(category, 0.0005)  # Default factor
    return round(amount * factor, 2)


def clean_transaction_name(raw_name: str) -> str:
    """
    Clean up transaction names from bank statements.
    
    Removes:
    - UPI prefixes (UPI-, UPI/)
    - Bank account suffixes (@okicici, @ybl, etc.)
    - Reference numbers and extra metadata
    - Duplicate words
    
    Examples:
    - "UPI-DOMINOS-DOMINOS.PAYU@OKICICI12345" → "Dominos"
    - "UPI-SWIGGY SWIGGY.PAYTM@YBL00001234" → "Swiggy"
    - "UPI-ZOMATO-ZOMATO@PAYTM000123" → "Zomato"
    
    Args:
        raw_name: Raw transaction name from bank statement
    
    Returns:
        Cleaned, readable merchant name
    """
    import re
    
    name = raw_name.strip()
    
    # Remove UPI prefix patterns
    name = re.sub(r'^UPI[-/]', '', name, flags=re.IGNORECASE)
    
    # Remove everything after @ (bank UPI handle)
    if '@' in name:
        name = name.split('@')[0]
    
    # Remove common suffixes before the @
    name = re.sub(r'[.\-_]?(PAYU|PAYTM|RAZORPAY|PHONEPE|GPAY|BHIM|YESBANK|HDFCBANK|ICICI|SBI|AXIS)$', '', name, flags=re.IGNORECASE)
    
    # Split by common delimiters
    parts = re.split(r'[-_.\s]+', name)
    
    # Remove empty parts and numeric-only parts (reference numbers)
    parts = [p for p in parts if p and not p.isdigit()]
    
    # Remove duplicate consecutive words (case-insensitive)
    cleaned_parts = []
    for part in parts:
        if not cleaned_parts or part.lower() != cleaned_parts[-1].lower():
            cleaned_parts.append(part)
    
    # Join and title case
    if cleaned_parts:
        name = ' '.join(cleaned_parts).title()
    else:
        name = raw_name.strip()  # Fallback to original if nothing left
    
    # Limit length
    if len(name) > 50:
        name = name[:50].rsplit(' ', 1)[0]  # Cut at word boundary
    
    return name


def categorize_transaction(merchant_name: str, description: str = "") -> str | None:
    """
    Attempt to categorize a transaction based on merchant name and description.
    
    Args:
        merchant_name: Name of the merchant
        description: Transaction description
    
    Returns:
        Category string, or None if transaction should be ignored (e.g., P2P transfers)
    """
    text = f"{merchant_name} {description}".lower()
    
    # ========== IGNORE PATTERNS ==========
    # Person-to-person transfers, bank transfers, etc. that don't have carbon footprint
    # Add keywords here for transactions that should be SKIPPED
    # Unknown UPI transactions will be skipped anyway since they won't match any category.
    ignore_keywords = [
        # Bank transfers (non-UPI)
        "neft", "imps", "rtgs", "fund transfer", "a/c transfer",
        "int.pb.", "interest", "int.paid",
        # ATM and cash
        "atm", "cash withdrawal", "cash deposit",
        # Self transfers
        "self transfer", "own account",
        # Loan/EMI/Insurance (financial, not consumption)
        "emi ", "loan repay", "insurance premium", "lic premium", "sip ",
        "mutual fund", "mf purchase", "investment",
        # Bank charges and fees
        "bank charge", "service charge", "sms charge", "annual fee",
        "gst on", "tds ",
        # Salary/Income (credits, not expenses)
        "salary credit", "credit interest",
    ]
    
    for keyword in ignore_keywords:
        if keyword in text:
            return None  # Skip this transaction
    
    # Travel keywords (Indian context)
    travel_keywords = [
        "indigo", "air india", "spicejet", "vistara", "goair", "akasa",
        "uber", "ola", "rapido", "taxi", "auto", "cab",
        "petrol", "diesel", "fuel", "iocl", "indian oil", "hp ", "bpcl", "shell",
        "irctc", "railway", "redbus", "metro", "toll", "fastag",
        "makemytrip", "goibibo", "yatra", "cleartrip", "easemytrip"
    ]
    
    # Food keywords (Indian context)
    food_keywords = [
        "srm ist", "durga swami", "chat corner",
        "restaurant", "cafe", "coffee", "starbucks", "ccd", "cafe coffee day",
        "mcdonald", "burger", "pizza", "dominos", "kfc", "subway",
        "swiggy", "zomato", "food", "eatsure", "box8",
        "bigbasket", "big basket", "dmart", "d-mart", "grofers", "blinkit",
        "zepto", "instamart", "jiomart", "reliance fresh", "spencer",
        "more supermarket", "nature's basket", "easyday", "vendolite"
    ]
    
    # Shopping keywords (Indian context)
    shopping_keywords = [
        "amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho",
        "snapdeal", "tata cliq", "croma", "reliance digital",
        "shoppers stop", "lifestyle", "central", "westside",
        "decathlon", "puma", "nike", "adidas", "h&m", "super market",
        "electronics", "mobile", "phone", "big save", "supermarket"
    ]
    
    # Electricity keywords (Indian context)
    electricity_keywords = [
        "electricity", "bescom", "tata power", "adani electricity", "torrent power",
        "reliance energy", "power bill", "electric bill", "mseb", "wbsedcl",
        "cesc", "bses", "uhbvn", "pspcl", "tneb", "kseb"
    ]
    
    # Gas keywords (Indian context)
    gas_keywords = [
        "gas bill", "png", "mahanagar gas", "indraprastha gas", "igl",
        "lpg", "hp gas", "bharat gas", "indane", "cooking gas",
        "gujarat gas", "adani gas", "gail"
    ]
    
    # Water keywords (Indian context)
    water_keywords = [
        "water bill", "municipal", "water supply", "jal board", "water tax",
        "bwssb", "delhi jal board", "mcgm water", "phed"
    ]
    
    # Home keywords (Indian context)
    home_keywords = [
        "ikea", "pepperfry", "urban ladder", "hometown", "home centre",
        "asian paints", "berger", "pidilite", "fevicol",
        "rent", "society", "maintenance", "housing",
        # Telecom moved to Home
        "jio", "airtel", "vodafone", "vi ", "idea", "bsnl",
        "broadband", "internet", "wifi", "dth", "tata sky", "dish tv"
    ]
    
    # Check each category
    for keyword in travel_keywords:
        if keyword in text:
            return "Travel"
    
    for keyword in food_keywords:
        if keyword in text:
            return "Food"
    
    for keyword in shopping_keywords:
        if keyword in text:
            return "Shopping"
    
    for keyword in electricity_keywords:
        if keyword in text:
            return "Electricity"
    
    for keyword in gas_keywords:
        if keyword in text:
            return "Gas"
    
    for keyword in water_keywords:
        if keyword in text:
            return "Water"
    
    for keyword in home_keywords:
        if keyword in text:
            return "Home"
    
    # No match found - return None to skip this transaction
    # This prevents person-to-person transfers and unknown transactions from being counted
    return None


def parse_indian_bank_amount(amount_str: str) -> float:
    """
    Parse amount string from Indian bank statements.
    Handles formats like:
    - "1,234.56"
    - "Rs. 1,234.56"
    - "₹1,234.56"
    - "INR 1,234.56"
    - "1234.56 Dr" (Debit)
    - "1234.56 Cr" (Credit - return negative)
    """
    if not amount_str:
        return 0.0
    
    # Convert to string if not already
    amount_str = str(amount_str).strip()
    
    # Check if credit (negative)
    is_credit = False
    if amount_str.lower().endswith('cr') or amount_str.lower().endswith('credit'):
        is_credit = True
    
    # Remove currency symbols and text
    for pattern in ['₹', 'rs.', 'rs', 'inr', 'dr', 'cr', 'debit', 'credit', ',']:
        amount_str = amount_str.lower().replace(pattern.lower(), '')
    
    # Extract numeric value
    try:
        amount = float(amount_str.strip())
        return -amount if is_credit else amount
    except ValueError:
        return 0.0
