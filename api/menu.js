const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_SECRET });

module.exports = async (req, res) => {
  // Allow calls from anywhere (safe to leave open — this endpoint is read-only)
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_MENU_DB,
      filter: {
        property: 'Available',
        checkbox: { equals: true },
      },
      sorts: [
        { property: 'Category', direction: 'ascending' },
        { property: 'Sort', direction: 'ascending' },
      ],
    });

    const items = response.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        name: p.Name?.title?.[0]?.plain_text || 'Untitled',
        category: p.Category?.select?.name || 'other',
        price: p.Price?.number ?? 0,
        unit: p.Unit?.rich_text?.[0]?.plain_text || '',
        description: p.Description?.rich_text?.[0]?.plain_text || '',
        emoji: p.Emoji?.rich_text?.[0]?.plain_text || '🍰',
        badge: p.Badge?.select?.name || '',
      };
    });

    res.status(200).json({ items });
  } catch (err) {
    console.error('Notion menu fetch failed:', err);
    res.status(500).json({ error: 'Failed to load menu from Notion' });
  }
};