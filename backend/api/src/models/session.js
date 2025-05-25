import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender : String,          // userId
  text   : String,
  ts     : { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
  sessionId : { type: String, unique: true },
  userA     : String,
  userB     : String,
  tags      : [String],
  startedAt : { type: Date, default: Date.now },
  endedAt   : Date,
  messages  : [messageSchema]
});

export default mongoose.model("Session", sessionSchema);