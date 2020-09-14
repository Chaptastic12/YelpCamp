const express = require("express");
const router = express.Router();
const passport = require("passport"),
	  User	   = require("../models/user"),
	  aSync	   = require("async"),
	  nodemailer = require("nodemailer"),
	  crypto   	 = require("crypto");


//============================
// ROOT ROUTE 
//============================

//Show our main landing page at the root directory
router.get("/", function(req, res){
	res.render("landing");
});

//============================
// AUTHENTICATION ROUTES 
//============================

//Show register form
router.get("/register", function(req, res){
	res.render("register", {page: 'register'});
})

//Handle signup logic
router.post("/register", function(req, res){
	let newUser = new User({
							username: req.body.username,
						   firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email
	});
	//Evaluate if they are an admin or not by if they know the admin code
	if(req.body.adminCode === "secretcode123"){
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			req.flash("error", "Error! "+ err.message);
			return res.redirect("/register"); //break out of callback with the return
		}
		passport.authenticate("local")(req, res, function(){ //log them in, then redirect them to campgrounds
			req.flash("success", "Welcome, " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

//Show login form
router.get("/login", function(req, res){
	res.render("login", {page: 'login'});
})

//handle login logic
router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}), function(req, res){});


//logout route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out");
	res.redirect("/campgrounds");
})

//forgot password router
router.get("/forgot", function(req, res){
	res.render("forgot");
})

//Handle forgot password logic
router.post("/forgot", function(req, res){
	aSync.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				let token = buf.toString('hex');
				done(err, token); //create our token
			});
		},
		function(token, done){
			User.findOne({email: req.body.email}, function(err, user){
				if(!user){ //if there is no user found
					req.flash("error", "No accounts with that email found"); //warn them that it doesnt exist
					return res.redirect("/forgot"); //end this call and send them back to the page to start over
				}
				
				user.resetPasswordToken = token; //set the token to the User profile
				user.resetPasswordExpires = Date.now() + 3600000 //1 hour, add the expiration for the token to the User profile
				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			let smtpTransport = nodemailer.createTransport({
				service: "Gmail", 
				auth: {
				  user: "demodev996@gmail.com",
				  pass: process.env.GMAILPW
				}
      		});
			let mailOptions = {
				to: user.email,
				from: "demodev996@gmail.com",
				subject: "YelpCamp Password Reset",
				text: "You are receiving this because you (or someone else) has requested the reset of the password for your account." + "\n\n" +
				"Please click the following link, or paste it into your browser to complete the process." + "\n\n" +
				"http://" + req.headers.host + "/reset/" + token + "\n\n" +
				"If you did not request this, please ignore this email and your password will remain unchanged"
			};
			smtpTransport.sendMail(mailOptions, function(err){
				console.log("Password reset for " + user.email + " has been sent.");
				req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions");
				res.redirect("/campgrounds");
				done(err, "done");
			});
		}
	], function(err){
		if(err){
			req.flash("error", err);
			console.log(err);
			res.redirect("/forgot");
		}
	});
});

//Show the reset page if a token actually exists, if not warn them and redirect back to the forgot page
router.get("/reset/:token", function(req, res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now()}}, function(err, user){
		if(!user){
			req.flash("error", "Password reset token is invalid or has expired");
			return res.redirect("/forgot");
		}
		res.render("reset", {token: req.params.token});
	})
})

//Handle the logic behind updating the password
router.post("/reset/:token", function(req, res){
	aSync.waterfall([
		function(done){
		User.findOne({resetPasswordToken: req.params.token}, function(err, user){
		if(!user){
			req.flash("error", "Password reset token is invalid or has expired");
			return res.redirect("/campgrounds");
		}
		
		if(req.body.password === req.body.confirm){
			user.setPassword(req.body.password, function(err){
				user.resetPasswordToken = undefined;
				user.resetPasswordExpires = undefined;
				
				user.save(function(err){
					req.logIn(user, function(err){
						done(err, user);
					});
				});
			})
		} else {
			req.flash("error", "Passwords do not match");
			return res.redirect("back");
		}
		});
		},
		
		function(user, done){
			let smtpTransport = nodemailer.createTransport({
				service: "Gmail", 
				auth: {
				  user: "demodev996@gmail.com",
				  pass: process.env.GMAILPW
				}
			});
			let mailOptions = {
				to: user.email,
				from: "demodev996@gmail.com",
				subject: "YelpCamp Password Reset",
				text: "Hello" + "\n\n" +
				"This is confirmation that youre password has been reset for account " + user.email + "/n"
			};
			smtpTransport.sendMail(mailOptions, function(err){
				console.log("Password reset for " + user.email + " has been completed");
				req.flash("success", "Your password has been changed");
				req.redirect("/campgrounds");
				done(err, "done");
			});
		}
	]), function(err){
		res.redirect("/campgrounds");
	};
});


module.exports = router;