# Pre-Deployment Checklist

Before deploying to Vercel, verify these items:

## ✅ Code Changes (Already Done)
- [x] Package versions locked (no "latest" strings)
- [x] Environment variable names consistent (using ANON_KEY everywhere)
- [x] Middleware file properly named (middleware.ts)
- [x] Next.js config includes env var setup

## 📋 Vercel Configuration (YOU NEED TO DO)

### Environment Variables
Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these for **Production, Preview, and Development**:

```
NEXT_PUBLIC_SUPABASE_URL = [your_supabase_url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your_supabase_anon_key]
```

**How to get these values:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Click the **Settings** gear icon
4. Go to **API** section
5. Copy the values:
   - **URL** field → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** field → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Auth Configuration
Go to: **Supabase Dashboard → Authentication → URL Configuration**

1. **Site URL**: Set to your Vercel domain
   ```
   https://your-app-name.vercel.app
   ```

2. **Redirect URLs**: Add these (replace with your domain):
   ```
   https://your-app-name.vercel.app/auth/callback
   https://your-app-name.vercel.app/auth/confirm
   https://your-app-name.vercel.app/*
   http://localhost:3000/* (for local development)
   ```

## 🚀 Deploy Steps

1. **Commit and push** these changes:
   ```bash
   git add .
   git commit -m "Fix production deployment configuration"
   git push origin main
   ```

2. **Add environment variables** in Vercel (see above)

3. **Redeploy** from Vercel dashboard:
   - Go to Deployments tab
   - Click ⋯ on latest deployment
   - Click "Redeploy"

4. **Test** your production site:
   - Visit your Vercel URL
   - Try to sign up
   - Try to log in
   - Create a group
   - Create a bet

## 🐛 If Something Goes Wrong

### Check these in order:

1. **Vercel Environment Variables**
   - Are they set for all environments?
   - Are the names spelled correctly?
   - Are the values correct (no extra spaces)?

2. **Vercel Function Logs**
   - Go to Deployment → Function Logs
   - Look for error messages
   - Common error: "Missing Supabase environment variables"

3. **Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Common error: CORS or "Failed to fetch"

4. **Supabase Settings**
   - Verify Site URL matches your Vercel domain
   - Verify Redirect URLs include your domain
   - Check if your Supabase project is active (not paused)

## 📞 Get Help

If you're still stuck:
1. Copy the error message from Vercel logs or browser console
2. Check if it matches any error in DEPLOYMENT-FIXES.md
3. Create a GitHub issue with the error details

## ✨ Success Indicators

Your deployment is working if:
- ✅ You can visit your Vercel URL without errors
- ✅ The login page loads
- ✅ You can sign up and receive verification email
- ✅ You can log in after verifying
- ✅ You can create groups and bets

---

**Quick Test Command (local):**
```bash
npm run build && npm start
```
If this works locally, your code is good. Any production issues are likely environment variables or Supabase configuration.

