var mongoose = require("mongoose");

var ContactQuerySchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  companyName: String,
  message: String,
});

module.exports = mongoose.model("ContactQuery", ContactQuerySchema);
