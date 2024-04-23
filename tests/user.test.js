const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')

beforeEach( setupDatabase )


test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name : 'Kritika',
        email : 'mymail@example.com',
        password: '12345678'
    }).expect(201)

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user : {
            name : 'Kritika',
            email : 'mymail@example.com'
        },
        token : user.tokens[0].token
    })

    //Assertion about user password
    expect(user.password).not.toBe('12345678')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email : userOne.email,
        password : userOne.password
    }).expect(200)

    // Assertion that token in response matches users second token
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login non-existent user', async () => {
    await request(app).post('/users/login').send({
        email : userOne.email,
        password : 'thisisnotmypass'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    // Assert null response for deleted user
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200)

    const user = await User.findById(userOneId)
  //we used toEqual and not toBe here bcoz in js {} === {} returns false, toBe uses === operator which results in failed test cases
    expect(user.avatar).toEqual(expect.any(Buffer)) //expect.any(Buffer) checks if type of data stored in avatar field is Buffer
})

test('Should update valid user fields', async () => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        name : 'Armaan Malik'
    })
    .expect(200)

    const user = await User.findById(userOneId)
    expect(user.name).toBe('Armaan Malik')
})

test('Should not update invalid user fields', async() => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        location : 'Delhi'
    })
    .expect(400)
})