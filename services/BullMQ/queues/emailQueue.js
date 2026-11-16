import { Queue } from 'bullmq';
import IORedis from 'ioredis';


const connection = new IORedis({
    host: 'redis',
    port: 6379,
    maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-queue', { 
    connection,  
    defaultJobOptions: {
    removeOnComplete: false, // Keeps completed jobs visible in Redis
    removeOnFail: false,     // Keeps failed jobs visible in Redis
  },
 });