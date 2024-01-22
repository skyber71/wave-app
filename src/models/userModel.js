const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type:String,
        required: true
    },
    is_online:{
        type: String,
        default: '0'
    },
    image:{
        type: String,
        required: true
    },
    key:{
        type: String,
        required: true
    }
},
{timestamps: true});

module.exports = mongoose.model("User",userSchema);