var mongoose = require("mongoose");

var BlogSchema = new mongoose.Schema({
  author: String,
  title: String,
  category: String,
  description: String,
  date: String,
  image: String,
  urlString: String,
});

module.exports = mongoose.model("Blog", BlogSchema);
