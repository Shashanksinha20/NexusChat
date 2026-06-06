import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

function createRedis() {
  if (!process.env.REDIS_URL) return null;
  const client = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  client.on('error', (err) => console.warn('Redis error:', err.message));
  return client;
}

export const redis = globalThis.redis ?? createRedis();
if (process.env.NODE_ENV !== 'production' && redis) globalThis.redis = redis;
