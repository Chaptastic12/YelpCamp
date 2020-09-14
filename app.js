//Initialize the express, mongoose and body-parser packages
const express 	 	 = require("express"),
	  app 		 	 = express(),
	  mongoose	 	 = require("mongoose"),
	  bodyParser 	 = require("body-parser"),
	  Campground 	 = require("./models/campground"),
	  Comment	 	 = require("./models/comments"),
	  passport	 	 = require("passport"),
	  LocalStrategy  = require("passport-local"),
	  User			 = require("./models/user"),
	  methodOverride = require("method-override"),
	  flash			 = require("connect-flash");

//Initialize our routes
const commentRoutes 	= require("./routes/comments"),
	  campgroundRoutes  = require("./routes/campgrounds"),
	  indexRoutes 		= require("./routes/index"),
	  adminRoutes		= require("./routes/admin"),
	  reviewRoutes		= require("./routes/reviews");


//Initialize moment js to be used across all pages
app.locals.moment = require("moment");

//Gotta have this too
app.use(bodyParser.urlencoded({extended: true}));
//Serve the public directory
app.use(express.static(__dirname + "/public"));

//Set it so we no longer need the .ejs to our files
app.set("view engine", "ejs");

//Setup our DB and resolve depreciation errors
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(flash());

//Passport Configuration
app.use(require("express-session")({
	secret: process.env.PASSPORT_KEY,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//add currentUser to all our templates
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success= req.flash("success");
	next();
})

app.use(methodOverride("_method"));

//===========================
// ROUTES
//===========================

app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/admin", adminRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

const port = process.env.PORT || 3000;
app.listen(port, process.env.IP, function(){
	console.log("YelpCamp Server Has Started");
});