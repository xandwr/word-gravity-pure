# Send Deletion Email Edge Function

This Supabase Edge Function sends account deletion confirmation emails via Resend.

## Purpose

When a user requests to delete their account, this function:
1. Verifies the user is authenticated
2. Generates a beautifully formatted HTML email
3. Sends the email with a confirmation link via Resend
4. Returns success/failure status

## Request Format

```typescript
POST /functions/v1/send-deletion-email

Headers:
  Authorization: Bearer <user_jwt_token>
  Content-Type: application/json

Body:
{
  "userId": "uuid",
  "email": "user@example.com",
  "username": "username",
  "deletionToken": "uuid",
  "appUrl": "https://yourdomain.com"
}
```

## Response Format

### Success
```json
{
  "success": true,
  "message": "Deletion confirmation email sent successfully",
  "emailId": "resend_email_id"
}
```

### Error
```json
{
  "error": "Error message"
}
```

## Environment Variables

Required:
- `RESEND_API_KEY` - Your Resend API key (set via Supabase secrets)

Auto-provided by Supabase:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

Optional:
- `ENVIRONMENT` - Set to "development" for dev mode features

## Local Testing

1. Create `supabase/.env.local`:
```bash
RESEND_API_KEY=re_your_test_key
ENVIRONMENT=development
```

2. Run locally:
```bash
supabase functions serve send-deletion-email --env-file supabase/.env.local
```

3. Test with curl:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-deletion-email' \
  --header 'Authorization: Bearer eyJhbGc...' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    "username": "testuser",
    "deletionToken": "abc-123-def",
    "appUrl": "http://localhost:5173"
  }'
```

## Deployment

```bash
# Deploy to production
supabase functions deploy send-deletion-email

# View logs
supabase functions logs send-deletion-email --follow
```

## Security

- ✅ Verifies user authentication via JWT
- ✅ Validates user ID matches authenticated user
- ✅ Uses HTTPS for all API calls
- ✅ API keys stored as Supabase secrets
- ✅ CORS headers configured

## Email Template

The function sends a beautiful HTML email with:
- Branded header with gradient
- Clear warning about permanent deletion
- Highlighted list of what will be deleted
- Prominent confirmation button
- 30-minute expiration notice
- Professional footer

## Rate Limiting

Consider adding rate limiting in production to prevent abuse:
- Supabase Edge Functions have built-in rate limiting
- Resend has rate limits based on your plan
- Consider tracking deletion requests in your database

## Monitoring

Monitor function performance:
```bash
# Real-time logs
supabase functions logs send-deletion-email --follow

# Recent logs
supabase functions logs send-deletion-email --limit 100
```

## Troubleshooting

### "RESEND_API_KEY not configured"
- Set the secret: `supabase secrets set RESEND_API_KEY=re_xxx`
- Verify: `supabase secrets list`

### "Email service not configured"
- Check Resend API key is valid
- Verify domain is verified in Resend dashboard

### "Unauthorized"
- Ensure Authorization header is passed
- Verify JWT token is valid and not expired

### Email not received
- Check spam folder
- Verify email address is correct
- Check Resend dashboard for delivery status
- Review function logs for errors

## Cost Optimization

- Emails are sent only when requested (not automatic)
- Deletion tokens expire in 30 minutes
- Consider caching user data to reduce database queries
- Monitor Resend usage in their dashboard
