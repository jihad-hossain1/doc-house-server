const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 4000;
require('dotenv').config();

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
        await client.connect();

        const docCollection = client.db('DocHouse').collection('addDoctor')

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
