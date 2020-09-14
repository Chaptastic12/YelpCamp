let express = require("express"),
	router = express.Router({mergeParams: true}),
	Campground = require("../models/campground"),
	Review = require("../models/review"),
	middleware = require("../middleware");

//INDEX - reviews index
router.get("/", function(req, res){
	Campground.findById(req.params.id).populate({
		path: "reviews",
		options: {sort: {createdAt: -1}} //show the latest first
	}).exec(function(err, campground){
		if(err || !campground){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		res.render("reviews/index", {campground: campground});
	});
});

//NEW - Create a new review for the campground
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res){
	//middleware.checkReviewExistence will see if the User has already left a review or not. If so, they cannot leave another
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			req.flash("error", err.message);
		}
		res.render("reviews/new", {campground: campground})
	});
});

//CREATE - Create a new review with the info from the submitted form from the above router.get
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res){
	//look up the campground using the ID
	Campground.findById(req.params.id).populate("reviews").exec(function(err, campground){ //find the campground with specified ID, populate its 'reviews' parameter
		if(err){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		Review.create(req.body.review, function(err, review){
			if(err){
				req.flash("error", err.message);
				return res.redirect("back");
			}
			//add author username and id associated with the campground review
			review.author.id = req.user._id;
			review.author.username = req.user.username;
			review.campground = campground;
			//save the info
			review.save();
			campground.reviews.push(review);
			//calculate the new average
			campground.rating = calculateAverage(campground.reviews);
			//save the new average
			campground.save();
			console.log(campground.rating);
			req.flash("success", "Your review has been successfully added.");
			res.redirect("/campgrounds/" + campground._id);
		});
	});
});

//EDIT - Edit your review
router.get("/:review_id/edit", middleware.checkReviewOwnership, function(req, res){
	Review.findById(req.params.review_id, function(err, foundReview){
		if(err){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		res.render("reviews/edit", {campground_id: req.params.id, review: foundReview});
	});
});

//UPDATE - Update the review from form info the above router.get route
router.put("/:review_id", middleware.checkReviewOwnership, function(req, res){
	Review.findById(req.params.review_id, req.body.review, {new: true}, function(err, updateReview){
		if(err){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		Campground.findById(req.params.id).populate("reviews").exec(function(err, campground){
			if(err){
			req.flash("error", err.message);
			return res.redirect("back");
			}
			//calculate campground average
			campground.rating = calculateAverage(campground.reviews);
			//Save the new average
			campground.save();
			req.flash("success", "Your review was successfully updated");
			res.redirect("/campgrounds/" + campground._id);
		});
	});
});

//DELETE - Delete your review for a specific campgrounds
router.delete("/:review_id", middleware.checkReviewOwnership, function(req, res){
	Review.findById(req.params.review_id, function(err){
		if(err){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		campground.findById(req.params.id, {$pull: {reviews: req.params.review_id}}, {new:true}.populate("reviews").exec(function(err, campground){
			if(err){
				req.flash("error", err.message);
				return res.redirect("back");
			}
			//recalculate the average
			campground.rating = calculateAverage(campground.reviews);
			//resave the average
			campground.save();
			req.flash("success", "Your review has been deleted successfully");
			res.redirect("/campgrounds/" + req.params.id);
		}));
	});
});


function calculateAverage(reviews){
	//if there are no reviews, then there is no length and we want to return 0 rather than a null or undefined
	if(reviews.length === 0){
		return 0;
	}
	let sum = 0;
	//add up all the reviews we have
	reviews.forEach(function(reviews){
		sum += reviews.rating;
	});
	//take the new total and divide it by the total amount of reviews to get our average
	return sum / reviews.length;
}
	
	module.exports = router;