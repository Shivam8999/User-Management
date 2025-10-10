const {Schema, model}= require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2');

const sessionSchema= new Schema({
    userId: {
        type: String,
        required: true
    },
    sessionId:{
        type: String,
        required:true
    },
    refreshToken: {
        type: String,
        required: true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    isDeleted:{
        type:Boolean,
        default:false,
    },
    platform:{
        type:String
    },
    loginIP:{
        type:String
    },
    createdAt: {
        type: Date,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
})

sessionSchema.plugin(mongoosePaginate)

const sessionmodel = model("usersessions", sessionSchema)
module.exports= sessionmodel