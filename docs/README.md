# BetOnEm Documentation

This folder contains all project documentation, implementation guides, and troubleshooting resources.

## 📚 Table of Contents

### Authentication & User Flow
- **[AUTH_FLOW_VALIDATION.md](AUTH_FLOW_VALIDATION.md)** - Complete authentication flow validation and testing
  - Signup → Email Verification → Profile Setup → Home
  - All auth pages connected to Supabase
  - Protected route configuration
  
- **[EMAIL_VERIFICATION_FIX.md](EMAIL_VERIFICATION_FIX.md)** - Email verification troubleshooting
  - How email verification works with Supabase
  - Proxy configuration for token processing
  - Common issues and solutions
  
- **[PROFILE_REDIRECT_FIX.md](PROFILE_REDIRECT_FIX.md)** - Profile creation redirect fix
  - Why hard reload is needed after profile creation
  - Next.js caching behavior explained

### Features & Implementation
- **[EARNINGS_PAGE_README.md](EARNINGS_PAGE_README.md)** - Earnings page documentation
  - Complete earnings/settlements feature overview
  - UI/UX design decisions
  - Data flow and calculations
  
- **[EARNINGS_VISUAL_GUIDE.md](EARNINGS_VISUAL_GUIDE.md)** - Visual design guide for earnings
  - Layout specifications
  - Component breakdown
  - Color scheme and styling
  
- **[EARNINGS_IMPLEMENTATION_SUMMARY.md](EARNINGS_IMPLEMENTATION_SUMMARY.md)** - Implementation details
  - Code structure
  - Component architecture
  - Database queries
  
- **[EARNINGS_GROUP_NAME_PROMINENCE.md](EARNINGS_GROUP_NAME_PROMINENCE.md)** - Group name prominence
  - Design decisions for displaying group names
  - Visual hierarchy
  
- **[EARNINGS_COMPLETE.md](EARNINGS_COMPLETE.md)** - Earnings completion checklist
  - All implemented features
  - Testing checklist

### UI & Design
- **[LANDING_PAGE_README.md](LANDING_PAGE_README.md)** - Landing page design guide
  - Visual design language
  - Component structure
  - Animation and interactions

### Server & API
- **[SERVER_README.md](SERVER_README.md)** - PayPal server documentation
  - Express server setup
  - PayPal integration
  - Webhook handling
  
- **[API_REFERENCE.md](API_REFERENCE.md)** - Server API reference
  - All endpoints documented
  - Request/response examples
  - Error handling
  
- **[QUICK_TEST.md](QUICK_TEST.md)** - Quick testing guide for server
  - How to test PayPal integration
  - Testing payouts locally
  
- **[TEST_PLAN.md](TEST_PLAN.md)** - Comprehensive test plan
  - All features to test
  - Test scenarios

### Deployment & Fixes
- **[DEPLOYMENT-FIXES.md](DEPLOYMENT-FIXES.md)** - Common deployment issues
  - Vercel deployment troubleshooting
  - Environment variable issues
  - Build errors and solutions
  
- **[NEXTJS-PARAMS-FIX.md](NEXTJS-PARAMS-FIX.md)** - Next.js params handling
  - How to handle dynamic params in Next.js 15
  - Async params pattern

### Project Management
- **[CHECKLIST.md](CHECKLIST.md)** - Project implementation checklist
  - All features and their status
  - What's done, what's in progress
  - Future enhancements

---

## 🔍 Quick Reference

### Just Getting Started?
1. Read main [README.md](../README.md) for setup
2. Check [AUTH_FLOW_VALIDATION.md](AUTH_FLOW_VALIDATION.md) for auth setup
3. Review [EMAIL_VERIFICATION_FIX.md](EMAIL_VERIFICATION_FIX.md) for email config

### Deployment Issues?
1. [DEPLOYMENT-FIXES.md](DEPLOYMENT-FIXES.md) - Start here
2. [AUTH_FLOW_VALIDATION.md](AUTH_FLOW_VALIDATION.md) - Auth troubleshooting
3. [SERVER_README.md](SERVER_README.md) - PayPal server issues

### Understanding Features?
1. [EARNINGS_PAGE_README.md](EARNINGS_PAGE_README.md) - Earnings/settlements
2. [LANDING_PAGE_README.md](LANDING_PAGE_README.md) - Landing page
3. [API_REFERENCE.md](API_REFERENCE.md) - Server endpoints

### Testing?
1. [TEST_PLAN.md](TEST_PLAN.md) - Comprehensive test plan
2. [QUICK_TEST.md](QUICK_TEST.md) - Quick server tests
3. [CHECKLIST.md](CHECKLIST.md) - Feature checklist

---

## 📝 Document Updates

All documentation is kept in sync with code changes. If you make significant changes to features, please update the relevant documentation files.

### Adding New Documentation
- Place new docs in this `/docs` folder
- Update this README with a description
- Link to it from the main README if needed

---

**Last Updated**: January 2026

