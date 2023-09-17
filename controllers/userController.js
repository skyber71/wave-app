require("dotenv").config();
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const algorithm = process.env.ALGORITHM;
const iv = crypto.randomBytes(16);


const registerLoad = async(req,res)=>{
    try {
        res.render("register");
        
    } catch (error) {
        console.log(error.message);   
    }
}

const register = async(req,res)=>{
    try {
        const passwordHash  = await  bcrypt.hash(req.body.password, 10);
        const initial = req.body.username.charAt(0).toUpperCase();
        const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        const length = 10;
        let result = '';
        const charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        const user = new User ({
            username:req.body.username,
            password: passwordHash,
            image: "../public/images/" + initial + ".jpg",
            key: result
        });
        await user.save();
        res.render("register",{message:"You have been registerd successfully!"});
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req,res)=>{
    try {
        if(req.session.user){
            res.redirect("/dashboard");
        }else{
            res.render("login");
        }
    } catch (error) {
        console.log(error.message);
    }
}

const login = async (req,res)=>{
    try {
        const username = req.body.username;
        const password = req.body.password;
        const userData = await User.findOne({username:username});
        if (userData) {
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                req.session.user = userData;
                res.redirect("/dashboard");
            }
            else{
                res.render("login",{message:"Invalid Credentials"});
            }
        } else {
            res.render("login",{message:"Invalid Credentials"});
            
        }
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req,res)=>{
    try {
        if(!req.session.user){
            res.redirect("/");
        }
        req.session.destroy();
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async (req,res)=>{
    try {
        if(req.session.user){
            var users  = await User.find({ _id:{$nin:[req.session.user._id]}});
            res.render("dashboard",{user:req.session.user, users:users})
        }else{
            res.redirect("/");
        }
    } catch (error) {
        console.log(error.message);
    }
}


const saveChat = async (req,res)=>{
    try {
        const senderData = await User.findOne({_id: req.body.senderId});
        const receiverData = await User.findOne({_id: req.body.receiverId});
        const senderKey = senderData.key;
        const receiverKey = receiverData.key;
        let publicKey = process.env.KEY;
        let key;
        if(senderKey > receiverKey){
            key = senderKey + receiverKey + publicKey;
        }else{
            key = receiverKey + senderKey + publicKey;
        }
        const cipher = crypto.createCipheriv(algorithm,key,iv);
        let encryptedData = cipher.update(req.body.message,"utf-8","hex");
        encryptedData += cipher.final("hex");
        const base64data = Buffer.from(iv,"binary").toString("base64");
        var chat = new Chat({
            senderId: req.body.senderId,
            receiverId : req.body.receiverId,
            message: encryptedData,
            iv:base64data
        });
        var newChat = await chat.save();
        const originalIV = Buffer.from(newChat.iv, "base64");
        const decipher = crypto.createDecipheriv(algorithm,key,originalIV);
        let decryptedData = decipher.update(newChat.message,"hex","utf-8");
        decryptedData += decipher.final("utf-8");
        newChat["message"] = decryptedData;
        res.status(200).send({success:true, msg:"Chat Inserted",data:newChat});
        
    } catch (error) {
        res.status(400).send({success:false, msg:error.message});
        
    }
}



module.exports = {
    register,
    registerLoad,
    loadDashboard,
    loadLogin,
    login,
    logout,
    saveChat,
}