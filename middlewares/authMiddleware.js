import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
    req.user = await User.findById(decoded.id).select("-password");
    req.user.id = user._id;

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {protect};
