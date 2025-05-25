import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;
export const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
export const verify = (token) => jwt.verify(token, JWT_SECRET);
