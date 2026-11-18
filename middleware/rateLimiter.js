import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redisClient.js';

export const loginLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  limit: 5,

  standardHeaders: 'draft-8',
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => {
      console.log('Redis command:', args);

      return redisClient.sendCommand(args);
    },
    prefix: 'login_rate_limit:',
  }),

  handler: (req, res) => {
    return res.status(429).render('login',{
        btnDisabled: true,
    })
  },
});