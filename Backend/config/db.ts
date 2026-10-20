
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is missing from the .env file");
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("MongoDB connection failed:", error.message);
    } else {
      console.error("MongoDB connection failed:", error);
    }

    process.exit(1);
  }
};

export default connectDB;
