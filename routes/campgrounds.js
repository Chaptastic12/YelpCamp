const express = require("express");
const router = express.Router();
const Campground = require("../models/campground"),
	  Comment    = require("../models/comments"),
	  middleware = require("../middleware"), //automatically requires the index.js if nothing else is specified
	  Review 	 = require("../models/review");

//===========================
// CAMPGROUND ROUTES
//===========================

//INDEX - Show our web page that will list out all of the campgrounds
router.get("/", function(req, res){
	const perPage = 8; // Max number of items per page
	const pageQuery = parseInt(req.query.page); 
	let pageNumber = pageQuery ? pageQuery : 1; //Current page number
	//Get all campgrounds from DB
	Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allCampgrounds){ //.skip is skipping the campgrounds we don't need to see. .limit sets the max to output at 8
		Campground.countDocuments().exec(function(err, count){ //count how manmy campgrounds we have
			if(err){
				console.log(err)
			} else {
				res.render("campgrounds/index", {campgrounds: allCampgrounds, current: pageNumber, pages: Math.ceil(count / perPage), page: 'campgrounds'});
			}
		});
	});
});

//CREATE - Create our POST request that will allow a user to enter in new campgrounds
router.post("/", middleware.isLoggedIn, function(req,res){ //this is RESTful routing, as we are posting to the page that would also get the data
	//get data from form and add to the campgrounds array
	let name = req.body.name;
	let image = req.body.image;
	let description = req.body.description;
	let cost = req.body.cost;
	let author = { 
		id: req.user._id,
		username: req.user.username
	};
	let newCampground = {name: name, image: image, description: description, author: author, cost: cost};
	//Create a new campground and push to DB
	Campground.create(newCampground, function(err, newlyCreated){
		if(err){
			console.log(err);
		} else{
			//redirect back to the campgrounds page
			res.redirect("/campgrounds");
		}
	});
	//campgrounds.push(newCampground); => depreciated now that we are using DBs
	
});

//NEW - Show our webpage that will use a form to utilize our POST request to add new campgrounds
router.get("/new", middleware.isLoggedIn, function(req,res){
	res.render("campgrounds/new");
});

//SHOW - give information about one campground with specified ID
router.get("/:id", function(req, res){
	//find the campground with provided id
	Campground.findById(req.params.id).populate("comments").populate({path: "reviews", options: {sort: {createdAt: -1}}}).exec(function(err, foundCampground){
		if(err || !foundCampground){
			req.flash("error", "Sorry, that campground does not exist.");
			res.redirect("/campgrounds");
		} else{
			//render show template with that campground
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

//EDIT - allow you to edit the campgrounds only if you own that campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds")
		} else {
			res.render("campgrounds/edit", {campground: foundCampground});
		}	
	});
});

//UPDATE - allow you to push through the edits only if you own that campground
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	//Protect the rating from being overridden since we are passing it in via the campground object
	delete req.body.campground.rating;
	//find and update the correct campground
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
		if(err){
			req.flash("error", err.message);
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
	//redirect back to show page
});

//DESTROY - allow you to delete a campgrounds only if you own that campground
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndRemove(req.params.id, function(err, campgroundRemoved){
		if(err){
			res.redirect("/campgrounds");
		} else {
			//Delete all comments associated with the campground
			Comment.remove({_id: {$in: campgroundRemoved.comments}}, function(err){ // use $in to find all comments and reviews with a matching id in the campground.comments and campground.reviews objects
				if(err){
					console.log(err);
				} 
				//Delete all reviews associated with the campground
				Review.remove({_id: {$in: campgroundRemoved.reviews}}, function(err){
					if(err){
						console.log(err);
					}
					//delete the campground
					campground.remove();
					req.flash("success", "Campground deleted successfully.");
					res.redirect("/campgrounds");
				});
			});
		}
	});
});


module.exports = router;