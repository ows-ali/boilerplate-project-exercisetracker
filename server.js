const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
var dateFormat = require('dateformat');



mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

var userSchema  = mongoose.Schema({
	username: String,
	created: {type: Date, default: Date.now}
	
});

var User = mongoose.model("User",userSchema);

var exerciseSchema  = mongoose.Schema({
	userId: mongoose.Schema.Types.ObjectId,
	username: String,
	
	description: String,
	duration: Number,
	date: {type: Date, required:true},
	created: {type: Date, default: Date.now}
	
});

var Exercise = mongoose.model("Exercise",exerciseSchema);


app.post('/api/exercise/new-user',function(req,res){
	test="";
	var userBody = (req.body.username);
	if (userBody ==  "" )
	{
		res.send("Path `username` is required.");
	}
	else
	{
		User.findOne({"username":userBody}).exec((err,userOld)=>{
		
			if (!userOld)
			{
				console.log("in error");

					var user = new User({
						username : userBody
					});
					
					user.save((err,newUser)=>{
						if (err)
						{
							res.send('Something went wrong');
						}
						else
						{
							res.json({"username":newUser['username'],"_id":newUser['_id']});
						}
					});

			}
			else
			{
				
				res.send("username already taken");
			//	res.json({"is old":"1","username":userOld['username'],"_id":userOld['_id']});
			
			}
		});
	}
});


app.post('/api/exercise/add',(req,res)=>{


	if (!req.body.userId)
	{
		res.send('unknown _id')
	}
	else if(req.body.userId)
	{
		User.findOne({"_id":req.body.userId}).exec( (err,userExist)=>{
			if (!userExist)
			{
				res.send('unknown _id');
			}
			else{
			
				if (!req.body.duration)
				{
					res.send('Path `duration` is required.');
				}
				else if(isNaN(req.body.duration)){
					res.send('Cast to Number failed for value \"' + req.body.duration + '\" at path "duration"');
				}
				else if(!req.body.description)
				{
					res.send('Path `description` is required.');
				}
				else{
					req.body.username = userExist.username;
					console.log('eeer');
					if (req.body.date)
					{
						if (1){//moment(req.body.date, "YYYY-MM-DD").isValid()){
							console.log('eee');
							req.body.date = new Date(req.body.date);//'2011-11-11';//Date.now;
						}
						else
						{
						
						}
					}
					else{
						req.body.date = new Date();//Date.now
					}
					var exercise = new Exercise(req.body);
					exercise.save((err,exerSaved)=>{
						if (err)
						{
							res.json(err);
						}
						else{
							var dateShow = dateFormat(req.body.date, "ddd mmm dd yyyy");

							res.json({"_id":exerSaved['_id'],"username":exerSaved['username'],"description":exerSaved['description'],"duration":exerSaved['duration'],"date":dateShow });
						}
					
					});
					
				}
				
			
			}
			
			
		});
	
	
	}

});

app.get('/api/exercise/log/',(req,res)=>{


	var query = require('url').parse(req.url,true).query;

	if ("" == req.query.userId)
	{
		res.send('unknown userIdss');
	}
	else
	{

		var queryy = {
			userId: req.query.userId,
		};
		if (req.query.from || req.query.to)
			queryy['date']=new Object();

		if (req.query.from!=null ) {
		
			queryy['date']['$gt'] = req.query.from;
		}
		
		if (req.query.to!=null ) {
			queryy['date']['$lt'] = req.query.to;// {$lt:req.query.to};//new Date(req.query.to);
		}

		var exerQuery = Exercise.find(queryy);
	
		
		if (req.query.limit)
			exerQuery.limit(parseInt(req.query.limit))
		exerQuery
		.exec((err,exers)=>{
			if (err)
			{
				res.send(err);
			}
			else{
				log = [];
				
				exers.forEach(function( exer){
					newLog = new Object();
					newLog.description=exer['description'];
					newLog.duration = exer['duration'];
					var dateShow = dateFormat(exer['date'], "ddd mmm dd yyyy");

					newLog.date=dateShow;
					log.push((  newLog));
				});
				

				res.json({"id":exers[0].userId, "username":exers[0].username, "count":exers.length, "log":JSON.parse(JSON.stringify(log))  });
			}
		
		});
	
	}

});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
