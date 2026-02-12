#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this after: vercel login && vercel link

echo "🚀 Adding environment variables to Vercel..."

# Supabase
echo "https://gwuoczfapluglshultqd.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "sb_publishable_e_qwvGgSzgPYnnBn4PxyGw_4BiBf5c-" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "sb_secret_n4lhm9i9_pF40grIxYaKGA_bO_DEc_k" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# QPay
echo "aylay_mn_admin" | vercel env add QPAY_USERNAME production
echo "Me89897803$" | vercel env add QPAY_PASSWORD production
echo "AYLAY_MN_INVOICE" | vercel env add QPAY_INVOICE_CODE production
echo "https://merchant.qpay.mn/v2" | vercel env add QPAY_API_URL production

# Session & App
echo "aylay_bookstore_session_secret_key_min_32_characters_long_2024" | vercel env add SESSION_SECRET production
echo "https://pray-back.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production
echo "false" | vercel env add NEXT_PUBLIC_QPAY_MOCK_MODE production

echo "✅ Done! Now run: vercel --prod"
