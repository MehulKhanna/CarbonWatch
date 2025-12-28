from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from beanie import PydanticObjectId
from typing import Optional
from datetime import datetime
import pandas as pd
import io

from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionsListResponse,
    ImportResponse,
)
from app.utils.auth import get_current_user
from app.services.carbon_calculator import calculate_carbon, categorize_transaction, clean_transaction_name


router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=TransactionsListResponse)
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Get paginated list of user's transactions."""
    # Build query
    query = {"user_id": current_user.id}
    
    if category:
        query["category"] = category
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    # Get total count
    total = await Transaction.find(query).count()
    
    # Get total emissions using Motor collection directly
    collection = Transaction.get_pymongo_collection()
    pipeline = [
        {"$match": query},
        {"$group": {"_id": None, "total_carbon": {"$sum": "$carbon"}}}
    ]
    cursor = collection.aggregate(pipeline)
    agg_result = await cursor.to_list(length=None)
    total_emissions = agg_result[0]["total_carbon"] if agg_result else 0
    
    # Get paginated transactions
    transactions = await Transaction.find(query).sort(-Transaction.date).skip((page - 1) * page_size).limit(page_size).to_list()
    
    return TransactionsListResponse(
        transactions=[TransactionResponse.from_transaction(t) for t in transactions],
        total=total,
        page=page,
        page_size=page_size,
        total_emissions=round(total_emissions, 2),
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new transaction."""
    # Calculate carbon if not provided
    carbon = data.carbon
    if carbon is None:
        carbon = calculate_carbon(data.amount, data.category, data.name)
    
    transaction = Transaction(
        user_id=current_user.id,
        name=data.name,
        category=data.category,
        date=data.date,
        amount=data.amount,
        carbon=carbon,
        description=data.description,
        source="manual",
    )
    
    await transaction.insert()
    
    return TransactionResponse.from_transaction(transaction)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a specific transaction."""
    try:
        transaction = await Transaction.find_one(
            Transaction.id == PydanticObjectId(transaction_id),
            Transaction.user_id == current_user.id,
        )
    except Exception:
        transaction = None
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    
    return TransactionResponse.from_transaction(transaction)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a transaction."""
    try:
        transaction = await Transaction.find_one(
            Transaction.id == PydanticObjectId(transaction_id),
            Transaction.user_id == current_user.id,
        )
    except Exception:
        transaction = None
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    # Recalculate carbon if amount or category changed
    if "amount" in update_data or "category" in update_data:
        if data.carbon is None:
            transaction.carbon = calculate_carbon(
                transaction.amount, transaction.category, transaction.name
            )
    
    transaction.updated_at = datetime.utcnow()
    await transaction.save()
    
    return TransactionResponse.from_transaction(transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a transaction."""
    try:
        transaction = await Transaction.find_one(
            Transaction.id == PydanticObjectId(transaction_id),
            Transaction.user_id == current_user.id,
        )
    except Exception:
        transaction = None
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    
    await transaction.delete()


@router.post("/import", response_model=ImportResponse)
async def import_transactions(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Import transactions from a CSV or Excel file.
    
    Expected columns (flexible matching):
    - Date: date, transaction_date, trans_date, posted_date
    - Description/Name: description, name, merchant, payee, memo
    - Amount: amount, debit, credit, transaction_amount
    - Category (optional): category, type
    """
    # Validate file type
    filename = file.filename.lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV or Excel format",
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse file - first try to auto-detect header row
        # Many bank statements have header info in the first few rows
        header_row = 0
        
        # Known header patterns to look for
        header_patterns = ["date", "transaction", "narration", "description", "amount", "debit", "credit", "withdrawal"]
        
        if filename.endswith(".csv"):
            # First, read without header to find the actual header row
            df_raw = pd.read_csv(io.BytesIO(content), header=None, nrows=50)
            
            for idx, row in df_raw.iterrows():
                row_str = " ".join(str(v).lower() for v in row.values if pd.notna(v))
                # Check if this row contains column headers
                matches = sum(1 for pattern in header_patterns if pattern in row_str)
                if matches >= 2:  # Found at least 2 header patterns
                    header_row = idx
                    break
            
            # Re-read with correct header
            df = pd.read_csv(io.BytesIO(content), header=header_row)
        else:
            # Same logic for Excel files
            df_raw = pd.read_excel(io.BytesIO(content), header=None, nrows=50)
            
            for idx, row in df_raw.iterrows():
                row_str = " ".join(str(v).lower() for v in row.values if pd.notna(v))
                matches = sum(1 for pattern in header_patterns if pattern in row_str)
                if matches >= 2:
                    header_row = idx
                    break
            
            df = pd.read_excel(io.BytesIO(content), header=header_row)
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(" ", "_").str.replace(".", "")
        
        # Map columns - expanded to support Indian bank formats
        date_columns = ["date", "transaction_date", "trans_date", "posted_date", "posting_date", "value_dt", "txn_date"]
        name_columns = ["description", "name", "merchant", "payee", "memo", "transaction_description", "narration", "particulars", "remarks"]
        amount_columns = ["amount", "debit", "credit", "transaction_amount", "value"]
        withdrawal_columns = ["withdrawal_amt", "withdrawal", "debit_amt", "debit", "dr_amount", "dr"]
        deposit_columns = ["deposit_amt", "deposit", "credit_amt", "credit", "cr_amount", "cr"]
        category_columns = ["category", "type", "transaction_type"]
        
        # Find matching columns
        date_col = next((c for c in date_columns if c in df.columns), None)
        name_col = next((c for c in name_columns if c in df.columns), None)
        amount_col = next((c for c in amount_columns if c in df.columns), None)
        withdrawal_col = next((c for c in withdrawal_columns if c in df.columns), None)
        deposit_col = next((c for c in deposit_columns if c in df.columns), None)
        category_col = next((c for c in category_columns if c in df.columns), None)
        
        # If we have withdrawal/deposit columns but no single amount column, we'll use them
        has_separate_amounts = withdrawal_col or deposit_col
        
        if not date_col or not name_col or (not amount_col and not has_separate_amounts):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not find required columns. Found: {list(df.columns)}. Need: date, description/name, amount",
            )
        
        imported_count = 0
        skipped_count = 0
        total_carbon = 0
        transactions_to_insert = []
        
        for _, row in df.iterrows():
            try:
                # Parse date
                date_value = row[date_col]
                if pd.isna(date_value):
                    skipped_count += 1
                    continue
                
                if isinstance(date_value, str):
                    # Try multiple date formats (including Indian format DD/MM/YYYY)
                    for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%d-%m-%Y", "%d/%m/%y"]:
                        try:
                            date_value = datetime.strptime(date_value.strip(), fmt)
                            break
                        except ValueError:
                            continue
                    else:
                        skipped_count += 1
                        continue
                elif hasattr(date_value, "to_pydatetime"):
                    date_value = date_value.to_pydatetime()
                
                # Parse name
                name = str(row[name_col]).strip()
                if not name or name.lower() == "nan":
                    skipped_count += 1
                    continue
                
                # Parse amount - handle single amount column OR separate withdrawal/deposit columns
                amount = 0
                
                if amount_col and not pd.isna(row.get(amount_col)):
                    # Single amount column
                    amount = row[amount_col]
                elif has_separate_amounts:
                    # Separate withdrawal/deposit columns (like HDFC format)
                    withdrawal = 0
                    deposit = 0
                    
                    if withdrawal_col and not pd.isna(row.get(withdrawal_col)):
                        w_val = row[withdrawal_col]
                        if isinstance(w_val, str):
                            w_val = w_val.replace(",", "").replace("₹", "").strip()
                            if w_val:
                                withdrawal = float(w_val)
                        else:
                            withdrawal = float(w_val) if w_val else 0
                    
                    if deposit_col and not pd.isna(row.get(deposit_col)):
                        d_val = row[deposit_col]
                        if isinstance(d_val, str):
                            d_val = d_val.replace(",", "").replace("₹", "").strip()
                            if d_val:
                                deposit = float(d_val)
                        else:
                            deposit = float(d_val) if d_val else 0
                    
                    # Use withdrawal (expense) for carbon calculation, or deposit if no withdrawal
                    amount = withdrawal if withdrawal > 0 else deposit
                else:
                    skipped_count += 1
                    continue
                
                # Handle string amounts
                if isinstance(amount, str):
                    amount = float(amount.replace("$", "").replace(",", "").replace("₹", "").strip())
                amount = abs(float(amount)) if amount else 0
                
                if amount <= 0:
                    skipped_count += 1
                    continue
                
                # Determine category
                if category_col and not pd.isna(row[category_col]):
                    category = str(row[category_col]).strip()
                    # Normalize to our categories
                    if category not in ["Travel", "Food", "Shopping", "Electricity", "Gas", "Water", "Home"]:
                        category = categorize_transaction(name)
                else:
                    category = categorize_transaction(name)
                
                # Skip transactions that don't match any category (e.g., P2P transfers)
                if category is None:
                    skipped_count += 1
                    continue
                
                # Clean up the transaction name for readability
                clean_name = clean_transaction_name(name)
                
                # Calculate carbon
                carbon = calculate_carbon(amount, category, name)  # Use original name for matching
                
                # Create transaction
                transaction = Transaction(
                    user_id=current_user.id,
                    name=clean_name[:255],  # Use cleaned name
                    category=category,
                    date=date_value,
                    amount=amount,
                    carbon=carbon,
                    source="import",
                )
                
                transactions_to_insert.append(transaction)
                imported_count += 1
                total_carbon += carbon
                
            except Exception:
                skipped_count += 1
                continue
        
        # Bulk insert
        if transactions_to_insert:
            await Transaction.insert_many(transactions_to_insert)
        
        return ImportResponse(
            success=True,
            imported_count=imported_count,
            skipped_count=skipped_count,
            total_carbon=round(total_carbon, 2),
            message=f"Successfully imported {imported_count} transactions with {round(total_carbon, 2)} kg CO₂",
        )
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}",
        )
