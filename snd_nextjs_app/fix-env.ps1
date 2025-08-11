# Fix .env file script
$envContent = @"
DATABASE_URL=postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000
DIRECT_URL=postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db
GOOGLE_CLIENT_ID=241936842587-t28a4noogtteh97746j021efe6hd1jvn.apps.googleusercontent.com
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
Write-Host ".env file has been fixed successfully!"
