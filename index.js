const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const{ Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended : true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Define Schemas
const userSchema = new Schema({
  username: { type : String, required: true, unique: true }
})

const User = mongoose.model('User', userSchema)

const exerciseSchema = new Schema({
  user_id: { type : String, required: true },
  description: { type : String },
  duration: { type : Number},
  date: { type: Date }
})

const Exercise = mongoose.model('Exercise', exerciseSchema)

/*Creates a user. Takes a username, returns a json with username
and user id in. */
app.post('/api/users', async (req, res) => {
  

  user = await User.findOne({username : req.body.username })
  if(!user){
    new_userObj = new User({ username : req.body.username })
    user = await new_userObj.save()
    console.log('New user')
  }
  console.log(user)
  res.json(user)

});
  /* Creates an exercise log for a user
  (provided _id matches a user) */

  app.post('/api/users/:_id/exercises', async (req, res) =>{
    const id = req.params._id
    const{ description, duration, date} = req.body    
    foundUser = await User.findById(id)
    if(!foundUser){
      res.send('No user found.')
    }
    else{
      exerciseObj = new Exercise({ 
        user_id : id, 
        description,
        duration,
        date: date ? new Date(date) : new Date()
        })
      exercise = await exerciseObj.save()
      res.json({
        _id: id,
        username: foundUser.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()

      })
    }
  })

  app.get('/api/users', async (req,res)=>{
    const users = await User.find()
    res.json(users)
  })


  app.get('/api/users/:_id/logs', async (req,res)=>
  {
    const id = req.params._id
    const { from, to, limit } = req.query

    filter = { user_id: id }

    find_user = await User.findById(id)
    daterange = {}
    if( from ){
      daterange["$gte"] = new Date(from)
      filter.date = daterange
    }
    if( to ){
      daterange["$lte"] = new Date(to)
      filter.date = daterange
    }

    if(limit){
      query = await Exercise.find(filter).limit(limit)
    }
    else{
      query = await Exercise.find(filter)  
    }
    console.log(query)
    logs = query.map(q => ({ description:q.description, duration: q.duration, date:q.date.toDateString() }))
    res.json({ username: find_user.usernam, count : logs.length, log: logs})
  })
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
