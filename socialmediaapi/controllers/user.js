import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

AWS.config.update({
  region: 'ap-south-1', // or your region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'users'; // Replace with your DynamoDB table name
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET_KEY;

// Signin Function
export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch user from DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Key: { email }
    };

    const { Item: oldUser } = await dynamoDb.get(params).promise();

    if (!oldUser) return res.status(404).json({ message: "User doesn't exist" });

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ email: oldUser.email, id: oldUser.email }, secret, { expiresIn: "1h" });

    res.status(200).json({ result: oldUser, token });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Signup Function
export const signup = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    // Check if user already exists
    const params = {
      TableName: TABLE_NAME,
      Key: { email }
    };
    console.log("Received signup request:", { email, password, firstName, lastName });

    const { Item: oldUser } = await dynamoDb.get(params).promise();

    if (oldUser) return res.status(400).json({ message: "User already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const newUser = {
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
    };

    const putParams = {
      TableName: TABLE_NAME,
      Item: newUser
    };

    await dynamoDb.put(putParams).promise();

    // Generate JWT token
    const token = jwt.sign({ email: newUser.email, id: newUser.email }, secret, { expiresIn: "1h" });

    res.status(201).json({ result: newUser, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
};
