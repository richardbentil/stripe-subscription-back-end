import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

const connectToDatabase = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.log(error.message)
        process.exit(1);
    }
}

export default {connectToDatabase}