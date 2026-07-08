import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 👉 Replace with your email later
const YOUR_EMAIL = "shisbakedgoods@gmail.com";

// TEST route
app.get('/', (req, res) => {
  res.send('Server running ✅');
});

// MAIN ORDER API
app.post('/order', async (req, res) => {
  const order = req.body;

  console.log("📦 New Order:", order);

  // ── 📲 WHATSAPP (simple link fallback) ──
  const whatsappMessage = `New Order 🍰\nName: ${order.name}\nItems: ${order.items}\nAddress: ${order.address}`;
  const whatsappURL = `https://wa.me/17785223109?text=${encodeURIComponent(whatsappMessage)}`;

  // ── 📧 EMAIL (temporary console log) ──
  console.log("Send email to customer:", order.email);
  console.log("Send email to you:", YOUR_EMAIL);

  res.json({
    success: true,
    whatsappURL
  });
});

app.listen(3000, () => console.log("🚀 Running on http://localhost:3000"));