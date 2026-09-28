# Newsletter signup

The shared `components/NewsletterSignup.tsx` component appears after homepage Top Stories, after article content, and above existing footer links. Styles are scoped in `NewsletterSignup.module.css` and use the existing colors, fonts, and breakpoints.

## Submission

With JavaScript enabled, the form posts JSON to `/api/newsletter`. The server validates the email and hidden bot field, then calls the supplied Mailchimp audience's public `/subscribe/post-json` transport. It parses JSON/JSONP as data without executing scripts or rendering Mailchimp HTML. No API key, new dependency, or Supabase change is required. Requests and responses are uncached, time out, and are not automatically retried.

The HTML form retains the exact supplied `/subscribe/post` action, `method="post"`, `name="EMAIL"`, and hidden `b_d74e761f7f05ede1718912346_0a37f9d12b` field. Without JavaScript, or when a reader chooses the fallback after an error, it submits directly to Mailchimp in a new tab.

Mailchimp's public embed transport is not the authenticated Marketing API. CAPTCHA, additional required audience fields, upstream throttling (including shared server IP limits), and changes to Mailchimp's response format may require the hosted fallback. Mailchimp controls opt-in and delivery; pending confirmation is shown separately from confirmed success. Unexpected responses never produce a success message. The primary form prevents repeated clicks while submitting and after acceptance; there is no distributed rate-limit service.

Mailchimp documents hosted verification and required-field behavior in its [embedded form troubleshooting guide](https://mailchimp.com/help/troubleshooting-the-embedded-signup-form/).

## Verification

- `npm.cmd run build`
- `npx.cmd tsc --noEmit`
- `node tests/newsletter.test.cjs` (mocked upstream responses; creates no subscribers)

The existing `npm run lint` currently opens an ESLint configuration prompt because the repository does not have an ESLint config.

## Real signup test before deployment

1. Run `npm run dev`, open the homepage, and use an email address you own that is not already in the audience.
2. Submit the featured form. Confirm the button reads `JOINING...`, remains disabled during submission, and a success or inbox-confirmation message appears. In browser Network tools, verify a single POST to `/api/newsletter`.
3. If Mailchimp asks for email confirmation, open that email and click the confirmation link. Check spam if needed.
4. Open the correct Mailchimp audience and verify that address is present with **Subscribed** status (not merely pending). Check that no unexpected required fields or CAPTCHA settings prevent signup.
5. Reload and submit the same address to check the friendly already-subscribed response. Test the article and footer placements using additional inbox aliases you control.
6. In browser developer tools, block `/api/newsletter`, submit, and use **Continue with Mailchimp**. Confirm it opens a new tab, preserves the email, and completes any hosted verification. Disable request blocking afterward. Also test with JavaScript disabled.
7. Check empty/invalid input, keyboard tab order, visible focus, and a narrow mobile viewport. No signup should occur for invalid input.

No real address was subscribed during automated verification, and nothing was deployed.
