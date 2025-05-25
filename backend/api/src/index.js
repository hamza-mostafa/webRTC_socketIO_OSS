import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import auth from "./routes/auth.js";

const app = express();
app.use(cors()).use(express.json());
app.use("/api", auth);

mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(4000, () => console.log("API listening on :4000"));
});
