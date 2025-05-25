import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL || "redis://redis:6379" });
await redis.connect();


export default async function match(userId, interests, ttlSecs = 30) {
  for (const interest of interests) {
    const key = `waiting:${interest}`;
    const peerId = await redis.lPop(key);

    if (peerId) {
      if (peerId !== userId) {
        return { partner: peerId, interestMatched: interest };
      }
    }

    await redis
      .multi()
      .rPush(key, userId)
      .expire(key, ttlSecs, 'NX')
      .exec();
  }

  // No match yet
  return null;
}