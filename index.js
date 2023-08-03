const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_KEY)

// middleware 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.xd4auwc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const docCollection = client.db('DocHouse').collection('addDoctor')
        const serviceCollection = client.db('DocHouse').collection('service')
        const userCollection = client.db('DocHouse').collection('users')
        const cartCollection = client.db('DocHouse').collection('carts')
        const bookingInfoCollection = client.db('DocHouse').collection('bookingInfo')


        // payment api 
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            if (price) {
                const amount = parseFloat(price) * 100
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: "usd",
                    payment_method_types: ['card'],
                });
                res.send({
                    clientSecret: paymentIntent.client_secret,
                });

            }
        });
        // booking info 
        app.post("/bookingInfo", async (req, res) => {
            const doc = req.body;
            const result = await bookingInfoCollection.insertOne(doc);
            res.send(result);
        });
        // get success booking info
        app.get("/bookingInfo", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await bookingInfoCollection.find(query).toArray();
            res.send(result);
        });
        // user api
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(query, updateDoc, options)
            console.log(result);
            res.send(result)
        })
        // get all users 
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        // get user single id 
        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.findOne(query)
            res.send(result)
        })
        // user role 
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'instructor'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        // user base dashboard checking items
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const quary = { email: email };
            const user = await userCollection.findOne(quary);
            const result = { admin: user?.role === "admin" };
            res.send(result)
        })
        app.get('/users/instructor/:email', async (req, res) => {
            const email = req.params.email;
            const quary = { email: email };
            const user = await userCollection.findOne(quary);
            const result = { instructor: user?.role === "instructor" };
            res.send(result)
        })


        // doctor collection api
        app.get("/doctors", async (req, res) => {
            const result = await docCollection.find().toArray();
            res.send(result);
        });
        // add a doctor
        app.post("/addADoctor", async (req, res) => {
            const doc = req.body;
            const result = await docCollection.insertOne(doc);
            res.send(result);
        });
        // get a single doctor
        app.get('/doctor/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await docCollection.findOne(query)
            res.send(result)
        })

        // service collection api
        app.get("/service", async (req, res) => {
            const result = await serviceCollection.find().toArray();
            res.send(result);
        });
        // add a service
        app.post("/service", async (req, res) => {
            const doc = req.body;
            const result = await serviceCollection.insertOne(doc);
            res.send(result);
        });

        // carts api 
        app.post("/carts", async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result);
        });
        // all added item
        app.get("/carts", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });
        // all geting card delete one by one
        app.delete("/carts/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });
        app.put('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const option = { upsert: true }
            const updatedCart = req.body;
            const cart = {
                $set: {
                    cname: updatedCart.cname,
                    number: updatedCart.number,

                }
            }
            const result = await cartCollection.updateOne(filter, cart, option)
            res.send(result)

        })
        app.put('/cart/:id', async (req, res) => {
            const id = req.params.id;
            const item = req.body
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: item,
            }
            const result = await cartCollection.updateOne(filter, updateDoc, options)
            console.log(result);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Doc House Server is Running');
})

app.listen(port, () => {
    console.log(`Doc House Server run on port ${port}`);
})
