const express = require('express');
const router = express.Router();
const Razorpay = require("razorpay");
const User = require("../models/user");
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

let sub_id;
let selected_plan_id;
let total_count_var;

// '/payment'
router.get("/checkout", middleware.isLoggedIn, async (req, res) => {
    let user = await User.findOne({ email: req.user.email })
    res.render("checkout", { user: user })
});


router.post("/create-checkout-session", middleware.isLoggedIn, (req, res) => {
    selected_plan_id = req.body.plan
    res.redirect("/payment/checkout")
});


router.post("/one-time-access", middleware.isLoggedIn, (req, res) => {
    if (selected_plan_id == plans.BasicMonthly || selected_plan_id == plans.StarterMonthly || selected_plan_id == plans.PlusMonthly)
        total_count_var = 1;
    if (selected_plan_id == plans.BasicQuarterly || selected_plan_id == plans.StarterQuarterly || selected_plan_id == plans.PlusQuarterly)
        total_count_var = 3;
    if (selected_plan_id == plans.BasicYearly || selected_plan_id == plans.StarterYearly || selected_plan_id == plans.PlusYearly)
        total_count_var = 12;
    const params =
    {
        plan_id: selected_plan_id,
        customer_notify: 1,
        quantity: 1,
        total_count: total_count_var,
    }
    instance.subscriptions.create(params, (err, response) => {
        subscriptionObj = response
        console.log(response)
        sub_id = response.id;
        console.log(response)
        res.json(response)
    })
});


router.post("/verify", async (req, res) => {
    let paymentDocument = await instance.payments.fetch(req.body.razorpay_payment_id)
    console.log(paymentDocument)
    if (paymentDocument.status == "captured" || paymentDocument.status == "authorized") {
        // transaction successful
        // save sub id to user database and payment id to database , and from plan id save plan name to database
        let user = await User.findOne({ email: req.user.email })
        user.subscriptionId = sub_id;
        user.plan_id = selected_plan_id;
        user.created_at = paymentDocument.created_at
        user.save()
        res.redirect("/dashboard")
    }
    else {
        res.send("Waiting for transaction to be successful")
    }
});


router.get("/cancel_subscription", middleware.isLoggedIn, (req, res) => {
    User.findOne({ email: req.user.email }, (err, user) => {
        user.subscriptionId = "";
        user.plan_id = "";
        user.currentPlan = "";
        user.current_end = "";
        user.validTill = "";
        user.subscriptionStatus = "cancelled"
        user.save()
        instance.subscriptions.cancel(user.subscriptionId)
        res.redirect("/")
    })
});

module.exports = router;