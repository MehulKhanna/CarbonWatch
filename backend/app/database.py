from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings


# MongoDB client
client: AsyncIOMotorClient = None


async def init_db():
    """Initialize MongoDB connection and Beanie ODM."""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    # Import models here to avoid circular imports
    from app.models.user import User
    from app.models.transaction import Transaction
    
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Transaction],
    )


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
