import 'dotenv/config';
import mongoose from 'mongoose';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
