import Queue from 'bull';

const redisConfig = {
  redis: {
    host: 'localhost',
    port: 6379,
  },
};

export const fileProcessingQueue = new Queue('fileProcessing', redisConfig);

export const defaultJobOptions: Queue.JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
