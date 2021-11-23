var mongoose = require("mongoose");

var WorkSchema = new mongoose.Schema({
  name: String,
  category: String,
  image: String,
  description: String,
});

module.exports = mongoose.model("Work", WorkSchema);
