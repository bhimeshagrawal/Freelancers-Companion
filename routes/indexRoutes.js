const express = require('express');
const router = express.Router();
const Razorpay = require("razorpay");
const User = require("../models/user");
const Work = require("../models/work");
const Blog = require("../models/blog");
const Project = require("../models/project");
const Testimonial = require("../models/testimonial");
const ContactQuery = require("../models/contactQuery");
const middleware = require('../middleware/middleware');
require('dotenv').config()
const plans = {
    // monthly
    StarterMonthly: process.env.RZP_PLAN_STARTER_MONTHLY,
    BasicMonthly: process.env.RZP_PLAN_BASIC_MONTHLY,
    PlusMonthly: process.env.RZP_PLAN_PLUS_MONTHLY,
    // quarterly
    StarterQuarterly: process.env.RZP_PLAN_STARTER_QUARTERLY,
    BasicQuarterly: process.env.RZP_PLAN_BASIC_QUARTERLY,
    PlusQuarterly: process.env.RZP_PLAN_PLUS_QUARTERLY,
    // yearly
    StarterYearly: process.env.RZP_PLAN_STARTER_YEARLY,
    BasicYearly: process.env.RZP_PLAN_BASIC_YEARLY,
    PlusYearly: process.env.RZP_PLAN_PLUS_YEARLY,
};
const instance = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET,
});


// '/'
router.get("/", async (req, res) => {
    let workArray = await Work.find({});
    let testimonialArray = await Testimonial.find({});
    middleware.shuffle(workArray);
    res.render("home", { workArray, testimonialArray, plans });
});


router.get("/dashboard", middleware.isLoggedIn, async function (req, res) {
    // populating its posts and rendering dashboard
    let user = await User.findOne({ email: req.user.email })
    if (!user.subscriptionId) {
        res.render("pricing", { plans: plans })
    }
    else {
        let response = await instance.subscriptions.fetch(user.subscriptionId)
        var currentTimeInUnix = Math.floor(Date.now() / 1000);
        // next renew date current end
        // valid till response.end_at + response.current_end - response.current_start
        user.current_end = response.current_end
        user.validTill = response.end_at + response.current_end - response.current_start;
        user.subscriptionStatus = "active";
        user.currentPlan = middleware.findPlanName(response.plan_id)
        await user.save()
        // active subscription
        if (user.current_end > currentTimeInUnix && (response.status == "active" || response.status == "completed")) {
            User.findOne({ email: req.user.email }).populate("projects").exec(function (err, user) {
                if (err) console.log(err);
                else {
                    res.render("dashboard", { user, WorkCategoryArray, current_end: middleware.unixToDate(user.current_end), validTill: middleware.unixToDate(user.validTill) });
                }
            });
        }
        // expired subscription
        else {
            user.currentPlan = "";
            user.subscriptionStatus = "expired"
            await user.save()
            res.render("pricing", { plans: plans })
        }
    }
});


router.get("/contact-us", (req, res) => {
    res.render("contactus", { isQuerySubmitted: false });
});


router.post("/contact-us", (req, res) => {
    let { name, email, phoneNumber, companyName, message } = req.body;
    ContactQuery.create({ name, email, phoneNumber, companyName, message }, (err, contactQuery) => {
        if (err) console.log(err);
        else res.render("contactus", { isQuerySubmitted: true });
    }
    );
});


router.get("/our-work", (req, res) => {
    res.redirect("/our-work/All");
});


router.get("/our-work/:category", (req, res) => {
    var category = req.params.category;
    if (category == "All") {
        Work.find({}, (err, workArray) => {
            if (err) console.log(err);
            else {
                res.render("ourwork", { workArray: workArray, category: "all" });
            }
        });
    } else {
        Work.find({ category: category }, (err, workArray) => {
            if (err) console.log(err);
            else {
                res.render("ourwork", { workArray: workArray, category: category });
            }
        });
    }
});


router.get("/blog", (req, res) => {
    //find all blogs , make array and render all blogs
    Blog.find({}, (err, blogPostArray) => {
        if (err) console.log(err);
        else {
            res.render("blog", { blogPostArray: blogPostArray });
        }
    });
});


router.post("/project", middleware.isLoggedIn, function (req, res) {
    // get data from form and add to projectList array
    User.findOne({ email: req.user.email }, (err, user) => {
        if (user.subscriptionStatus == "active") {
            Project.create(
                {
                    title: req.body.projectTitle,
                    category: req.body.category,
                    state: "pending",
                    date: middleware.todaysDate(),
                    url: "",
                    user: user.username
                },
                function (err, project) {
                    User.findOne({ email: req.user.email }, function (err, foundUser) {
                        if (err) console.log(err);
                        else {
                            foundUser.projects.push(project);
                            foundUser.save(function (err, data) {
                                if (err) console.log(err);
                            });
                        }
                    });
                }
            );
            res.redirect("/dashboard");
        }
        else {
            res.redirect("/pricing");
        }
    })
});

router.get("/blogs/:id", (req, res) => {
    Blog.findOne({ _id: req.params.id }, (err, blogPost) => {
        res.render("blogpage", { blogPost: blogPost })
    })
})


module.exports = router;