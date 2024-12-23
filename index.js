require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParse = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express(); 
const port = process.env.PORT || 5000;
const cors = require("cors");

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParse())

const verifyToken = (req, res, next)=>{
  const token = req?.cookies?.token
  if(!token){
    return res.status(401).send({massage:"Unauthorize"})
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({massage:"Unauthorize"})
    }
    req.user = decoded
    next()
  })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nqyrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



async function run() {
    try {
      const serviceCollection = client.db("services").collection("service");
      const bookedCollection = client.db("services").collection("booked");


      app.post('/jwt', async(req, res)=>{
        const user = req.body
        const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '10h'})
        res
        .cookie('token', token,{
          httpOnly:true,
          secure: false
        })
        .send({success: true})
      })
      app.post('/logout', (req, res)=>{
        res
        .clearCookie('token',{
          httpOnly:true,
          secure:false
        })
        .send({success:true})
      })

      // service
      app.get('/service', async(req, res)=>{
        const email = req.query.email; 
        let query = email ? { hr_email: email } : {} ; 
        const cursor = serviceCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
      })
      app.get("/service/:id", async (req, res) => {
        let id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await serviceCollection.findOne(query);
        res.send(result);
      });
      app.post('/service', async(req, res)=>{
        let service = req.body
        console.log(service)
        let result = await serviceCollection.insertOne(service)
        res.send(result)
      })
      app.delete('/service/:id', async(req, res)=>{
        let id = req.params.id;
      console.log("delete", id);
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
      })


      // booked
      app.get('/booked', async(req, res)=>{
        const cursor = bookedCollection.find()
        const result = await cursor.toArray()
        res.send(result)
      }) 
      app.post('/booked', async(req, res)=>{
        let booked = req.body
        console.log(booked)
        let result = await bookedCollection.insertOne(booked)
        res.send(result)
      })
  
  
      // await client.connect();
      // await client.db("admin").command({ ping: 1 });
      console.log(
        "Pinged your deployment. You successfully connected to MongoDB!"
      );
    } finally {
      // await client.close();
    }
  }
  run().catch(console.dir);
  
  app.get("/", (req, res) => {
    res.send("Hello World!");
  });
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  