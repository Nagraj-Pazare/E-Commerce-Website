import mongoose from 'mongoose'

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
}

export default connectToDB;