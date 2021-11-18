var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  stripeId: String,
  firstName: String,
  lastName: String,
  email: String,
  username: String,
  password: String,
  subscription: Object,
  currentPlan: String,
  checkoutSessions: Array,
  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
