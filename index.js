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


// verify function for jwt
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Access Forbidden' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    });

}


const run = async () => {
    try {
        await client.connect();
        console.log('database connected');

        // collections
        const userCollection = client.db('manufacturer-db').collection('users');

        // login user api to create token and update user database
        app.put('/user/:email', async (req, res) => {
            const user = req.body
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token });
        })

        // USERS API 
        app.get('/user', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

    } finally {

    }



}
run().catch(console.dir)




app.get('/', (req, res) => {
    res.send("server running");
});


app.listen(port, () => console.log('server running on port: ', port))