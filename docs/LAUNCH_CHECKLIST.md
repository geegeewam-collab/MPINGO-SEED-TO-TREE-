# Launch checklist

1. **Database.** Create a Supabase project. Apply `supabase/migrations/0001` to `0012` in order (0012 creates the `evidence` and `grove-photos` storage buckets) (`supabase db push`, or paste each file into the SQL editor).
2. **First administrator.** Sign up the first account, then in the SQL editor run: `update profiles set role = 'admin', status = 'active' where email = 'you@example.org';`
3. **Turn off open sign-up.** Supabase, Authentication, Providers, Email: disable "Allow new users to sign up". People join by invitation only.
4. **Email links.** Supabase, Authentication, URL configuration: set the Site URL and add `https://YOUR-SITE/auth/confirm` to the redirect list. In the email templates, make the links point to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (invite) and `...&type=recovery&next=/auth/reset-password` (reset password).
5. **Environment variables.** Copy `.env.example`, fill it in, and add the same values in Vercel. Never commit real keys.
6. **Email and SMS.** Optional. Without keys the system works but does not send messages, and says so on screen.
7. **Backups.** Turn on Supabase daily backups (paid plans) and test one restore.
8. **Try it end to end** with one nursery and one planting group before inviting everyone.
9. **Check storage.** After running 0012, confirm in Supabase Storage that `evidence` is private and `grove-photos` is public, and take one test photo from a phone.
10. **Still to build / test** (see BUILD_STATUS.md): offline capture on a real phone, email and SMS with live keys.
