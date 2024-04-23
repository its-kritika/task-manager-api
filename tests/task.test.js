const request = require('supertest')
const Task = require('../src/models/task')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, userTwo, taskOne, setupDatabase} = require('./fixtures/db')

beforeEach( setupDatabase )

test('Should create task for user', async () => {
    const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        description : 'Dusting'
    })
    .expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('Should fetch tasks for users', async () => {
    //response contains list of all the tasks of userOne
    const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
    
    expect(response.body.length).toEqual(2)
})

test('Should not delete tasks by other users', async() => {
    await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404)

    // Assert taskOne is still present in database
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})