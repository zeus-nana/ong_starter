import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);

  process.exit(1);
});

dotenv.config({ path: './config.env' });
import app from './app';

import db from './database/connection';
const port = process.env.PORT || 3333;

const server = app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});

process.on('unhandledRejection', (err: any) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(
    err?.name ?? 'Unknown Error',
    err?.message ?? 'No message available',
  );
  server.close(() => {
    process.exit(1);
  });
});
