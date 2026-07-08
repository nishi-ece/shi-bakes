import { Client } from '@notionhq/client';
import { Resend } from 'resend';

const notion = new Client({ auth: process.env.NOTION_SECRET });
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, address, items, total, notes } = req.body;

  if (!name || !email || !items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Save order to Notion
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_ORDERS_DB },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Email: { email },
        Address: { rich_text: [{ text: { content: address || '' } }] },
        Items: { rich_text: [{ text: { content: items } }] },
        Total: { number: parseFloat(total) || 0 },
        Notes: { rich_text: [{ text: { content: notes || '' } }] },
        Status: { select: { name: 'New' } },
      }
    });

    // Send notification email
    await resend.emails.send({
      from: 'Thye. Orders <orders@resend.dev>',
      to: process.env.NOTIFY_EMAIL,
      subject: `🍪 New order from ${name}!`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#3d3dbf">New Order — Thye. Bakehouse</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666;width:120px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Address</td><td style="padding:8px 0">${address || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Total</td><td style="padding:8px 0;font-weight:600;color:#3d3dbf">$${total}</td></tr>
          </table>
          <h3 style="color:#3d3dbf;margin-top:20px">Items Ordered</h3>
          <p style="white-space:pre-line;background:#f4f4ff;padding:16px;border-radius:8px">${items}</p>
          ${notes ? `<h3 style="color:#3d3dbf">Notes</h3><p style="background:#f4f4ff;padding:16px;border-radius:8px">${notes}</p>` : ''}
          <p style="color:#999;font-size:12px;margin-top:32px">View all orders in your <a href="https://notion.so" style="color:#3d3dbf">Notion dashboard</a></p>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Order error:', err);
    return res.status(500).json({ error: 'Failed to save order' });
  }
}