const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.port || 5000 ;


app.use(cors())
app.use(express.json());

// console.log(process.env.DB_USER ,process.env.DB_PASSWORD);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1ybdqfv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try {
        const productsCollection = client.db("shareComfy").collection("products");
        const usersCollection = client.db("shareComfy").collection("users");

        // add products to db 
        app.post('/products', async(req, res) =>{
            const product = req.body;
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })
        
        // get products categorywise
        app.get('/products/:id', async (req, res) => {
            const category = req.params.id
            const query = { category: category }
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // insert users to bd 
        app.post('/users',async (req,res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })
            

    }
    finally{

    }
}

run().catch(err => console.log(err))

app.get('/', (req, res) => {
    res.send('Hello From share comfy!')
})

app.listen(port, () => {
    console.log(`share comfy server running on ${port}`)
})