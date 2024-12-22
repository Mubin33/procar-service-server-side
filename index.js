require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");

app.use(cors());
app.use(express.json());

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
  