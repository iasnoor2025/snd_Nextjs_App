# Environment Variables Setup

## Required Environment Variables

To use Supabase file uploads, you need to set up the following environment variables in your `.env.local` file:

### Supabase Configuration

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### How to Get These Values

1. **Go to [supabase.com](https://supabase.com)** and create a new project
2. **Navigate to Settings > API** in your project dashboard
3. **Copy the Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
4. **Copy the anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
5. **Copy the service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY`)

### Example .env.local File

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjQ5NjAwMCwiZXhwIjoxOTUyMDcyMDAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM2NDk2MDAwLCJleHAiOjE5NTIwNzIwMDB9.example

# Keep your existing S3/MinIO configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_ENDPOINT=your_s3_endpoint
S3_BUCKET_NAME=your_bucket_name
```

## After Setting Environment Variables

1. **Save the `.env.local` file** in your project root
2. **Restart your development server** (`npm run dev`)
3. **The Supabase upload components will now be enabled**

## Troubleshooting

### "Supabase Not Configured" Warning

If you see this warning on the demo page:
- Check that your `.env.local` file exists and has the correct values
- Ensure the variable names are exactly as shown (case-sensitive)
- Restart your development server after making changes

### Common Issues

1. **File not found**: Make sure `.env.local` is in your project root (same level as `package.json`)
2. **Values not loading**: Restart your development server after changes
3. **Wrong variable names**: Use exactly `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Security Notes

- **Never commit `.env.local` to version control**
- **The `NEXT_PUBLIC_` prefix makes variables available in the browser** (safe for public keys)
- **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** (only use server-side)
