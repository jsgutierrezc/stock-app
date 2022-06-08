const { json } = require('express')
const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config()

const app = express()

mongoose
    .connect(
        `mongodb+srv://jsgutierrezc:${process.env.MONGO_DB_PASS}@webdevelopment.va1ay.mongodb.net/stock-app?retryWrites=true&w=majority`
    )
    .then((result) => {
        app.listen(PORT, () => {
            console.log('servidor escuchando en puerto ' + PORT)
        })
        console.log('conexión exitosa con la base de datos')
    })
    .catch((err) => console.log(err))

const productSchema = mongoose.Schema(
    {
    name: { type:String, required: true},
    price:Number,
    },
    { timestamps: true}
)

const Product = mongoose.model('Product', productSchema, 'Products')

/*app.get('/', (req, res, next) => {
    console.log('Petición recibida')

    next()
})*/

app.use(express.json())

app.post('/api/v1/products', (req, res, next) => {
    
    const newProduct = new Product(req.body)
    newProduct
        .save()
        .then((result) => {
            res.status(201).json({ ok:true})
        })
        .catch((err) => console.log(err))    
})

app.use(express.static(path.join(__dirname,'public')))

const PORT = process.env.PORT



