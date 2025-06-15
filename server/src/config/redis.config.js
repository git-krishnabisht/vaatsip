import redis from "redis";

const redis_client = redis.createClient({
  socket: {
    port: 6379,
    host: "127.0.0.1",
  },
  database: 0,
});

redis_client.on("error", (err) => console.error("Redis Error:", err));

(async () => {
  await redis_client.connect();
  console.log("Connected to Redis");
})();

export default redis_client;
