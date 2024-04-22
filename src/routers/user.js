const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodByeEmail} = require('../emails/account')
const router = new express.Router()

//creating resource user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    //using async - await
    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)

        const token = await user.generateAuthToken()
        res.status(201).send({user, token})

    }catch(e) {
        res.status(400).send(e)
    }

    // user.save()
    // .then(() => {
    //     //by default status is 200 (OK) we can customise as in tasks route, we changed it to 201 (Created)
    //     res.send(user)
    // }).catch((e) => {
    //     //for http status like 400 : Bad request, 404 : Not found, etc
    //     res.status(400).send(e)
    // })
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        //we are generating token for a particular user and not for a collection of user (User)
        const token = await user.generateAuthToken()
        res.send({user, token})
    }catch(e){
        res.status(400).send(e)
    }
})

//for logout a user must be authorized
router.post('/users/logout', auth, async (req, res) => {
    try{
        //req.user.tokens is a collection of all the tokens valid currently, which are logged in from maybe phone, laptop, tab
        //we are filtering the tokens array such that it retains all other tokens except the current one so that even if our
        //logged out of one device say phone, other remains logged in
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()

    }catch(e){
        res.status(500).send()
    }
}) 

router.post('/users/logoutAll', auth, async(req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send(req.user)

    }catch(e){
        res.status(500).send()
    }
})

//2nd argument is the middleware, and executes an authentication code before returning list of users
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const isValidOperation = updates.every( (update) => allowedUpdates.includes(update))

    if (!isValidOperation){
        return res.status(400).send({ 'Error' : 'Invalid updates!'})
    }

    try{
        
        updates.forEach((update) => req.user[update] = req.body[update]) //req.body returns an object of mentioned changes by developer
        await req.user.save()
        res.send(req.user)
        
    }catch(e){
        res.status(400).send(e)
    }
    
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.deleteOne()
        sendGoodByeEmail(req.user.email, req.user.name)
        res.send(req.user)

    }catch(e) {
        res.status(500).send(e)
    }
    
})

const upload = multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter (req, file, cb){
        //using regular expression
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Only .jpg, .jpeg and .png files are supported!'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width : 250, height : 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()

}, (error, req, res, next) => {
    res.status(400).send({ error : error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-type', 'image/png')
        res.send(user.avatar)

    }catch(e){
        res.status(404).send()
    }
})


module.exports = router