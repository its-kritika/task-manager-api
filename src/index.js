//changes in index file and app file are made for testing purposes
const app = require('./app')

const port = process.env.PORT

app.listen(3000, () => {
    console.log('Server has started functioning at port '+port)
})
