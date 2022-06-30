const express = require("express");
const router = express.Router({ mergeParams: true });
const Blog = require("../models/blog");
const Testimonial = require("../models/testimonial");
const Work = require("../models/work");
require('dotenv').config();
let WorkCategoryArray = ['App-Development', 'Banner', 'Books', 'Card', 'Digital-Ads', 'Logo', 'Newspaper-Ad', 'Packaging', 'Promotional', 'Social-Media', 'T-Shirt', 'Typography', 'Web-Design'];


// '/admin'
router.get('/', (req, res) => {
    res.render("admin", { isAdminLoggedIn: false, WorkCategoryArray: WorkCategoryArray });
})


router.post("/", (req, res) => {
    console.log(req.body)
    var adminId = process.env.ADMIN_ID;
    var adminPassword = process.env.ADMIN_PASSWORD;
    var { name, password } = req.body;
    if (name == adminId && password == adminPassword) {
        res.render("admin", { isAdminLoggedIn: true, WorkCategoryArray: WorkCategoryArray });
    } else {
        res.redirect("/admin");
    }
});


router.post("/blog", (req, res) => {
    // creating post
    var { author, title, category, image, description, date } = req.body;
    var newBlog = new Blog({ author, title, category, image, description, date });
    //save this in blog collection and redirect to all blog page
    newBlog.save((err, blog) => {
        if (err) console.log(err);
        else res.redirect("/admin");
    });
});


router.post("/testimonial", (req, res) => {
    // creating testimonial
    var { name, designation, image, description } = req.body;
    var newTestimonial = new Testimonial({ name, designation, image, description });
    //save this in testimonial collection and redirect to home page
    newTestimonial.save((err, testimonial) => {
        if (err) console.log(err);
        else res.redirect("/admin");
    });
});


router.post("/work", (req, res) => {
    // creating work
    var { name, category, image, description } = req.body;
    var newWork = new Work({ name, category, image, description });
    //save this in testimonial collection and redirect to home page
    newWork.save((err, work) => {
        if (err) console.log(err);
        else res.redirect("/admin");
    });
});


module.exports = router;