import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import AWS from 'aws-sdk';

// Import routes
import postRoutes from './routes/posts.js';
import userRouter from "./routes/user.js";

const app = express();

// Middleware
app.use(express.json({ limit: '30mb', extended: true }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

app.get('/', (req, res) => {
    res.json("Hellow world")
})
// Routes
app.use('/posts', postRoutes);
app.use("/user", userRouter);

// Set up DynamoDB
AWS.config.update({
  region: 'us-east-1', // or your region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
