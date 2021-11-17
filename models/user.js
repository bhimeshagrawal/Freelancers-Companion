var mongoose = require("mongoose");
var Project = require("./project");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  stripeId: String,
  firstName: String,
  lastName: String,
  email: String,
  username: String,
  password: String,
  subscription: String,
  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
