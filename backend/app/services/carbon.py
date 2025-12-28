"""
Carbon calculation and transaction categorization service.
Handles all carbon emission calculations and transaction classification.
"""

import re
import os
from typing import Optional
import logging

from app.constants import (
    CARBON_FACTORS,
    MERCHANT_FACTORS,
    CATEGORY_KEYWORDS,
    IGNORE_KEYWORDS,
    CATEGORIES,
    Category,
)

logger = logging.getLogger(__name__)

# =============================================================================
# ML Model Loading (lazy initialization)
# =============================================================================

_ml_model = None
_model_loaded = False


def _load_ml_model():
    """Load the ML model for transaction categorization (lazy loading)."""
    global _ml_model, _model_loaded
    
    if _model_loaded:
        return _ml_model
    
    _model_loaded = True
    
    # Try multiple paths for the model file
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "transaction_classifier.pkl"),
        os.path.join(os.path.dirname(__file__), "..", "transaction_classifier.pkl"),
        os.path.join(os.path.dirname(__file__), "..", "..", "transaction_classifier.pkl"),
        "transaction_classifier.pkl",
    ]
    
    try:
        import joblib
        
        for path in possible_paths:
            if os.path.exists(path):
                _ml_model = joblib.load(path)
                logger.info(f"✓ ML categorization model loaded from {path}")
                return _ml_model
        
        logger.warning("ML model file (transaction_classifier.pkl) not found. Using rule-based only.")
        
    except ImportError:
        logger.warning("joblib not installed. ML categorization disabled. Install with: pip install joblib")
    except Exception as e:
        logger.warning(f"Failed to load ML model: {e}")
    
    return None


def predict_category_ml(text: str) -> Optional[Category]:
    """
    Use ML model to predict transaction category.
    
    Args:
        text: Transaction name/description
    
    Returns:
        Predicted category, or None if prediction fails or is invalid
    """
    model = _load_ml_model()
    
    if model is None:
        return None
    
    try:
        prediction = model.predict([text.lower()])[0]
        
        # Validate prediction is a valid category
        if prediction in CATEGORIES:
            return prediction
        
        # Try to map common variations
        prediction_lower = str(prediction).lower()
        for cat in CATEGORIES:
            if cat.lower() == prediction_lower:
                return cat
        
        logger.debug(f"ML prediction '{prediction}' not in valid categories")
        return None
        
    except Exception as e:
        logger.debug(f"ML prediction failed for '{text}': {e}")
        return None


def calculate_carbon(amount: float, category: str, merchant_name: str = "") -> float:
    """
    Calculate carbon emissions for a transaction.
    
    Args:
        amount: Transaction amount in INR
        category: Category of the transaction
        merchant_name: Name of the merchant (for more accurate calculation)
    
    Returns:
        Estimated CO2 emissions in kg
    """
    if amount <= 0:
        return 0.0
    
    merchant_lower = merchant_name.lower()
    
    # Try merchant-specific factor first
    for merchant_key, factor in MERCHANT_FACTORS.items():
        if merchant_key in merchant_lower:
            return round(amount * factor, 2)
    
    # Fall back to category-based calculation
    factor = CARBON_FACTORS.get(category, 0.0015)
    return round(amount * factor, 2)


def categorize_transaction(merchant_name: str, description: str = "") -> Optional[Category]:
    """
    Categorize a transaction based on merchant name and description.
    Uses rule-based matching first, then falls back to ML model.
    
    Args:
        merchant_name: Name of the merchant
        description: Transaction description
    
    Returns:
        Category string, or None if transaction should be ignored
    """
    text = f"{merchant_name} {description}".lower()
    
    # Check if this should be ignored (P2P transfers, banking ops, etc.)
    for keyword in IGNORE_KEYWORDS:
        if keyword in text:
            return None
    
    # Check each category's keywords (rule-based)
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                return category
    
    # Fallback to ML model if rule-based didn't match
    ml_prediction = predict_category_ml(text)
    if ml_prediction:
        logger.debug(f"ML categorized '{merchant_name}' as '{ml_prediction}'")
        return ml_prediction
    
    return None


def clean_transaction_name(raw_name: str) -> str:
    """
    Clean up transaction names for readability.
    Removes UPI prefixes, bank suffixes, and normalizes formatting.
    
    Args:
        raw_name: Raw transaction name from bank statement
    
    Returns:
        Cleaned, human-readable transaction name
    """
    name = raw_name.strip()
    
    # Remove UPI prefix
    name = re.sub(r'^UPI[-/]', '', name, flags=re.IGNORECASE)
    
    # Remove @handle patterns
    if '@' in name:
        name = name.split('@')[0]
    
    # Remove bank/payment platform suffixes
    bank_patterns = r'[.\-_]?(PAYU|PAYTM|RAZORPAY|PHONEPE|GPAY|BHIM|YESBANK|HDFCBANK|ICICI|SBI|AXIS)$'
    name = re.sub(bank_patterns, '', name, flags=re.IGNORECASE)
    
    # Split into parts and clean
    parts = re.split(r'[-_.\s]+', name)
    parts = [p for p in parts if p and not p.isdigit()]
    
    # Remove consecutive duplicates
    cleaned_parts = []
    for part in parts:
        if not cleaned_parts or part.lower() != cleaned_parts[-1].lower():
            cleaned_parts.append(part)
    
    if cleaned_parts:
        name = ' '.join(cleaned_parts).title()
    else:
        name = raw_name.strip()
    
    # Truncate if too long
    if len(name) > 50:
        name = name[:50].rsplit(' ', 1)[0]
    
    return name
