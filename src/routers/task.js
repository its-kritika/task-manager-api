const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,   //copy all the task details given by user
        //it links task with the owner
        owner : req.user._id   //it will allow us to include user id who created the task
    })

    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }

})

// GET /tasks?completed=true 
// GET /tasks?limit=10&skip=0  --> Pagination (skip allows us to skip the given number of tasks and fetch tasks after that)
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {

    try{
        const match = {}
        const sort = {}

        if (req.query.completed){
    //we are fetching tasks based on query in url, either completed = true tasks or false or all tasks in case nothing is provided
        //req.query --> gives url condition entered by user
        //match takes boolean value but 'req.query.completed' returns string value hence below condition is used
            match.completed = req.query.completed === 'true'

        }

        if (req.query.sortBy){
            const parts = req.query.sortBy.split(':') //returns an array [createdAt, desc] (for above example url)
            //sort object takes only 2 values, options : { sort : { createdAt : -1 or 1} } ( 1 for asc and -1 for desc )
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }

        //here populate is used to find all the tasks from 'tasks field' (present virtually in user model) of user
        await req.user.populate({
            path : 'tasks',     //return all tasks of the authorized user (user who is currently logged in)
            match ,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            }
        })  
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(e)
    }

})

router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id

    try{
        const task = await Task.findOne({_id, owner : req.user._id})
        if (!task){
            res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
  
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation){
        return res.status(400).send({'Error': 'Invalid updates!'})
    }
    try{
        const task = await Task.findOne({ _id : req.params.id, owner : req.user})

        if (!task){
            return res.status(404).send()
        }
        
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner : req.user._id})

        if (!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e) {
        res.status(500).send()
    }
})

module.exports = router