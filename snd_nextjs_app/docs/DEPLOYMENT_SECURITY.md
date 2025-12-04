# Deployment Security Guide

## Docker Security Best Practices

This guide explains how to securely deploy the application using Docker and Coolify without exposing secrets in the Dockerfile.

## ⚠️ Important: Secrets Management

**NEVER** include secrets in:
- Dockerfile ARG or ENV instructions
- Committed `.env` files
- Source code
- Docker image layers

## Setting Secrets in Coolify

All secrets must be configured as **runtime environment variables** in Coolify's UI:

### Required Secrets

Configure these in Coolify → Your Application → Environment Variables:

#### Authentication
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your application URL (e.g., `https://your-app.com`)

#### Database
- `DATABASE_URL` - PostgreSQL connection string

#### AWS/S3 (MinIO)
- `AWS_ACCESS_KEY_ID` - S3/MinIO access key
- `AWS_SECRET_ACCESS_KEY` - S3/MinIO secret key
- `AWS_REGION` - Region (e.g., `us-east-1`)
- `S3_ENDPOINT` - MinIO endpoint URL
- `S3_BUCKET_NAME` - Bucket name

#### Email (Gmail)
- `GMAIL_USER` - Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password (16 characters)
- `FROM_EMAIL` - Sender email address

#### Google Apps Script
- `GAS_SHARED_SECRET` - Shared secret for Google Apps Script webhook authentication

#### Cron Jobs
- `CRON_SECRET` - Secret for cron job authentication

#### Google OAuth (if used)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

#### n8n Integration
- `N8N_API_KEY` - API key for n8n webhook authentication

#### Application
- `APP_URL` - Application base URL
- `NODE_ENV` - Set to `production`

### Public Environment Variables (Safe to expose)

These can be set in Dockerfile or nixpacks.toml as they're not sensitive:

- `NEXT_PUBLIC_ERPNEXT_URL` - ERPNext API URL (public)
- `NEXT_PUBLIC_ERPNEXT_API_KEY` - ERPNext API key (public, read-only)
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry
- `NODE_OPTIONS` - Node.js options

## Dockerfile Security

The provided `Dockerfile` follows security best practices:

1. ✅ **No secrets in ARG/ENV** - Only non-sensitive build-time variables
2. ✅ **Multi-stage build** - Reduces final image size
3. ✅ **Non-root user** - Runs as `nextjs` user (UID 1001)
4. ✅ **Minimal base image** - Uses `node:20-alpine`
5. ✅ **Proper permissions** - Files owned by non-root user

## Verifying Security

After deployment, verify secrets are not exposed:

```bash
# Check Docker image layers (should not contain secrets)
docker history <image-name>

# Check environment variables at runtime
docker exec <container-name> env | grep -E "(SECRET|PASSWORD|KEY)"

# Scan for secrets in image
docker scout cves <image-name>
```

## Troubleshooting

### Docker Security Warnings

If you see warnings about secrets in ARG/ENV:

1. **Check Dockerfile** - Ensure no secrets are in ARG or ENV instructions
2. **Check Coolify** - Verify secrets are set as environment variables, not build args
3. **Check nixpacks.toml** - Ensure it doesn't reference secrets

### Missing Environment Variables

If the application fails to start:

1. Check Coolify logs for missing environment variables
2. Verify all required secrets are set in Coolify UI
3. Check that variable names match exactly (case-sensitive)

## Migration from Insecure Configuration

If you previously had secrets in Dockerfile:

1. **Remove secrets from Dockerfile** - Already done ✅
2. **Set secrets in Coolify** - Add all secrets as environment variables
3. **Rebuild and redeploy** - Coolify will use the secure Dockerfile
4. **Verify** - Check that warnings are gone

## Additional Security Recommendations

1. **Rotate secrets regularly** - Update secrets every 90 days
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Limit access** - Only grant Coolify access to necessary team members
4. **Monitor logs** - Watch for unauthorized access attempts
5. **Use HTTPS** - Always use HTTPS in production
6. **Keep dependencies updated** - Regularly run `npm audit fix`

## References

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

