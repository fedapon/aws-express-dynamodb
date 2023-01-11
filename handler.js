const AWS = require("aws-sdk")
const express = require("express")
const serverless = require("serverless-http")
const { v4: uuid } = require("uuid")

const app = express()

const USERS_TABLE = process.env.USERS_TABLE
const IS_OFFLINE = process.env.IS_OFFLINE

let dynamoDbClient
if (!IS_OFFLINE) {
    dynamoDbClient = new AWS.DynamoDB.DocumentClient()
} else {
    dynamoDbClient = new AWS.DynamoDB.DocumentClient({
        region: "localhost",
        endpoint: "http://localhost:8000",
    })
}

app.use(express.json())

app.get("/users/:userId", async function (req, res) {
    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: req.params.userId,
        },
    }
    try {
        const { Item } = await dynamoDbClient.get(params).promise()
        if (!Item) {
            return res.status(404).json({
                error: 'Could not find user with provided "userId"',
            })
        }
        return res.json(Item)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "could not retreive user" })
    }
})

app.get("/users", async function (req, res) {
    const params = {
        TableName: USERS_TABLE,
    }
    try {
        const { Items } = await dynamoDbClient.scan(params).promise()
        if (!Items) {
            return res.status(404).json({
                error: "Could not find any user",
            })
        }
        return res.json(Items)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "could not retreive a list of users" })
    }
})

app.post("/users", async function (req, res) {
    const { firstName, lastName, age } = req.body
    const params = {
        TableName: USERS_TABLE,
        Item: {
            userId: uuid(),
            firstName: firstName || "",
            lastName: lastName || "",
            age: age || "",
        },
    }
    try {
        await dynamoDbClient.put(params).promise()
        return res.json(params.Item)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "could not create user" })
    }
})

app.delete("/users/:userId", async function (req, res) {
    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: req.params.userId,
        },
    }
    try {
        await dynamoDbClient.delete(params).promise()
        return res.json({ message: "deleted successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "could not delete" })
    }
})

app.use((req, res, next) => {
    return res.status(404).json({
        error: "Not Found",
    })
})

module.exports.handler = serverless(app)
