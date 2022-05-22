const express = require('express');
const app = express();
 const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
 const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;



// two significant middleware here ..............................................
app.use(cors())
app.use(express.json())

//Mongodb connection code here ....................................................
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sow4u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log('db connected')

// function for all rest api code here..............................................
async function run() {
    try {
        await client.connect(); 
        const productCollection = client.db('toolMerchant').collection('products')

        //get product data from mongodb ...........
        app.get('/products', async(req, res)=>{
            const query = {}
            const result = await productCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/products/:id', async(req, res)=>{
            const id = req.params.id
            console.log(id)
            const query = {_id: ObjectId(id)}
            const result = await productCollection.findOne(query)
            res.send(result)
        })




    }
    finally { }
}

run().catch(console.dir)







//initial api caller......................................................................
app.get('/', (req, res) => {
    res.send('Node js is ready to work...........')
})

//port listen to server.............................................................
app.listen(port, () => {
    console.log('toolMerchant Server running on the PORT::', port)
})

// verify function for jwt.........................................................
function verifyToken(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, function (error, decoded) {
        if (error) {
            email = 'Invalid email Address'
        }
        if (decoded) {           
            email = decoded
        }
    });
    return email;
}