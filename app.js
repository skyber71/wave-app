require("dotenv").config();
const mongoose  = require("mongoose");
const app = require("express")();
const http = require("http").Server(app);
mongoose.connect(process.env.MONGO_URL);
const User  = require("./models/userModel")
const userRoute = require("./routes/userRoute")
app.use("/",userRoute);
const Chat = require("./models/chatModel");
const crypto = require("crypto");
const algorithm = process.env.ALGORITHM;

const io = require("socket.io")(http);
var usp = io.of("/user-namespace");
usp.on("connection",async (socket)=>{
    var userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id:userId},{$set:{ is_online:'1'}});
    socket.broadcast.emit("getOnlineUser",{user_id:userId});

    socket.on("disconnect",async ()=>{
        var userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({_id:userId},{$set:{ is_online:'0'}});
        socket.broadcast.emit("getOfflineUser",{user_id:userId});
    });

    socket.on("newChat",(data)=>{
        socket.broadcast.emit("loadNewChat", {receiverId:data.receiverId, senderId:data.senderId, message:data.message, createdAt:data.createdAt});
    });

    socket.on("existsChat", async (data)=>{
        var chats  = await Chat.find({ $or:[
            {senderId: data.senderId,receiverId: data.receiverId},
            {senderId: data.receiverId,receiverId: data.senderId},
        ]});
        const senderData = await User.findOne({_id: data.senderId});
        const receiverData = await User.findOne({_id: data.receiverId});
        const senderKey = senderData.key;
        const receiverKey = receiverData.key;
        let publicKey = process.env.KEY;
        let key;
        if(senderKey > receiverKey){
            key = senderKey + receiverKey + publicKey;
        }else{
            key = receiverKey + senderKey + publicKey;
        }
        for(let i = 0;i<chats.length;i++){
            const originalIV = Buffer.from(chats[i]["iv"], "base64");
            const decipher = crypto.createDecipheriv(algorithm,key,originalIV);
            let decryptedData = decipher.update(chats[i]["message"],"hex","utf-8");
            decryptedData += decipher.final("utf-8");
            chats[i]["message"] = decryptedData;
        }
        socket.emit("loadChat",{chats :chats});
    })
    socket.on("existsChat", async(data)=>{
        var receiverUser = await User.findOne({_id: data.receiverId});
        socket.emit("loadReceiver",{receiverUser: receiverUser});
    })
});
http.listen(3000)