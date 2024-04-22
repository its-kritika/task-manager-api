const express = require('express')
require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT
// app.use( (req, res, next) => {
//     if (req.method === 'GET'){
//         res.send('Get requests are disabled!')
//     }else{
//         next()
//     }
// })

// app.use( (req, res, next) => {
//     res.status(501).send('Site under maintenance!')
// })


//configuring express to parse incoming json ( from Postman ), so that it becomes accessible to us in the form of objects
//'express.json()' is used to parse json into object so that we can access it in 'req' handler below as 'req.body'
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)


app.listen(3000, () => {
    console.log('Server has started functioning!'+port)
})
