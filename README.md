# BetOnEm 🎯

A mobile-first web app where friends create private groups and bet on real-life events with play money.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

#### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)

#### Run Database Setup
1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `complete-database-setup.sql`
4. Paste and run it (this creates everything you need)

#### Get Your Credentials
1. Go to **Project Settings** → **API**
2. Copy your **Project URL** and **anon key**

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the App
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Features

✅ **Email Verification** - Secure signup with email confirmation  
✅ **Authentication** - Email/password login  
✅ **Private Groups** - Create groups with friends using invite codes  
✅ **Prediction Markets** - Create bets on real-life events  
✅ **Parimutuel Betting** - Dynamic odds based on pool distribution  
✅ **Real-time Updates** - Live odds updates via Supabase Realtime  
✅ **Play Money** - Start with 1000 coins per group  
✅ **Mobile-First** - Optimized for mobile devices  

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 19
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email/Password)
- **Realtime**: Supabase Realtime
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Deployment**: Vercel

## Project Structure

```
app/
  (authenticated)/          # Protected routes
    home/                   # Groups list
    groups/[id]/           # Group detail & bets
    earnings/              # Bet history & stats
    profile/               # User profile
  signup/                  # Sign up page
  login/                   # Login page

components/
  auth/                    # Auth components
  groups/                  # Group management
  markets/                 # Betting components
  layout/                  # Navigation & layout
  ui/                      # shadcn/ui components

lib/
  actions/                 # Server actions
  supabase/                # Supabase clients
  stores/                  # Zustand stores
  utils/                   # Utilities & calculations
```

## How It Works

### 1. Create or Join a Group
- Create a group and get a 6-character invite code
- Share the code with friends
- Everyone starts with 1000 coins

### 2. Create a Bet
- Ask a yes/no question (e.g., "Will it rain tomorrow?")
- Set a betting deadline and resolution date
- Friends can bet YES or NO

### 3. Place Bets
- Choose YES or NO
- Enter your bet amount
- Odds update in real-time based on the pool

### 4. Resolution
- After the betting deadline, the creator resolves the bet
- Winners split the entire pool proportionally
- Balances update automatically

## Parimutuel Betting Math

The app uses parimutuel betting (like horse racing):

```
Total Pool = YES pool + NO pool
Your Payout = (Your Bet / Winning Pool) × Total Pool
Your Profit = Payout - Your Bet
```

Example:
- You bet 100 on YES
- YES pool: 300, NO pool: 200 (total: 500)
- YES wins → You get: (100/300) × 500 = 167 coins
- Your profit: 67 coins

## Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your production domain

### Update Supabase
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain
3. Add domain to **Redirect URLs**

## Troubleshooting

### Issue: RLS errors (infinite recursion, policy violations, etc.)
**This is the most common issue!** If your database already has tables but RLS is broken:
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `fix-all-rls-policies.sql`
3. Paste and run it
4. This will recreate all RLS policies with simpler, less restrictive rules

**If you're starting fresh**, use `complete-database-setup.sql` instead (see Setup section above).

### Issue: Can't create groups
If groups won't create or you get invite code errors:
1. Make sure you've run `fix-all-rls-policies.sql` (see above)
2. Check browser console (F12) for detailed error messages
3. The error logs will show exactly what's failing

### Issue: Can't sign up
1. Make sure you ran the database setup SQL file
2. Check your email for the verification link (including spam folder)
3. The verification link expires in 24 hours

### Issue: Email not arriving
1. Check your spam/junk folder
2. Make sure you entered the correct email address
3. Click "Resend Verification Email" on the verification screen
4. Check Supabase Auth settings: **Authentication** → **Email Templates**

### Issue: Environment variables not working
1. Make sure `.env.local` is in the project root
2. Variable names must be exact: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart the dev server after creating/editing `.env.local`

### Debugging Tips
- Check the browser console (F12) for detailed error messages
- Check the terminal where `npm run dev` is running for server-side errors
- Use the Supabase dashboard **Logs** section to see database query errors
- Server actions now have detailed logging - look for `[createGroup]`, `[createMarket]`, etc. in console

## Development

   ```bash
# Install dependencies
npm install

# Run development server
   npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Future Enhancements

- [ ] Evidence submission (photos/videos)
- [ ] Evidence voting for decentralized resolution
- [ ] Push notifications
- [ ] Dark mode
- [ ] PWA installation
- [ ] Advanced analytics
- [ ] Leaderboards

## License

MIT

## Support

For issues or questions, create an issue on GitHub.
