const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL);

const UserSchema = new Schema({
  username: String // Fix typo here
});

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create({ username: req.body.username });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating user."); // Send error response
  }
});

app.get("/api/users", async (req, res)=>{
  const users = await User.find({}).select("_id username");
  if(!users){
    res.send("No users");
  }else{
    res.json(users);
  }
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' }); // Send JSON error response
    } else {
      const exercise = await Exercise.create({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });
      res.json({
        "_id": user._id,
        "username": user.username,
        "description": exercise.description,
        "duration": exercise.duration,
        "date": exercise.date.toDateString()
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving exercise."); // Send error response
  }
});

app.get("/api/users/:_id/logs", async (req, res)=>{
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    res.send("No user found");
    return;
  }else{
    let dateObj = {};
    if(from){
      dateObj["$gte"]= new Date(from);
    }
    if(to){
      dateObj["$lte"]= new Date(to);
    }
    let filter = {
      user_id: user._id,
    }
    if(from || to){
      filter.date = dateObj;
    }
    const exercises = await Exercise.find(filter).limit(+limit ?? 100);
    
    const log = exercises.map(e=> (
      {
        "description": e.description,
        "duration": e.duration,
        "date": e.date.toDateString()
      }
    ))
    
    res.json({
      "username": user.username,
      "count": exercises.length,
      "log": log
    })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});