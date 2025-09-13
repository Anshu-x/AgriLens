const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { name, emailOrPhone, password } = req.body;

    const exists = await User.findOne({ emailOrPhone });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, emailOrPhone, password: hashed });

    res.status(201).json({
      message: "User created",
      user: { id: user._id, name, emailOrPhone }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const user = await User.findOne({ emailOrPhone });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, emailOrPhone: user.emailOrPhone }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};