const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// database url client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@manufacturer-website.ex4nj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




// verify function for jwt
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Access Forbidden' });
        }
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
        const productCollection = client.db('manufacturer-db').collection('products');
        const reviewCollection = client.db('manufacturer-db').collection('reviews');
        const orderCollection = client.db('manufacturer-db').collection('orders');

        // verify admin from database
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            const role = requesterAccount.role;
            if (role === 'admin') {
                next()
            } else {
                res.status(403).send({ message: 'forbidden access' })
            }
        }

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
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const result = await userCollection.findOne({ email: email });
            res.send(result);
        });



        // PRODUCT API
        app.get('/product', async (req, res) => {
            const limit = Number(req.query?.limit);
            if (limit) {
                const products = await productCollection.find().limit(limit).toArray();
                res.send(products);
            } else {
                const products = await productCollection.find().toArray();
                res.send(products);
            }
        })
        app.get('/product/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const product = await productCollection.findOne(filter);
            res.send(product);
        })

        app.post('/product', verifyToken, verifyAdmin, async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const newUpdate = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: newUpdate.quantity
                }
            };
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })



        // ORDER API
        app.post('/order', verifyToken, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
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