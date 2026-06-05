import prisma from '../db/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// User Registration
const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const newUser = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword
    }
  });
  const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return res.status(201).json({ message: 'user registered successfully', user: newUser, token });
};

// User Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid password' });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return res.status(200).json({ message: 'login successful', token });
};

export { registerUser, loginUser };