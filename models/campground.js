const mongoose	 = require("mongoose");

let campgroundSchema = new mongoose.Schema({
	name: 		 String,
	image:		 String,
	description: String,
	cost:		 Number,
	createdAt: {type: Date, default: Date.now},
	comments: [	//this will be an array of IDs of 'Comment'
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	reviews: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Review"
		}
	],
	rating: {
		type: Number,
		default: 0
	}
}); 

//Compile our schema into a model
module.exports = mongoose.model("Campground", campgroundSchema);