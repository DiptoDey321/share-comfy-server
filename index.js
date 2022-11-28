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

// console.log(process.env.STRIPE_SECRET_KEY);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1ybdqfv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
    try {
        const productsCollection = client.db("shareComfy").collection("products");
        const usersCollection = client.db("shareComfy").collection("users");
        const bookProductsCollection = client.db("shareComfy").collection("bookproduct");
        const paymentCollection = client.db("shareComfy").collection("PaymentHistory");
        const advertisCollection = client.db("shareComfy").collection("advertiseProduct");

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

        app.post('/create-payment-intent', async (req, res) => {
            // console.log(req.body.price);
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments',async(req, res) =>{
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment)
            const id = payment.bookingId
            const filter = {_id : ObjectId(id)}
            const updateDoc = {
                $set : {
                    paid : true,
                    transationId : payment.transactionId
                }
            }
            const updateResult = await bookProductsCollection.updateOne(filter,updateDoc)
            res.send(result)
        })

        

         // advertise product add to db 
         app.post('/avertise', async(req, res) =>{
            const product = req.body;
            const result = await advertisCollection.insertOne(product)
            res.send(result)
        })

        // get all advertise product 
      app.get('/avertise', async (req, res) => {
        const query = {}
        const cursor = advertisCollection.find(query);
        const advertisProduct = await cursor.toArray();
        res.send(advertisProduct);
      });

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

         // added  products get for specific user
         app.get('/userProducts/:id', async (req, res) => {
            const user_email = req.params.id
            const query = { email: user_email }
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // add users to bd 
        app.post('/users',async (req,res) =>{
            const user = req.body;
            const email = user.email
            const query = {email : email}
            const existUser = usersCollection.find(query)
            const users = await existUser.toArray();
            if(users.length  < 1){
                 const result = await usersCollection.insertOne(user)
            }
        })

        app.delete('/user/:id',async(req,res)=>{
            const id = req.params.id
            const query = {_id:ObjectId(id)}
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        app.delete('/product/:id',async(req,res)=>{
            const id = req.params.id
            const query = {_id:ObjectId(id)}
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        // get users by role
        app.get('/users/:id', async (req, res) => {
            const user_role = req.params.id
            const query = { role:user_role}
            const cursor = usersCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        });

        //get user by email
        app.get('/user/:id', async (req, res) => {
            const user_email = req.params.id
            console.log(user_email);
            const query = { email: user_email }
            const user = await usersCollection.findOne(query);
            res.send(user);
        });


        // get booking items by id 
        app.get('/booking/:id',async(req,res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const bookedItems = await bookProductsCollection.findOne(query);
            res.send(bookedItems);
        })

        // add bookingProduct to bd 
        app.post('/bookingProducts', verifyJWT ,async (req,res) =>{
            const bookedproduct = req.body;
            const result = await bookProductsCollection.insertOne(bookedproduct)
            res.send(result)
        })

        // get bookingProduct to by email filtering 
        app.get('/bookingProducts/:id', async (req,res) =>{
            const email = req.params.id
            const query = { customerEmail:email }
            const cursor = bookProductsCollection.find(query);
            const bookedCollection = await cursor.toArray();
            res.send(bookedCollection)
        })

        app.get('/user/admin/:id', async(req, res) =>{
            const email = req.params.id;
            const query = {email : email}
            const user = await usersCollection.find(query)
            res.send({isAdmin : User?.role == "admin"});
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