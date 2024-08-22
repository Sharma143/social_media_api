import express from 'express';
import AWS from 'aws-sdk';

const router = express.Router();
AWS.config.update({
    region: 'ap-south-1', // or your region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  import dotenv from 'dotenv';
  dotenv.config();
  
const TABLE_NAME = 'posts'; // Replace with your DynamoDB table name

// Get all posts with pagination
export const getPosts = async (req, res) => {
    const { page } = req.query;

    try {
        const LIMIT = 8;
        const startIndex = (Number(page) - 1) * LIMIT;

        const totalParams = {
            TableName: TABLE_NAME,
            Select: 'COUNT'
        };
        const total = await dynamoDb.scan(totalParams).promise();
        
        const params = {
            TableName: TABLE_NAME,
            Limit: LIMIT,
            ExclusiveStartKey: startIndex > 0 ? { id: startIndex } : undefined,
            ScanIndexForward: false
        };
        const result = await dynamoDb.scan(params).promise();
        
        res.json({
            data: result.Items,
            currentPage: Number(page),
            numberOfPages: Math.ceil(total.Count / LIMIT)
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get posts by search query
export const getPostsBySearch = async (req, res) => {
    const { searchQuery, tags } = req.query;

    try {
        const titleFilter = searchQuery ? `.*${searchQuery}.*` : '.*';
        const tagsArray = tags ? tags.split(',') : [];

        const params = {
            TableName: TABLE_NAME,
            FilterExpression: 'contains(#title, :title) OR contains(#tags, :tags)',
            ExpressionAttributeNames: {
                '#title': 'title',
                '#tags': 'tags'
            },
            ExpressionAttributeValues: {
                ':title': titleFilter,
                ':tags': tagsArray
            }
        };

        const result = await dynamoDb.scan(params).promise();
        res.json({ data: result.Items });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get posts by creator
export const getPostsByCreator = async (req, res) => {
    const { name } = req.query;

    try {
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: '#name = :name',
            ExpressionAttributeNames: {
                '#name': 'name'
            },
            ExpressionAttributeValues: {
                ':name': name
            }
        };

        const result = await dynamoDb.scan(params).promise();
        res.json({ data: result.Items });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get a single post by ID
export const getPost = async (req, res) => {
    const { id } = req.params;

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { id }
        };

        const result = await dynamoDb.get(params).promise();
        res.status(200).json(result.Item);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Create a new post
export const createPost = async (req, res) => {
    const post = req.body;

    const newPost = {
        ...post,
        id: Date.now().toString(), // Generate a unique ID
        createdAt: new Date().toISOString()
    };

    const params = {
        TableName: TABLE_NAME,
        Item: newPost
    };

    try {
        await dynamoDb.put(params).promise();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Update a post
export const updatePost = async (req, res) => {
    const { id } = req.params;
    const { title, message, creator, selectedFile, tags } = req.body;

    if (!id) return res.status(404).send(`No post with id: ${id}`);

    const updatedPost = { title, message, creator, selectedFile, tags, id, createdAt: new Date().toISOString() };

    const params = {
        TableName: TABLE_NAME,
        Item: updatedPost
    };

    try {
        await dynamoDb.put(params).promise();
        res.json(updatedPost);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Delete a post
export const deletePost = async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(404).send(`No post with id: ${id}`);

    const params = {
        TableName: TABLE_NAME,
        Key: { id }
    };

    try {
        await dynamoDb.delete(params).promise();
        res.json({ message: "Post deleted successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Like a post
export const likePost = async (req, res) => {
    const { id } = req.params;

    if (!req.userId) {
        return res.json({ message: "Unauthenticated" });
    }

    if (!id) return res.status(404).send(`No post with id: ${id}`);

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: 'ADD #likes :userId',
            ExpressionAttributeNames: {
                '#likes': 'likes'
            },
            ExpressionAttributeValues: {
                ':userId': dynamoDb.createSet([req.userId])
            },
            ReturnValues: 'UPDATED_NEW'
        };

        const result = await dynamoDb.update(params).promise();
        res.status(200).json(result.Attributes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Comment on a post
export const commentPost = async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;

    if (!id) return res.status(404).send(`No post with id: ${id}`);

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: 'SET #comments = list_append(if_not_exists(#comments, :empty_list), :new_comment)',
            ExpressionAttributeNames: {
                '#comments': 'comments'
            },
            ExpressionAttributeValues: {
                ':new_comment': [value],
                ':empty_list': []
            },
            ReturnValues: 'UPDATED_NEW'
        };

        const result = await dynamoDb.update(params).promise();
        res.json(result.Attributes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default router;
