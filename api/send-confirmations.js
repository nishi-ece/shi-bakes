const { Client } = require('@notionhq/client');
const { Resend } = require('resend');

const notion = new Client({ auth: process.env.NOTION_SECRET });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

module.exports = async (req, res) => {
  // Simple shared-secret check so random people can't spam this endpoint
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_ORDERS_DB,
      filter: {
        and: [
          { property: 'Confirmed', checkbox: { equals: true } },
          { property: 'Confirmation Sent', checkbox: { equals: false } },
        ],
      },
    });

    let sent = 0;
    const errors = [];

    for (const page of response.results) {
      const p = page.properties;
      const customerEmail = p['Email']?.email;
      const customerName = p.Name?.title?.[0]?.plain_text || 'there';
      const items = p.Items?.rich_text?.[0]?.plain_text || '';
      const total = p.Total?.number ?? 0;

      if (!customerEmail) {
        errors.push(`Page ${page.id} has no customer email, skipped`);
        continue;
      }

      try {
        await resend.emails.send({
          from: 'Thye Bakery <onboarding@resend.dev>',
          to: customerEmail,
          subject: `Your Thye. order is confirmed! 🍪`,
          text:
            `Hi ${customerName.split(' — $')[0]},\n\n` +
            `Your order has been confirmed and is on its way!\n\n` +
            `Items:\n${items}\n\nTotal: $${Number(total).toFixed(2)}\n\n` +
            `Thanks for supporting Thye. — see you again soon!`,
        });

        await notion.pages.update({
          page_id: page.id,
          properties: {
            'Confirmation Sent': { checkbox: true },
          },
        });

        sent++;
      } catch (err) {
        errors.push(`Failed for ${customerEmail}: ${err.message}`);
      }
    }

    res.status(200).json({ sent, errors });
  } catch (err) {
    console.error('send-confirmations error:', err);
    res.status(500).json({ error: 'Failed to process confirmations' });
  }
};