const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema({
    senderId :{
        type:mongoose.Schema.ObjectId,
        ref:"User"
    },
    receiverId :{
        type:mongoose.Schema.ObjectId,
        ref:"User"
    },
    message:{
        type: String,
        required:true
    },
    iv:{
        type: String,
        required:true
    }
},
{timestamps: true});

module.exports = mongoose.model("Chat",chatSchema);