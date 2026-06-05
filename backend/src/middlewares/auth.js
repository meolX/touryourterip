import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.js";

const authenticateToken = async (req, res, next) => {
  const authHeader = await req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization Header is missing" });
  }
  const token =  autheHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token is missing" });
  }
  await jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
  });
  next();
};

export default authenticateToken;
