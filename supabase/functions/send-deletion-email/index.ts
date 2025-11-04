// Follow this setup guide: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface DeletionEmailRequest {
	userId: string;
	email: string;
	username: string;
	deletionToken: string;
	appUrl: string;
}

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST",
				"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
			},
		});
	}

	try {
		// Verify the request is authenticated
		const authHeader = req.headers.get("Authorization");
		if (!authHeader) {
			return new Response(JSON.stringify({ error: "Missing authorization header" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Create Supabase client to verify the user
		const supabaseClient = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_ANON_KEY") ?? "",
			{
				global: {
					headers: { Authorization: authHeader },
				},
			},
		);

		// Verify user is authenticated
		const {
			data: { user },
			error: userError,
		} = await supabaseClient.auth.getUser();

		if (userError || !user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Parse request body
		const { userId, email, username, deletionToken, appUrl }: DeletionEmailRequest =
			await req.json();

		// Verify the authenticated user matches the requested userId
		if (user.id !== userId) {
			return new Response(JSON.stringify({ error: "User ID mismatch" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Generate deletion confirmation URL
		const deletionUrl = `${appUrl}/account/confirm-delete?token=${deletionToken}&user_id=${userId}`;

		// Send email using Resend
		if (!RESEND_API_KEY) {
			console.error("RESEND_API_KEY not configured");
			return new Response(
				JSON.stringify({
					error: "Email service not configured",
					// In dev, return the URL
					deletionUrl: Deno.env.get("ENVIRONMENT") === "development" ? deletionUrl : undefined,
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const emailResponse = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${RESEND_API_KEY}`,
			},
			body: JSON.stringify({
				from: "Word Gravity <xandwrp@gmail.com>",
				to: [email],
				subject: "Confirm Account Deletion - Word Gravity",
				html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Word Gravity</h1>
    </div>

    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <h2 style="color: #d32f2f; margin-top: 0;">Account Deletion Request</h2>

        <p>Hello <strong>${username || "there"}</strong>,</p>

        <p>You have requested to delete your Word Gravity account. This action is <strong>permanent and cannot be undone</strong>.</p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Warning:</strong> Confirming this action will permanently delete:</p>
            <ul style="color: #856404; margin: 10px 0;">
                <li>Your account and profile</li>
                <li>All your game scores and statistics</li>
                <li>All associated data</li>
            </ul>
        </div>

        <p>If you're sure you want to proceed, click the button below. This link will expire in 30 minutes.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${deletionUrl}"
               style="background-color: #d32f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Confirm Account Deletion
            </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request this, you can safely ignore this email. Your account will remain active.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #999; font-size: 12px; text-align: center;">
            This link will expire in 30 minutes for security reasons.<br>
            © ${new Date().getFullYear()} Word Gravity. All rights reserved.
        </p>
    </div>
</body>
</html>
				`,
			}),
		});

		if (!emailResponse.ok) {
			const errorData = await emailResponse.json();
			console.error("Resend API error:", errorData);
			return new Response(
				JSON.stringify({
					error: "Failed to send email",
					details: errorData,
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const emailData = await emailResponse.json();

		return new Response(
			JSON.stringify({
				success: true,
				message: "Deletion confirmation email sent successfully",
				emailId: emailData.id,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			},
		);
	} catch (error) {
		console.error("Error in send-deletion-email function:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
});
