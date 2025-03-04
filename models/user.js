const mongoose = require('mongoose');
const uri = {{ secrets.MONGODB_URI }};
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    ;
  }
}
run().catch(console.dir);


const userSchema = mongoose.Schema({
    username: String,
    name: String,
    password: String,
    tasks: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "task"
        }
    ]
})

module.exports = mongoose.model("user", userSchema);