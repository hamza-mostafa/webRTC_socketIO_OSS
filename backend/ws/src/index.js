// backend/ws/src/index.js

import "dotenv/config";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import match from "./matcher.js";
import { localIce } from "./ice.js";
import Session from "./models/session.js";

async function bootstrap() {

  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("[WS] MongoDB connected");
  } catch (err) {
    console.error("[WS] MongoDB connection failed:", err);
    process.exit(1);
  }


  const pub = createClient({ url: process.env.REDIS_URL || "redis://redis:6379" });
  const sub = pub.duplicate();
  try {
    await pub.connect();
    await sub.connect();
    console.log("[WS] Redis connected");
  } catch (err) {
    console.error("[WS] Redis connection failed:", err);
    process.exit(1);
  }


  const httpServer = createServer();
  const io = new Server(httpServer, { cors: { origin: "*" } });
  io.adapter(createAdapter(pub, sub));

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {

    socket.join(socket.user.id);


    socket.on("queue", async () => {
      console.log("[MATCH] user enqueued:", socket.user.id);
      const res = await match(socket.user.id, socket.user.interests);
      console.log("[MATCH] match result for", socket.user.id, "=>", res);

      if (res) {
        const sessId = `sess:${Date.now()}:${socket.user.id}:${res.partner}`;

        await Session.create({
          sessionId: sessId,
          userA: socket.user.id,
          userB: res.partner,
          tags: socket.user.interests,
        });

        const ice = localIce(process.env.TURN_USER, process.env.TURN_PASS);


        io.to(socket.id).emit("matched", { ...res, role: "caller", ice, sessId });

        io.to(res.partner).emit("matched", { ...res, role: "callee", ice, sessId });


        setTimeout(async () => {
          io.to(socket.id).emit("end");
          io.to(res.partner).emit("end");
          await Session.updateOne({ sessionId: sessId }, { endedAt: new Date() });

          fetch(`http://turn:8083/close/${sessId}`).catch(() => {});
        }, 5 * 60 * 1000);
      }
    });


    socket.on("chat", async ({ sessId, text }) => {
      const msg = { sender: socket.user.id, text, ts: new Date() };
      await Session.updateOne(
        { sessionId: sessId },
        { $push: { messages: msg } }
      );
    
      const sess = await Session.findOne({ sessionId: sessId }).lean();
      if (!sess) return;
    
      const peerId =
        sess.userA === socket.user.id ? sess.userB : sess.userA;
    
      socket.to(sessId).emit("chat", msg);
    });

    socket.on("signal", (d) => io.to(d.to).emit("signal", d));
    socket.on("heartbeat", () => socket.emit("pong"));
    socket.on("disconnect", () => {
      console.log("[WS] disconnected:", socket.user.id);
    });
  });

  const shutdown = async () => {
    console.log("[WS] shutting down...");
    await Promise.all([pub.quit(), sub.quit(), mongoose.disconnect()]);
    io.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  httpServer.listen(5002, () => console.log("[WS] listening on :5002"));
}

bootstrap();