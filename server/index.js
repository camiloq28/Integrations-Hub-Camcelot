const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Load environment variables from .env.admin
require('dotenv').config({ path: '.env.admin' });

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const usersRoute = require('./routes/users');
const planRoutes = require('./routes/planRoutes');
const workflowRoutes = require('./routes/workflows');
const integrationRoutes = require('./routes/integrations');
const metaRoutes = require('./routes/integrations/meta');
const greenhouseRoutes = require('./routes/integrations/greenhouse');
const webhookRoutes = require('./routes/webhooks');



const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect routes
console.log('🔧 [SERVER_DEBUG] Registering routes...');
app.use('/api/auth', authRoutes);
console.log('✅ [SERVER_DEBUG] Auth routes registered');
app.use('/api/admin', adminRoutes);
console.log('✅ [SERVER_DEBUG] Admin routes registered');
app.use('/api/client', clientRoutes);
console.log('✅ [SERVER_DEBUG] Client routes registered');
app.use('/api/plan', planRoutes);
console.log('✅ [SERVER_DEBUG] Plans routes registered');
app.use('/api', workflowRoutes);
console.log('✅ [SERVER_DEBUG] Workflows routes registered');
app.use('/api', usersRoute);
console.log('✅ [SERVER_DEBUG] Users routes registered');
app.use('/api/integrations', integrationRoutes);
console.log('✅ [SERVER_DEBUG] Integrations routes registered');
app.use('/api/integrations/meta', metaRoutes);
app.use('/api/integrations/greenhouse', greenhouseRoutes);
app.use('/api/webhooks', webhookRoutes);
console.log('✅ [SERVER_DEBUG] Webhooks routes registered');
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Handle unmatched routes with a JSON 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});