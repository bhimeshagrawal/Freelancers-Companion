var mongoose = require("mongoose");

var WorkCategorySchema = new mongoose.Schema({
    category: String,
});

module.exports = mongoose.model("WorkCategory", WorkCategorySchema);
