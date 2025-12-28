# Carbon Watch Backend

## Setup

1. Create a virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file (optional):

```env
SECRET_KEY=your-super-secret-key-change-this
DATABASE_URL=sqlite+aiosqlite:///./carbon_watch.db
DEBUG=true
```

4. Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

5. Access the API docs at: http://localhost:8000/docs

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout

### Dashboard

- `GET /api/dashboard` - Get dashboard statistics

### Transactions

- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create a transaction
- `GET /api/transactions/{id}` - Get a transaction
- `PATCH /api/transactions/{id}` - Update a transaction
- `DELETE /api/transactions/{id}` - Delete a transaction
- `POST /api/transactions/import` - Import transactions from CSV/Excel

### Insights

- `GET /api/insights` - Get personalized recommendations

### Progress

- `GET /api/progress` - Get achievements and trends
- `GET /api/progress/goals` - List goals
- `POST /api/progress/goals` - Create a goal
- `PATCH /api/progress/goals/{id}` - Update a goal
- `DELETE /api/progress/goals/{id}` - Delete a goal

## File Import Format

The import endpoint accepts CSV or Excel files with the following columns:

- `date` (required): Transaction date
- `description` or `name` (required): Merchant/transaction name
- `amount` (required): Transaction amount
- `category` (optional): Will be auto-detected if not provided
