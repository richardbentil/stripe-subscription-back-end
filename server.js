import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import subscriptionRoutes from './routes/subscriptionRoutes.js'
import connectDb from './config/db.js'

//load env variables
dotenv.config()

const app = express();

const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

connectDb.connectToDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});