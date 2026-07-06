const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_SECRET });

// Email is optional — only wired up if RESEND_API_KEY is set.
let resend = null;
if (process.env.RESEND_API_KEY) {
  const { Resend } = require('resend');
  resend = new Resend(process.env.RESEND_API_KEY);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, address, notes, items, total } = req.body;

    if (!name || !email || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const itemsSummary = items
      .map((i) => `${i.qty}x ${i.name} ($${(i.qty * i.price).toFixed(0)})`)
      .join(', ');

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_ORDERS_DB },
      properties: {
        Name: { title: [{ text: { content: `${name} — $${Number(total).toFixed(2)}` } }] },
        'Customer Email': { email },
        'Delivery Address': { rich_text: [{ text: { content: address || '' } }] },
        Notes: { rich_text: [{ text: { content: notes || '' } }] },
        Items: { rich_text: [{ text: { content: itemsSummary } }] },
        Total: { number: Number(total) || 0 },
        Status: { select: { name: 'New' } },
      },
    });

    if (resend && process.env.NOTIFY_EMAIL) {
      try {
        await resend.emails.send({
          from: 'Thye Bakery Orders <onboarding@resend.dev>',
          to: process.env.NOTIFY_EMAIL,
          subject: `New order from ${name} — $${Number(total).toFixed(2)}`,
          text:
            `New order!\n\n` +
            `Name: ${name}\nEmail: ${email}\nAddress: ${address || '-'}\nNotes: ${notes || '-'}\n\n` +
            `Items:\n${itemsSummary}\n\nTotal: $${Number(total).toFixed(2)}`,
        });
      } catch (emailErr) {
        // Don't fail the whole order if only the email step breaks
        console.error('Email notification failed:', emailErr);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Notion order creation failed:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
};