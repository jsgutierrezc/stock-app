const express = require('express')

const app = express()

app.get('/', (req, res) => {
    console.log('Petición recibida')

    res.send('<h1>Hola mundo con NODEMON!</h1>')
}
)

app.listen(4000, () => {

    console.log('servidor escuchando en puerto 4000')

})
