const Campground = require("../models/campground"),
	  Comment    = require("../models/comments"),
	  Review 	 = require("../models/review");

//==========================================
// MIDDLEWARE
//==========================================

let middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
			if(err || !foundCampground){
				console.log(err);
				req.flash("error", "Campground was not found.");
				res.redirect("back");
			} else {
				//if so, do they own the campground?
				if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){ //need to use /equals since the author.id is a mongoose object and not a string like req.user._id
					req.campground = foundCampground;
					next();
				} else {
					req.flash("error", "You don't have permission to edit this campground.");
					res.redirect("back");
				}
			}
		});	
	}
}
	
middlewareObj.checkCommentOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){ 
			if(err || !foundComment){
				req.flash("error", "Comment was not found.");
				res.redirect("/campgrounds");
			} else {
				//if so, do they own the Comment?
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){ //need to use /equals since the author.id is a mongoose object and not a string like req.user._id
					req.comment = foundComment;
					next();
				} else {
					req.flash("error", "You don't have permission to edit this Comment.");
					res.redirect("back");
				}
			}
		console.log(foundComment);
		})
	} else {
		console.log("need to be logged in");
		res.redirect("back"); // send them back to where they came 
	}
}

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
			return next(); //need to have the return here
		}
	req.flash("error", "You need to be logged in to perform this action.");
	res.redirect("/login");
}

middlewareObj.isAdmin = function(req, res, next){
	if( req.user && req.isAuthenticated()){
		if( req.user && req.user.isAdmin){
			return next(); //need to have the return here
		} else {
			req.flash("error", "You do not have permission to visit this page");
			res.redirect("/campgrounds")
		}
	} else {
		req.flash("error", "You need to be logged in to perform this action.");
		res.redirect("/login");
	}
}

middlewareObj.checkReviewOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Review.findById(req.params.review_id, function(err, foundReview){ 
			if(err || !foundReview){
				req.flash("error", err.messsage);
				res.redirect("/campgrounds");
			} else {
				//if so, do they own the review?
				if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin){ //need to use /equals since the author.id is a mongoose object and not a string like req.user._id
					next();
				} else {
					req.flash("error", "You don't have permission to edit this review.");
					res.redirect("back");
				}
			}
		console.log(foundReview);
		})
	} else {
		console.log("need to be logged in");
		res.redirect("back"); // send them back to where they came 
	}
}

middlewareObj.checkReviewExistence = function(req, res, next){
	if(req.isAuthenticated()){ // verify that they are logged in
		Campground.findById(req.params.id).populate("reviews").exec(function(err, foundCampground){ //find the campground with req.params.id, populate its reviews and execuate the function
			if(err || !foundCampground){ //if theres an error or we didn't find a campground with that Id, show an error message
				req.flash("error", err.message);
				res.redirect("back");
			} else {
				let foundUserReview = foundCampground.reviews.some(function(review){ //if we did find a campground, see if a review can be found where any of the reviews has an author id of the logged in user. Some will return true or false
					return review.author.id.equals(req.user._id);
				});
				if(foundUserReview){ //if it finds one, throw an error
					req.flash("error", "You already wrote a review");
					return res.redirect("/campgrounds/" + req.params.id);
				}
				//else if a review wasn't found...
				next();
			}
		})
	}
}

module.exports = middlewareObj;