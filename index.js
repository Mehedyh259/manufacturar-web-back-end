const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { get } = require('express/lib/response');

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// database url client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@manufacturer-website.ex4nj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// collections


const run = async () => {
    try {
        await client.connect();
        console.log('database connected');

        const userCollection = client.db('manufacturer-db').collection('users');


        // user api
        app.get('/user', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

    } finally {

    }



}
run().catch(console.dir)




app.get('/', (req, res) => {
    res.send("server running");
});


app.listen(port, () => console.log('server running on port: ', port))