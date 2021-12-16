var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  customerId: String,
  firstName: String,
  lastName: String,
  email: String,
  username: String,
  password: String,
  subscriptionId: String,
  subscriptionStatus: String,
  remaining_count: String,
  created_at: Number,
  end_at: Number,
  plan_id: String,
  currentPlan: String,
  current_end: String,
  validTill: String,
  paymentId: String,
  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
