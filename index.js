const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000



app.use(cors({
    origin: ['http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// verify jwt middleware

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token
    console.log('value of token in middieware', token)
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    jwt.verify(token, process.env.ACCRSS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: 'unauthorized access' })
        }
        console.log('value in the token', decoded)
        req.user = decoded
        next()
    })

}


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


        // .......................................................................

        app.get('/querie', async (req, res) => {
            const result = await shopSwiftlyproduct.find().sort({createAt: -1}).toArray();
            res.send(result)
        })




        app.get('/queries', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const filter = req.query.filter
            const sort = req.query.sort
            const search = req.query.search
            console.log('pagination query', req.query)

            let query = {
                productName: { $regex: String(search), $options: 'i' },
            }
            if (filter) query.queryTitle = filter
            let options = {}
            if (sort) options = { sort: { createAt: sort === 'asc' ? 1 : -1 } }
            const result = await shopSwiftlyproduct.find(query, options).skip(page * size).limit(size).toArray();
            res.send(result)
        })

        app.get('/queriesCount', async (req, res) => {
            const filter = req.query.filter
            const search = req.query.search
            let query = {
                productName: { $regex: String(search) , $options: 'i' },
            }
            if (filter) query.queryTitle = filter
            // const count = await shopSwiftlyproduct.estimatedDocumentCount(query);
            const count = await shopSwiftlyproduct.countDocuments(query);
            res.send({ count })
        })

        // Get a single  data
        app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await shopSwiftlyproduct.findOne(query)
            res.send(result);
        })
        // ..........................................
        app.get("/myQueries", verifyToken, async (req, res) => {
            // console.log(req.params.email);
            console.log(req.query.email)
            console.log('user in the valid token', req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            let query = {};

            if (req.query.email) {
                query = { "userInfo.email": req.query.email }
                console.log(query)
            }
            const result = await shopSwiftlyproduct.find(query).sort({createAt: -1}).toArray();
            res.send(result)

        })

        app.post('/addQueries', async (req, res) => {
            const querie = req.body;
            console.log('querie', querie)
            const result = await shopSwiftlyproduct.insertOne(querie)
            res.send(result);
        })

        app.put('/updateQueries/:id', async (req, res) => {
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
                    lastUpdate: querie.lastUpdate,
                    recommendationCount: querie.recommendationCount,

                }
            };
            const result = await shopSwiftlyproduct.updateOne(filter, updatequerie, options);
            console.log(querie)
            res.send(result);
        })
        app.put('/updaterecommen/:id', async (req, res) => {
            const id = req.params.id;
            const querie = req.body;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatequerie = {
                $set: {
                    recommendationCount: querie.recommendationCount,
                }
            };
            const result = await shopSwiftlyproduct.updateOne(filter, updatequerie, options);
            console.log(querie)
            res.send(result);
        })


        app.delete('/myQueries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await shopSwiftlyproduct.deleteOne(query)
            res.send(result);
            console.log('delete', id)
        })

        // .......................................................................


        app.get('/recommendation', async (req, res) => {
            const result = await shopSwiftlyrecommendation.find().toArray();
            res.send(result)
        })


        app.get("/myRecommendation", verifyToken, async (req, res) => {

            console.log(req.query.email)
            console.log('user in the valid token', req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            
            let query = {};

            if (req.query.email) {
                query = { "reuserInfo.reEmail": req.query.email }
                console.log(query)
            }
            const result = await shopSwiftlyrecommendation.find(query).toArray();
            res.send(result)

        })

        // ....................................................

        app.post('/addRecommendation', async (req, res) => {
            const querie = req.body;
            console.log('querie', querie)
            const result = await shopSwiftlyrecommendation.insertOne(querie)
            res.send(result);
        })

        app.delete('/recommendation/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await shopSwiftlyrecommendation.deleteOne(query)
            res.send(result);
            console.log('delete', id)
        })

        // .......................................................................
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCRSS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
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