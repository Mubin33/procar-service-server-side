require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParse = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express(); 
const port = process.env.PORT || 5000;
const cors = require("cors");

app.use(cors({
  origin:['http://localhost:5173','https://assignment11-51e35.web.app', 'https://serviceprojectbymubinb10a11.surge.sh'],
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
          secure: process.env.NODE_ENV === 'production', 
          sameSite: process.env.NODE_ENV === 'production' ? "none" : "strict",
        })
        .send({success: true})
      })
      app.post('/logout', (req, res)=>{
        res
        .clearCookie('token',{
          httpOnly:true,
          secure:process.env.NODE_ENV === 'production', 
          sameSite: process.env.NODE_ENV === 'production' ? "none" : "strict",
        })
        .send({success:true})
      })




      // service2
      app.get('/service2', async (req, res) => {
        try {
            const { email, searchParams } = req.query;
            let query = {}; 
            
            // Search functionality
            if (searchParams) {
                query.name = { $regex: searchParams, $options: 'i' }; // case-insensitive search
            }
    
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).send({ message: 'Internal Server Error', error });
        }
    });

      // service
      app.get('/service', verifyToken, async (req, res) => {
        try {
          const email = req.query.email; 
            let query = {};
            
            if (email) {
                query.hr_email = email;
            }
            
            if(req.user.email !== req.query.email){
              res.status(403).send({ message: 'forbidden access' });
          }
    
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).send({ message: 'Internal Server Error', error });
        }
    });
    
      app.get("/service/:id", async (req, res) => {
        let id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await serviceCollection.findOne(query);
        res.send(result);
      });
      app.post('/service', async (req, res) => {
        let service = req.body;
    
        try {
            // Insert the service into the "service" collection
            let result1 = await serviceCollection.insertOne(service);
    
            // Insert the same service into the "service2" collection
            let result2 = await client.db("services").collection("service2").insertOne(service);
    
            res.send({
                success: true,
                message: "Service added successfully to both databases.",
                result1,
                result2
            });
        } catch (error) {
            console.error('Error adding service:', error);
            res.status(500).send({ message: "Failed to add service to both databases.", error });
        }
    });
    
    app.put("/service/:id", async (req, res) => {
      const id = req.params.id;
      const service = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateService = {
          $set: {
              photo: service.uPhoto,
              name: service.uName,
              city: service.uCity,
              country: service.uCountry,
              price: service.uPrice,
              description: service.uDescription,
          },
      };
      const options = { upsert: true };
  
      try {
          // Update in the "service" collection
          const result1 = await serviceCollection.updateOne(filter, updateService, options);
  
          // Update in the "service2" collection
          const service2Collection = client.db("services").collection("service2");
          const result2 = await service2Collection.updateOne(filter, updateService, options);
  
          res.send({
              success: true,
              message: "Service updated successfully in both databases.",
              result1,
              result2,
          });
      } catch (error) {
          console.error("Error updating service:", error);
          res.status(500).send({
              success: false,
              message: "Failed to update service in both databases.",
              error,
          });
      }
  });
  
      app.delete("/service/:id", async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
    
        try {
            // Delete from the "service" collection
            const result1 = await serviceCollection.deleteOne(filter);
    
            // Delete from the "service2" collection
            const service2Collection = client.db("services").collection("service2");
            const result2 = await service2Collection.deleteOne(filter);
    
            if (result1.deletedCount > 0 && result2.deletedCount > 0) {
                res.send({
                    success: true,
                    message: "Service deleted successfully from both databases.",
                    result1,
                    result2,
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: "Service not found in one or both databases.",
                });
            }
        } catch (error) {
            console.error("Error deleting service:", error);
            res.status(500).send({
                success: false,
                message: "Failed to delete service from both databases.",
                error,
            });
        }
    });
    


      // booked
      app.get('/booked', verifyToken, async (req, res) => {
        const email = req.query.email; 
        const queryType = req.query.type; // Add a query parameter to specify the type of query
    
        if (!email) {
            return res.status(400).send({ message: 'Email is required.' });
        }
    
        // Check for forbidden access
        if (req.user.email !== email) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
    
        // Construct query based on type
        let query = {};
        if (queryType === 'bookedUser') {
            query = { bookedUserEmail: email };
        } else if (queryType === 'hr') {
            query = { hr_email: email };
        } else {
            return res.status(400).send({ message: 'Invalid query type.' });
        }
    
        try {
            const cursor = bookedCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });


    app.patch('/bid-status/:id', async(req, res)=>{
      const id = req.params.id
      const status = req.body
      const filter = {_id: new ObjectId(id)}
      const updated = {
        $set:{status: status.status},
      }
      const result = await bookedCollection.updateOne(filter, updated)
      res.send(result)
    })
     
    app.post('/booked', async (req, res) => {
      let booked = req.body;
      // 
      const query = { bookedUserEmail: booked.bookedUserEmail, serviceId: booked.serviceId };
      const alreadyExist = await bookedCollection.findOne(query);
      if (alreadyExist) return res.status(400).send({ message: 'You already bid booked this service' });
      // 
      let result = await bookedCollection.insertOne(booked);
  
      // Update `bid` count in `service` collection
      const filter = { _id: new ObjectId(booked.serviceId) };
      const update = {
          $inc: { bid: 1 }
      };
      const updateBidCount = await serviceCollection.updateOne(filter, update);
  
      // Update `bid` count in `service2` collection
      const service2Collection = client.db("services").collection("service2");
      const updateBidCount2 = await service2Collection.updateOne(filter, update);
  
      res.send({
          success: true,
          result,
          updateBidCount,
          updateBidCount2
      });
  });
  
  
  
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
  