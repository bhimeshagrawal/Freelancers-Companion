var mongoose = require("mongoose");

var TestimonialSchema = new mongoose.Schema({
  name: String,
  designation: String,
  image: String,
  description: String,
});

module.exports = mongoose.model("Testimonial", TestimonialSchema);
