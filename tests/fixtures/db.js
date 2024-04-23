const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id : userOneId,
    name : 'Armaan',
    email: 'armaan@example.com',
    password: 'armaanpass56',
    tokens : [{
        token : jwt.sign({ _id : userOneId}, process.env.JWT_SECRET_KEY)
    }]
}

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
    _id : userTwoId,
    name : 'Mehek',
    email: 'mehek8@example.com',
    password: 'mehekpass65',
    tokens : [{
        token : jwt.sign({ _id : userTwoId}, process.env.JWT_SECRET_KEY)
    }]
}

const taskOne = {
    _id : new mongoose.Types.ObjectId(),
    description : 'Clean utensils',
    completed : false,
    owner : userOneId
}

const taskTwo = {
    _id : new mongoose.Types.ObjectId(),
    description : 'Cleaning room',
    completed : true,
    owner : userOneId
}

const taskThree = {
    _id : new mongoose.Types.ObjectId(),
    description : 'Arranging shelf',
    completed : true,
    owner : userTwoId
}

const setupDatabase = async () => {
    await User.deleteMany()
    await Task.deleteMany()
    await new User(userOne).save()
    await new User(userTwo).save()
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

afterAll(() => {
    mongoose.connection.close();
}) 

module.exports = {
    userOneId,
    userOne,
    userTwo,
    taskOne,
    setupDatabase,
}