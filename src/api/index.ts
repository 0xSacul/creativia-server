import { Router } from "express";

const api = Router();

api.get("/", (req, res) => {
  res.json({ message: "Hello, world!" });
});

export default api;
