const express = require("express");
const router = express.Router();
const Campground = require("../models/campground"),
	  Comment    = require("../models/comments"),
	  User		 = require("../models/user"),
	  middleware = require("../middleware");

//=================
//ADMIN ROUTES
//=================

//Allow you into the admin console if you are an admin. Generate the necessities for the admin console (users, campgrounsd, commments)
router.get("/", middleware.isAdmin, function(req, res){
	const perPage = 8; // Max number of items per page
	const pageQuery = parseInt(req.query.page); 
	let pageNumber = pageQuery ? pageQuery : 1; //Current page number
	User.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, users){
		User.countDocuments().exec(function(err, count){
			if(err){
				res.flash("error", "There was an error finding users.");
				res.render("/admin/index");
			} else {
				Campground.find({}, function(err, campgrounds){
					if(err){
						res.flash("error", "There was an error finding campgrounds.");
						res.render("/admin/index");
					} else{
						Comment.find({}, function(err, comments){
							if(err){
								res.flash("error", "There was an error finding comments.");
								res.render("/admin/index");
							} else{
								res.render("admin/index", {users, campgrounds, comments, current: pageNumber, pages: Math.ceil(count / perPage)});
							}
						});
					}
				});
			}
		});
	});
});

//EDIT - allow you to edit the properties of users
router.get("/:id/edit", middleware.isAdmin, function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			console.log(err);
			res.redirect("/admin")
		} else {
			res.render("admin/edit", {user: foundUser});
		}	
	});
});

//UPDATE - all you to push through the updates to a users username and admin privileges
router.put("/:id", middleware.isAdmin, function(req, res){
	//find and update the correct campground
	User.findByIdAndUpdate(req.params.id, req.body.info, function(err, updatedUser){
		if(err){
			res.redirect("/admin");
		} else {
			req.flash("success", "User was updated successfully.")
			res.redirect("/admin/");
		}
	});
});

//DESTROY - allow you to delete a user only if you are an admin
router.delete("/:id", middleware.isAdmin, function(req, res){
	User.findByIdAndRemove(req.params.id, function(err, userRemoved){
		if(err){
			res.redirect("/admin/index");
		} else {
			req.flash("success", "User deleted successfully.");
			res.redirect("/admin");
		}
	});
});

module.exports = router;