const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/")
.then(() =>{
    console.log("conncted");
})
.catch(() => {
    console.log("failed");
})

const newSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const collection = mongoose.model("collection",  newSchema)

module.exports = collection