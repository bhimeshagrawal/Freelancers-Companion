const express = require('express');
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const middleware = require('../middleware/middleware');
const sgMail = require('@sendgrid/mail');
require('dotenv').config()
sgMail.setApiKey(process.env.TWILIO_API_KEY);
const tempdetails = { email: "", username: "", firstName: "", lastName: "", password: "", otp: "" }

// '/user'
router.get("/register", function (req, res) {
    res.render("register", { err: "" });
});


router.get("/login", function (req, res) {
    res.render("login");
});


router.get("/login_err", (req, res) => {
    res.render("login_err");
});


router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


router.get("/forgotpassword", (req, res) => {
    res.render("forgotpassword", { err: "" })
});


router.get("/forgotusername", (req, res) => {
    res.render("forgotusername")
});


router.post("/register", function (req, res) {
    if (middleware.isUserExist(req.body.username, req.body.email) == true) {
        res.render("register", { err: "Email or username already exist" });
    }
    else {
        tempdetails.username = req.body.username
        tempdetails.firstName = req.body.firstName
        tempdetails.lastName = req.body.lastName
        tempdetails.email = req.body.email
        tempdetails.password = req.body.password
        //generating random otp
        tempdetails.otp = middleware.generateOTP();
        const msg = {
            to: req.body.email, //recipient
            from: 'monkeysinghindia@gmail.com', // Change to your verified sender
            subject: 'Otp for registration is: "',
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + tempdetails.otp + "</h1>" // html body
        }
        sgMail.send(msg).then(() => {
            console.log('Email sent');
            res.render('otpregister', { err: "" });
        }).catch((error) => {
            console.error(error);
        });
    }
});


router.post('/resend', function (req, res) {
    const msg = {
        to: tempdetails.email, //recipient
        from: 'monkeysinghindia@gmail.com', // Change to your verified sender
        subject: 'Otp for registration is: "',
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + tempdetails.otp + "</h1>" // html body
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
            res.render('otp', { err: "otp has been sent" });
        })
        .catch((error) => {
            console.error(error)
        })
});


router.post('/verifyregister', function (req, res) {
    if (req.body.otp == tempdetails.otp) {
        var newUser = new User({
            username: tempdetails.username,
            firstName: tempdetails.firstName,
            lastName: tempdetails.lastName,
            email: tempdetails.email,
        });
        User.register(newUser, tempdetails.password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("register", { err: err.message });
            }
            res.render("login")
        });
    }
    else {
        res.render('otpregister', { err: 'otp is incorrect' });
    }
});





router.post("/sendotpforgotpassword", (req, res) => {
    tempdetails.email = req.body.email
    //generate random otp
    tempdetails.otp = generateOTP();
    // send mail with defined transport object
    const msg = {
        to: req.body.email, //recipient
        from: 'monkeysinghindia@gmail.com', // Change to your verified sender
        subject: 'Otp for registration is: "',
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + tempdetails.otp + "</h1>" // html body
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
            res.render('otpforgotpassword', { err: "" });
        })
        .catch((error) => {
            console.error(error)
        })
    res.render("otpforgotpassword", { err: "" })
});


router.post("/verifyotpforgotpassword", (req, res) => {
    if (req.body.otp == tempdetails.otp) {
        res.render("changepassword")
    }
    else {
        res.render("otpforgotpassword", { err: "Incorrect OTP entered" })
    }
});


router.post("/changepassword", (req, res) => {
    User.findOne({ email: tempdetails.email }, (err, user) => {
        user.setPassword(req.body.password, function (err, user) {
            user.save()
            res.redirect("/dashboard")
        })
    })
});



router.post("/login",
    passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/user/login_err",
    }),
);





router.post("/sendusernameforgotusername", (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        const msg = {
            to: req.body.email, //recipient
            from: 'monkeysinghindia@gmail.com', // Change to your verified sender
            subject: 'Username for Monkeysingh.com is: "',
            html: "<h3>Username for e-mail address is </h3>" + "<h1 style='font-weight:bold;'>" + user.username + "</h1>" // html body
        }
        sgMail
            .send(msg)
            .then(() => {
                res.redirect("/")
            })
            .catch((error) => {
                console.error(error)
            })
    })
})


module.exports = router;