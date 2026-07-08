# Thye. Bakery — Notion-powered menu & orders

## What changed
- `index.html` no longer has the menu or order items hardcoded. Both are now
  built on page load from a single Notion **Menu** database — one place to
  edit names, prices, descriptions, and availability.
- Tiramisu sizes are no longer a special two-button widget. Add "Classic
  Tiramisu — Small" and "Classic Tiramisu — Medium" as two separate rows in
  Notion, same as Focaccia/Jam already do. Simpler to maintain, no code needed.
- `api/menu.js` — reads the Menu database, returns it as JSON.
- `api/order.js` — writes each submitted order into your Orders database,
  and (optionally) emails you a notification.

## 1. Set up the Menu database in Notion
Add these exact property names/types:

| Property     | Type     | Notes                                                        |
|--------------|----------|---------------------------------------------------------------|
| Name         | Title    | e.g. "Chocolate Chip Cookies"                                  |
| Category     | Select   | one of: `cookies`, `cupcakes`, `desserts`, `savoury`           |
| Price        | Number   | just the number, e.g. `18`                                     |
| Unit         | Text     | e.g. "box of 6", "250ml" (optional)                            |
| Description  | Text     | shown on the menu card (optional)                               |
| Emoji        | Text     | a single emoji, e.g. 🍪 (optional, defaults to 🍰)              |
| Badge        | Select   | one of: `Ships Tomorrow`, `Book Ahead`, `Seasonal`, or blank    |
| Available    | Checkbox | must be checked for the item to show up on the site            |
| Sort         | Number   | controls order within a category (lower = first)               |

Category values must match exactly (lowercase) so the menu tab filters keep working.

## 2. Set up the Orders database in Notion
Add these exact property names/types:

| Property          | Type     |
|-------------------|----------|
| Name              | Title    |
| Customer Email    | Email    |
| Delivery Address  | Text     |
| Notes             | Text     |
| Items             | Text     |
| Total             | Number   |
| Status            | Select (add options: New, Confirmed, Dispatched, Delivered) |

## 3. Share both databases with your integration
This is the step people usually miss. Creating an API secret does **not**
automatically give it access to a database.

On each database page: click **`•••`** (top right) → **Connections** →
add your integration by name. Do this for **both** databases.

## 4. Double-check your Vercel environment variables
- `NOTION_SECRET` — your integration's secret key
- `NOTION_MENU_DB` — the Menu database ID (the 32-character string in the
  database URL, right before `?v=`)
- `NOTION_ORDERS_DB` — the Orders database ID, same format
- `NOTIFY_EMAIL` — the email address you want order notifications sent to
- `RESEND_API_KEY` — **new, needs adding** — see step 5

## 5. Add email notifications (optional but recommended)
Vercel can't send email on its own — `NOTIFY_EMAIL` just tells the code
*where* to send it. Sign up free at https://resend.com, grab an API key,
and add it to Vercel as `RESEND_API_KEY`.

Until you verify your own sending domain with Resend, orders will email
from their shared test address (`onboarding@resend.dev`) — fine for now,
but only deliverable to the email you signed up with on Resend. Once
you verify a domain (e.g. `thyebakes.com`) you can send to any address
and change the `from` line in `api/order.js` to match.

If you'd rather skip email for now, everything still works — orders will
just show up in your Notion Orders database without a notification.

## 6. Deploy
Replace your repo's `index.html` with the one here, and add the `api/`
folder and `package.json` at the root of your repo. Push to GitHub —
Vercel will auto-deploy since it's already connected.

**Important:** since the menu/order APIs only run on Vercel (GitHub Pages
can't run server code), your live site needs to be the Vercel deployment
URL, not the github.io one. In Vercel, go to your project → Settings →
Domains, and either use the `*.vercel.app` URL it gives you, or attach
your own custom domain there instead of pointing it at GitHub Pages.

## 7. Test it
1. Add 3-4 rows to the Menu database, check `Available`.
2. Visit your Vercel URL — items should appear in both the Menu and
   Quick Order sections.
3. Place a test order — check that a new row appears in your Orders
   database, and that you get the notification email (if set up).

## Editing going forward
- Change a price or description → edit the row in the Menu database →
  refresh the site. No code, no redeploy needed.
- Add a new item → add a new row, set Category/Available/Sort → done.
- Take something off the menu temporarily → uncheck Available.

gmail_pwd: jujp zhvf zumm gsfz
jujpzhvfzummgsfz

cron: https://shi-bakes.vercel.app/api/send-confirmations?secret=r8A1QeAvKczBy5sYmXnY