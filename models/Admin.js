const { model, Schema} = require('mongoose')

const AdminSchema = new Schema({
    username: String,
    password: String,
    email   : String,
    createdAt: String,
    admin  : String
});

module.exports = model('Admin', AdminSchema)