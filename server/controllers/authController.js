const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory users database (temporary)
const users = [];

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Register new user
const register = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' });
  }

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { email, password: hashedPassword, role };
  users.push(newUser);

  console.log('Registered Users:', users);

  res.status(201).json({ message: 'User registered successfully.' });
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token, user: { email: user.email, role: user.role } });
};

module.exports = { register, login };
