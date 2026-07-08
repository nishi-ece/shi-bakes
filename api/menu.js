import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_SECRET });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_MENU_DB,
      filter: {
        property: 'Active',
        checkbox: { equals: true }
      },
      sorts: [{ property: 'Category', direction: 'ascending' }]
    });

    const items = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        name: props.Name?.title?.[0]?.plain_text ?? '',
        category: props.Category?.select?.name ?? '',
        description: props.Description?.rich_text?.[0]?.plain_text ?? '',
        price: props.Price?.number ?? 0,
        price2: props.Price2?.number ?? null,
        priceLabel: props.PriceLabel?.rich_text?.[0]?.plain_text ?? '',
        priceLabel2: props.PriceLabel2?.rich_text?.[0]?.plain_text ?? '',
        emoji: props.Emoji?.rich_text?.[0]?.plain_text ?? '🍪',
        badge: props.Badge?.select?.name ?? null,
      };
    });

    return res.status(200).json({ items });
  } catch (err) {
    console.error('Notion menu error:', err);
    return res.status(500).json({ error: 'Failed to load menu' });
  }
}