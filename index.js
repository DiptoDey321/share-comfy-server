const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken') 
const port = process.env.port || 5000 ;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


app.use(cors())
app.use(express.json());

// console.log(process.env.DB_USER ,process.env.DB_PASSWORD);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1ybdqfv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try {
        const productsCollection = client.db("shareComfy").collection("products");
        const usersCollection = client.db("shareComfy").collection("users");
        const bookProductsCollection = client.db("shareComfy").collection("bookproduct");

        app.get('/create-payment-intent', async(req,res)=>{
            const booking = req.body;
            const price = booking.price;
            const amount= price*100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency : 'usd',
                amount : amount,
                "payment_method_types ": [
                    "card"
                ]
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        // ===========
        //  ***JWT***
        // =========== 
        app.get('/jwt', async(req,res)=>{
            const email = req.query.email;
            const qwery = {email : email}
            const user = await usersCollection.findOne()
            if(user){
                const token = jwt.sign({email},process.env.ACCESS_TOKEN, {expiresIn : '23h'})
                return res.send({accessToken : token})
            }
            console.log(user);
            res.status(403).send({accessToken : ''})
            
        })

        // products add to db 
        app.post('/products', async(req, res) =>{
            const product = req.body;
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })
        
        //  products get categorywise
        app.get('/products/:id', async (req, res) => {
            const category = req.params.id
            const query = { category: category }
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // add users to bd 
        app.post('/users',async (req,res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // add bookingProduct to bd 
        app.post('/bookingProducts',async (req,res) =>{
            const bookedproduct = req.body;
            const result = await bookProductsCollection.insertOne(bookedproduct)
            res.send(result)
        })

        // get bookingProduct to by email filtering 
        app.get('/bookingProducts/:id',async (req,res) =>{
            const email = req.params.id
            // console.log(email);
            const query = { customerEmail:email }
            const cursor = bookProductsCollection.find(query);
            const bookedCollection = await cursor.toArray();
            res.send(bookedCollection)
        })

        app.get('/booking/:id',async(req,res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const bookedItems = await bookProductsCollection.findOne(query);
            res.send(bookedItems);
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