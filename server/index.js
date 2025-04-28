const express = require("express");
const cors = require("cors");
require("dotenv").config();
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} at http://0.0.0.0:${PORT}`);
});

// Add a test route to verify server is responding
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});
