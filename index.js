const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000



app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.jgwprpb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const shopSwiftlyproduct = client.db("shopSwiftly").collection("queries")
        const shopSwiftlyUsers = client.db("shopSwiftly").collection("users")
        const shopSwiftlyrecommendation = client.db("shopSwiftly").collection("recommendation")

        app.get('/queries', async (req, res) => {
            const result = await shopSwiftlyproduct.find().toArray();
            res.send(result)
          })

          app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await shopSwiftlyproduct.findOne(query)
            res.send(result);
        })

          app.get('/myQueries', async (req, res) => {
            console.log(req.query.email)
            console.log('user in the valid token', req.user)
            if(req.query.email !== req.user.email){
              return res.status(403).send({message: 'forbidden access'})
            }
            let query = {};
            if (req.query?.email) {
              query = { email: req.query.email }
            }
            const result = await shopSwiftlyproduct.find(query).toArray();
            res.send(result)
          })

          app.post('/addQueries', async (req, res) => {
            const querie = req.body;
            console.log('querie', querie)
            const result = await shopSwiftlyproduct.insertOne(querie)
            res.send(result);
        })

        app.put('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const querie = req.body;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatequerie = {
                $set: {
                    
                    image: querie.image,
                    queryTitle: querie.queryTitle,
                    productName: querie.productName,
                    brandName: querie.brandName,
                    boycotReason: querie.boycotReason,
                    update_posted: querie.update_posted,
                   
                }
            };
            const result = await shopSwiftlyproduct.updateOne(filter, updatequerie, options);
            console.log(craf)
            res.send(result);
        })


          app.delete('/myQueries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await shopSwiftlyproduct.deleteOne(query)
            res.send(result);
            console.log('delete', id)
          })

          app.post('/addRecommendation', async (req, res) => {
            const querie = req.body;
            console.log('querie', querie)
            const result = await shopSwiftlyrecommendation.insertOne(querie)
            res.send(result);
        })




        app.post('/jwt', async (req, res) =>{
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCRSS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict'
            }).send({ success: true })
        })
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        app.get('/users', async (req, res) => {
            const carsor = shopSwiftlyUsers.find();
            const result = await carsor.toArray();
            res.send(result)
        })
        app.post('/user', async (req, res) => {
            const user = req.body
            console.log('new user', user);
            const result = await shopSwiftlyUsers.insertOne(user);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})