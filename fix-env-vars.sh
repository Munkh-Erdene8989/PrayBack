#!/bin/bash

# Remove old variables with newlines
echo "Removing old environment variables..."
vercel env rm CALLPRO_API_URL production --yes 2>/dev/null || true
vercel env rm CALLPRO_API_KEY production --yes 2>/dev/null || true
vercel env rm CALLPRO_SENDER_NAME production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_APP_URL production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null || true
vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes 2>/dev/null || true
vercel env rm QPAY_RECEIVER_CODE production --yes 2>/dev/null || true

echo ""
echo "Adding corrected environment variables..."

# Add corrected variables (without newlines)
printf "https://api.messagepro.mn/send" | vercel env add CALLPRO_API_URL production --force
printf "fe5c72c75ea0825476eca7172c8f5854" | vercel env add CALLPRO_API_KEY production --force
printf "72720880" | vercel env add CALLPRO_SENDER_NAME production --force
printf "https://pray-back.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production --force
printf "https://gwuoczfapluglshultqd.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
printf "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dW9jemZhcGx1Z2xzaHVsdHFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM1NjkwNiwiZXhwIjoyMDg1OTMyOTA2fQ.TY7vtDzKjHwp167mm58yikzCQMWvw6ieMB5lrcHcrxo" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force
printf "terminal" | vercel env add QPAY_RECEIVER_CODE production --force

echo ""
echo "Environment variables updated successfully!"
