const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const usersRoute = require('./routes/users');
const planRoutes = require('./routes/planRoutes');
const workflowRoutes = require('./routes/workflows');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect routes

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/plan', planRoutes); 
app.use('/api', workflowRoutes);
app.use('/api', usersRoute);
app.get('/', (req, res) => {
  res.send('API is running...');
});

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
