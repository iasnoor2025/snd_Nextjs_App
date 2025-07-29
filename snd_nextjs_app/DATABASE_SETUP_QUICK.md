# Quick Database Setup for Profile Page

## 🚀 Quick Start (5 minutes)

### 1. Install PostgreSQL
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE snd_rental_db;

# Exit
\q
```

### 3. Create Environment File
Create `.env` file in the project root:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/snd_nextjs_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 4. Setup Database
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with initial data
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```

## 🔧 Troubleshooting

### Database Connection Issues
- Check if PostgreSQL is running
- Verify connection string in `.env`
- Ensure database exists

### Common Commands
```bash
# Check database connection
npx prisma db pull

# Open database GUI
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 📊 Current Status
- ✅ Profile page works with demo data
- ⏳ Database setup required for real data
- 🔄 API endpoints ready for database integration

## 🎯 Next Steps
1. Set up PostgreSQL
2. Configure `.env` file
3. Run database migrations
4. Test profile functionality 
