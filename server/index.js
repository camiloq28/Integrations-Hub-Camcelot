const express = require("express");
const cors = require("cors");
require("dotenv").config();
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
