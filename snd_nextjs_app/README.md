# SND Next.js Application

A comprehensive employee management system built with Next.js, Prisma, and PostgreSQL.

## 🚀 Quick Start

### 1. Setup Environment Variables

```bash
# Run the setup script to create .env.local
npm run setup

# Edit .env.local and set your DATABASE_URL
# Example: DATABASE_URL="postgresql://username:password@localhost:5432/snd_nextjs_db"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed with initial data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Configuration (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/snd_nextjs_db"

# Next.js Configuration
NEXT_PUBLIC_API_URL="/api"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Development
NODE_ENV="development"
```

## 🐛 Troubleshooting

### API Error: 500 Internal Server Error

If you're getting 500 errors when loading employees:

1. **Check Database Connection**
   ```bash
   # Test database connection
   npm run db:studio
   ```

2. **Verify Environment Variables**
   - Ensure `.env.local` exists and has `DATABASE_URL`
   - Check that PostgreSQL is running
   - Verify database credentials

3. **Reset Database**
   ```bash
   # Reset and recreate database
   npm run db:reset
   ```

4. **Check Logs**
   - Look at browser console for detailed error messages
   - Check terminal for server-side errors

### Common Issues

- **"DATABASE_URL not set"**: Run `npm run setup` and configure your database URL
- **"Database connection failed"**: Ensure PostgreSQL is running and accessible
- **"Authentication failed"**: Check your database username and password
- **"Database not found"**: Create the database: `CREATE DATABASE snd_nextjs_db;`

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── dashboard/      # Dashboard pages
│   └── modules/        # Feature modules
├── components/         # Reusable components
├── lib/               # Utilities and configurations
└── locales/           # Internationalization
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run setup` - Setup environment variables
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

## 📚 Documentation

- [Database Setup Guide](./DATABASE_SETUP_QUICK.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [API Documentation](./docs/api-documentation.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
