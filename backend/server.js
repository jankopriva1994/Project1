require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// CORS – povolíme frontend doménu
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://chaties.cz',
    'https://chaties.cz',
    'http://chaties.cz',
    'https://www.chaties.cz',
    'http://www.chaties.cz',
    'http://399188.w88.wedos.ws',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
  credentials: true
}));

// Stripe webhook potřebuje raw body – musí být PŘED express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/user',   require('./routes/user'));
app.use('/api/ai',     require('./routes/ai'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/blog',    require('./routes/blog'));
app.use('/api/contact', require('./routes/contact'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint nenalezen' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interní chyba serveru' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Chaties backend běží na portu ${PORT}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL}`);
});
