# Newsletter signup

The homepage, article pages, newsletter page, and site footer share `components/NewsletterSignup.tsx`. All signup requests go to `POST /api/newsletter` on the same origin. The server validates requests, checks the hidden `website` field, and allows five attempts per IP per ten minutes per running instance.

## Vercel setup

1. Open the project serving toptierstate.net and go to **Settings → Environment Variables**.
2. Add `EMAILOCTOPUS_API_KEY` as a sensitive server-side variable. Add `EMAILOCTOPUS_LIST_ID` with the value `40c77fb4-e838-11f1-98e4-7905b7db3ef0` for the **Top Tier** list. Select **Production** for both.
3. Confirm the Top Tier list has a field labeled **Consent** that accepts the value `yes`. The server reads the exact tags from the list API. It also resolves the First Name and Last Name tags when optional names are supplied.
4. Deploy the code with those variables. For local testing, set both values in the ignored `.env.local`. Legacy Mailchimp variables such as `MAILCHIMP_API_KEY` and `MAILCHIMP_LIST_ID` can be removed from hosting after the cutover.

## Verification

Run `node --test --test-isolation=none tests/newsletter.test.cjs` on Node 24 for mocked API tests.

After deploying, submit a fresh inbox you control. Confirm the success message, then open EmailOctopus **Lists → Top Tier → Contacts** and verify the address is **Subscribed** and its **Consent** field is `yes`. Submit the same address from a different form or after refreshing to verify the duplicate message. Check that an invalid email and a submission with the hidden `website` field filled are rejected without creating contacts.
