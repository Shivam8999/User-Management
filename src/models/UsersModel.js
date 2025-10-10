const mongoose= require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2');

const {Schema, model}= mongoose

const userSchema= new Schema({
    Name: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true,
        unique: true
    },
    Phone: {
        type: String,
    },
    Address: {
        type: String 
    },
    Password: {
        type: String,
        required: true
    },
    Role: {
        type: String,
        required: true,
        enum: ["USER", "ADMIN"],
        default: "USER"
    },
    accessGroups:{
        type:String,
        default:""
    },
    isVerified:{
        type:Boolean,
        required:true,
        default:false
    },
    status: { //1 active, 2-block
        type: Number,
        required: true,
        enum: [1,2],
        default: 1
    },
    otp:{
        type: String,
        default: " "
    },
    otpGeneratedAt: {
        type: Date 
    },
    otpExpiresAt:{
        type: Date
    }
})


userSchema.plugin(mongoosePaginate)

const Users= model("users", userSchema)
Users.syncIndexes()
module.exports= Users
