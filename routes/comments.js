const express = require("express");
const router = express.Router({mergeParams: true});
const Campground = require("../models/campground"),
	  Comment 	 = require("../models/comments"),
	  middleware = require("../middleware"); //automatically requires if nothing is specified index.js

// ===========================
// COMMENTS ROUTES
// ===========================

//Show new comment form
router.get("/new", middleware.isLoggedIn, function(req,res){
	//find the campground with provided provided ID
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			res.send(err);
		} else {
			res.render("comments/new", {campground: campground});
		}	
	});
});

//Logic for creating comments
router.post("/", middleware.isLoggedIn, function(req,res){
	//look up campground using the ID
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		} else{
			//create a new comment
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					req.flash("error", "Something went wrong.");
					console.log(err);
				} else {
					//add username and id to comment
					comment.author.username = req.user.username;
					comment.author.id = req.user._id;
					//save comment
					comment.save();
					//connect new comment to campground
					campground.comments.push(comment);
					campground.save();
					//redirect to campground show page
					req.flash("success", "Comment successfully created.");
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
})

//EDIT - check show the edit form only if you own that comment
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err || !foundComment){
			res.flash("error", "Sorry, that comment does not exist.");
			res.redirect("back");
		} else{
			res.render("comments/edit", {campgroundID: req.params.id, comment: foundComment});
		}
	})
	
})

//UPDATE - Update the comments only if you own that comment
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updateComment){
		if(err){
			console.log(err);
			res.redirect("back");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DESTROY - Delete the comment only if you own that comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndDelete(req.params.comment_id, function(err, commentRemoved){
		if(err){
			res.redirect("back");
		} else {
			req.flash("success", "Comment successfully deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;