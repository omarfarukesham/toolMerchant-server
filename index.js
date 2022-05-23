const express = require('express');
const app = express();
 const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
 const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 4000;



// two significant middleware here ..............................................
app.use(cors())
app.use(express.json())

//Mongodb connection code here ....................................................
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sow4u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log('db connected')

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
      return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, function (error, decoded) {
      if (error) {
        return res.status(403).send({ messages: 'Forbidden Access' })
      }
      req.decoded = decoded
      next()
    })
  }

// function for all rest api code here..............................................
async function run() {
    try {
        await client.connect(); 
        const productCollection = client.db('toolMerchant').collection('products')
        const userCollection = client.db('toolMerchant').collection('users')
        const orderCollection = client.db('toolMerchant').collection('orders')
        const profileCollection = client.db('toolMerchant').collection('profiles')

        //get product data from mongodb ...........
        app.get('/products', async(req, res)=>{
            const query = {}
            const result = await productCollection.find(query).toArray()
          
            res.send(result)
        })

        app.get('/products/:id', async(req, res)=>{
            const id = req.params.id
            // console.log(id)
            const query = {_id: ObjectId(id)}
            const result = await productCollection.findOne(query)
            res.send(result)
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            return res.send(result)
          })

          app.get('/order', async(req, res)=>{
            const userEmail = req.query.userEmail
            
            const query = {email: userEmail}
            const order = await orderCollection.find(query).toArray()
            res.send(order)
          })

app.put('/user/admin/:email', async(req, res)=>{
      const email = req.params.email 
      const filter = { email: email };
      const updateDoc = {
        $set: {role: 'admin'}
      };
      const result = await userCollection.updateOne(filter, updateDoc);  
      res.send(result)
    })

  //user data loading from db to ui dashboard..................
    app.get('/users', async (req, res) => {
      const users = await userCollection.find().toArray()
     
      res.send(users)
    })

     //user is admin or not, checking rest api............................
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })

  // only admin can make admin user ....................................
  app.put('/user/admin/:email', async (req, res) => {
    const email = req.params.email
    // const requester = req.decoded.email
    const requesterAccount = await userCollection.findOne({ email: email })
    const filter = { email: email };
    const updateDoc = {
      $set: { role: 'admin' }
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result)

    // if (requesterAccount.role === 'admin') {
    //   const filter = { email: email };
    //   const updateDoc = {
    //     $set: { role: 'admin' }
    //   };
    //   const result = await userCollection.updateOne(filter, updateDoc);
    //   res.send(result)
    // } else {
    //   res.status(403).send({ messages: 'Forbidden Access' })
    // }
  })


// rest api for insert new user or update user info when they will login or sign Up from UI.........
    app.put('/user/:email', async (req, res) => {
        const email = req.params.email
        console.log(email)
        const filter = { email: email };
        const user = req.body
        const options = { upsert: true };
        const updateDoc = {
          $set: user
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' })
        res.send({ result, token })

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