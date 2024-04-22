const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

//creating schema to take advantage of middleware ( for setting hash value for the password )
const userSchema = new mongoose.Schema({
    // these properties are fields of table 
    name : {
        type : String,
        //applying 'not null' constraint (as in Mysql) to name field
        required : true,
        trim : true
    },
    email : {
        type : String,
        unique : true,
        required : true,
        trim : true,
        lowercase : true,
        //setting validation for email using validator library that we installed, inside validate method 
        validate (value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid!')
            }
        }
    },
    password : {
        type : String,
        required : true,
        trim : true,
        validate(value) {
            if (value.length < 7) {
                throw new Error('Password should be atleast 7 characters long!')
            }
            else if (value.toLowerCase().includes('password')){
                throw new Error('Set a strong password!')
            }
        }
    },
    age : {
        type : Number,
        default : 10,
        //setting validation for age field without use of any library
        validate ( value ) {
            if (value < 0) {
                throw new Error('Age must be a positive number!')
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }],
    avatar : {
        type : Buffer   //allows us to store buffer with binary image data
    }
}, {
    timestamps : true //this sets the time field in the user model about when the user was created or updated
})

//in user model we are not creating an actual field for storing tasks rather a virtual field (for referencing) that helps mongoose
//to figure out relationship between task and user
userSchema.virtual('tasks', {
    //basically we are setting 'owner' field as foreign key which takes reference from primary key of user model, i.e, user id
    ref : 'Task',
    localField : '_id',  //it refers to user id in user model
    foreignField : 'owner' //it refers to user id in task model 
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

//creating token 
//methods keyword is used when we want to create methods on instance and individual user
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id : user._id.toString()}, process.env.JWT_SECRET_KEY)

    user.tokens = user.tokens.concat( {token})
    await user.save()

    return token
}

//user can login only with their credentials
//this statics keyword is used when we want to create methods on User model
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne( {email})
    if (!user){
        throw new Error('Unable to login!')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch){
        throw new Error('Unable to login!')
    }
    return user
}

//middleware provides 2 methods 'pre' and 'post' to execute some functions before or after given events occur
//below line means we want to do something before user is saved
userSchema.pre('save', async function (next){
    //'this' keyword gives access to individual user that are about to be saved
    const user = this
    //hashing password before user is saved
    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    
    //it is used just to tell the compiler that our above task is fulfilled, otherwise the function will hang (waiting infinitely)
    next()
})

//setting this here, because we want to delete user and just before deleting user record all tasks record should get deleted
//deleting user tasks when user is removed
userSchema.pre('deleteOne', { document : true }, async function (next){
    const user = this
    await Task.deleteMany( {owner : user._id})

    next()
})

//defining a model
const User = mongoose.model('User', userSchema)

module.exports = User