const { model, Schema} = require('mongoose')

const UserSchema = new Schema({
    username: String,
    password: String,
    email   : String,
    createdAt: String,
    active : String,
    connects: []
});

module.exports = model('User', UserSchema)