const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    taskname: String,
    content: String,
    madeon: Date,
    dueby: Date

})

module.exports = mongoose.model("task", taskSchema);