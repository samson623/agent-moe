# Google OAuth Setup for Agent Moe

Supabase project: `vxhgbwgspifvanxaowij`
Redirect URI: `https://vxhgbwgspifvanxaowij.supabase.co/auth/v1/callback`

---

## Step 1: Create Google Cloud OAuth Credentials

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your project (or create one — any name is fine, e.g. "Agent Moe")
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External** (you can restrict later)
   - App name: `Agent Moe`
   - User support email: your email
   - Developer contact: your email
   - Scopes: add `email` and `profile` (under Google APIs)
   - Test users: add your Google account email
   - Save and continue through all steps
5. Back on the Credentials page, click **+ CREATE CREDENTIALS** → **OAuth client ID**
6. Application type: **Web application**
7. Name: `Agent Moe (Supabase)`
8. **Authorized JavaScript origins**: leave empty (Supabase handles this)
9. **Authorized redirect URIs** — add exactly:
   ```
   https://vxhgbwgspifvanxaowij.supabase.co/auth/v1/callback
   ```
10. Click **Create**
11. Copy the **Client ID** and **Client Secret** — you'll need both in the next step

---

## Step 2: Enable Google Provider in Supabase Dashboard

1. Go to [Supabase Dashboard → Authentication → Providers](https://supabase.com/dashboard/project/vxhgbwgspifvanxaowij/auth/providers)
2. Find **Google** in the list and expand it
3. Toggle **Enable Sign in with Google** to ON
4. Paste the **Client ID** from Step 1
5. Paste the **Client Secret** from Step 1
6. Leave the redirect URL as the default (it should show `https://vxhgbwgspifvanxaowij.supabase.co/auth/v1/callback`)
7. Click **Save**

---

## Step 3: Add Credentials to Local Environment

Add to `.env.local`:

```env
GOOGLE_CLIENT_ID=<your-client-id-here>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-client-secret-here>
```

These are read by `supabase/config.toml` for local development via `env(GOOGLE_CLIENT_ID)`.

---

## Step 4: (Optional) Push Config via CLI

If the project is linked, you can push the `config.toml` auth settings to the remote project instead of using the Dashboard:

```bash
npx supabase login
npx supabase link --project-ref vxhgbwgspifvanxaowij
npx supabase config push
```

This pushes the `[auth.external.google]` section from `config.toml` to the hosted project. The `env()` references will resolve from your local environment variables at push time.

> **Note**: The Dashboard method (Step 2) is simpler and recommended for a one-time setup. `config push` is useful for reproducible infrastructure-as-code workflows.

---

## Step 5: Test the Integration

1. Start the dev server: `pnpm dev`
2. Open `http://localhost:3000/login`
3. Click **Continue with Google**
4. You should be redirected to Google's consent screen
5. After granting access, you should land back on the dashboard (`/`)
6. Verify in Supabase Dashboard → Authentication → Users that your Google account appears

### Troubleshooting

| Symptom | Fix |
|---|---|
| Redirected back to `/login?error=google_sign_in_failed` | Google provider not enabled in Supabase Dashboard, or Client ID / Secret are wrong |
| Google shows "redirect_uri_mismatch" | The redirect URI in Google Console doesn't exactly match `https://vxhgbwgspifvanxaowij.supabase.co/auth/v1/callback` |
| Google shows "Access blocked: app not verified" | Add your Google email as a test user in the OAuth consent screen |
| Sign-in works but session isn't persisted | Check that `middleware.ts` has `/auth/callback` in `PUBLIC_ROUTES` |
| 404 on `/auth/callback` | Ensure `src/app/auth/callback/route.ts` exists |
