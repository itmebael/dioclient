# Password reset tokens

The client calls POST /auth/v1/recover, verifies the emailed token with
POST /auth/v1/verify using type `recovery`, then updates the password with
the verified access token. It does not request a magic link or generate tokens
in the browser. The recovery access token stays in memory and is cleared when
the dialog closes or the password update succeeds.

## Hosted Supabase setup (required)

In project `lnipoknkbjcxwnggzrnm`, open Authentication > Email Templates >
Reset Password. Set the subject to `Your ParishLink password reset token`
and paste `supabase/templates/recovery.html` into the message body.
The `{{ .Token }}` placeholder sends the code instead of a clickable link.
Adding the local file alone does not update the hosted template.

If sending still fails, inspect the project's Auth logs for the failed recovery
request and correct the email template or SMTP configuration reported there.
Changing from magic links to recovery tokens does not repair an SMTP failure.
No hosted settings or live email delivery were changed or verified in this workspace.

Official reference: https://supabase.com/docs/guides/auth/auth-email-templates
