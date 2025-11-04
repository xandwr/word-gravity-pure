# Supabase Edge Functions Setup Guide

This guide will help you set up and deploy the Supabase Edge Function for sending account deletion confirmation emails.

## Prerequisites

1. [Supabase CLI](https://supabase.com/docs/guides/cli) installed
2. A [Resend](https://resend.com) account (free tier available) for email sending
3. Your Supabase project set up

## Step 1: Install Supabase CLI

```bash
# Install via npm
npm install -g supabase

# Or via Homebrew (Mac)
brew install supabase/tap/supabase

# Or via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

## Step 3: Link Your Project

```bash
# Get your project ref from Supabase dashboard URL
# Example: https://app.supabase.com/project/YOUR_PROJECT_REF

supabase link --project-ref YOUR_PROJECT_REF
```

## Step 4: Set Up Resend for Email Sending

1. Go to [Resend](https://resend.com) and create a free account
2. Add and verify your domain (or use their test domain for development)
3. Create an API key in the Resend dashboard
4. Copy the API key (starts with `re_`)

## Step 5: Set Environment Variables (Secrets)

Set the Resend API key as a secret in your Supabase project:

```bash
# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Optionally set environment for development
supabase secrets set ENVIRONMENT=development
```

## Step 6: Update the Edge Function

Edit `supabase/functions/send-deletion-email/index.ts` and update the `from` email address:

```typescript
from: "Word Gravity <noreply@yourdomain.com>", // Change to your verified domain
```

## Step 7: Deploy the Edge Function

```bash
# Deploy the function
supabase functions deploy send-deletion-email

# Or deploy with environment variables inline
supabase functions deploy send-deletion-email --no-verify-jwt
```

## Step 8: Test the Function Locally (Optional)

Before deploying, you can test locally:

```bash
# Start Supabase locally (requires Docker)
supabase start

# Serve the function locally
supabase functions serve send-deletion-email --env-file ./supabase/.env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-deletion-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"test-id","email":"test@example.com","username":"testuser","deletionToken":"test-token","appUrl":"http://localhost:5173"}'
```

## Step 9: Verify Deployment

After deployment, your Edge Function will be available at:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-deletion-email
```

## Environment Variables Needed

Make sure these are set in Supabase:

| Variable | Description | How to Set |
|----------|-------------|------------|
| `RESEND_API_KEY` | Your Resend API key | `supabase secrets set RESEND_API_KEY=re_xxx` |
| `SUPABASE_URL` | Auto-set by Supabase | ✓ Already available |
| `SUPABASE_ANON_KEY` | Auto-set by Supabase | ✓ Already available |

## Troubleshooting

### Function not found
- Make sure you've deployed: `supabase functions deploy send-deletion-email`
- Check deployment logs: `supabase functions logs send-deletion-email`

### Email not sending
- Verify your Resend API key is correct
- Check you've verified your sending domain in Resend
- Look at function logs: `supabase functions logs send-deletion-email`

### Authorization errors
- Make sure the `Authorization` header is being passed from your app
- The Edge Function verifies the user is authenticated

## Local Development

For local development without deploying:

1. Create `supabase/.env.local`:
```bash
RESEND_API_KEY=re_your_api_key
ENVIRONMENT=development
```

2. Serve locally:
```bash
supabase functions serve send-deletion-email --env-file supabase/.env.local
```

3. Update your SvelteKit `.env` to point to local function:
```bash
# Add this temporarily for local testing
VITE_SUPABASE_URL=http://localhost:54321
```

## Monitoring

View function logs in real-time:

```bash
# Stream logs
supabase functions logs send-deletion-email --follow

# View recent logs
supabase functions logs send-deletion-email --limit 50
```

## Cost Considerations

- **Supabase Edge Functions**: Free tier includes 500,000 invocations/month
- **Resend**: Free tier includes 3,000 emails/month
- Both should be more than sufficient for most applications

## Alternative Email Providers

Instead of Resend, you can use:

### SendGrid
```typescript
const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${SENDGRID_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({...})
});
```

### Mailgun
```typescript
const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
  method: "POST",
  headers: {
    "Authorization": `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
  },
  body: formData
});
```

## Next Steps

After deployment:

1. Test the deletion flow in your app
2. Monitor the function logs
3. Set up proper error alerting if needed
4. Consider adding rate limiting for production

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)
- [Deno Documentation](https://deno.land/manual)
