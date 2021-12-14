var mongoose = require("mongoose");

var WorkSchema = new mongoose.Schema({
  category: String,
  image: String,
});

module.exports = mongoose.model("Work", WorkSchema);
