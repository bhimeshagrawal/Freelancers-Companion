/*
==========================================
INSTALLING THE PACKAGES
==========================================
*/

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const LocalStrategy = require("passport-local");
const methodOverride = require("method-override");
const User = require("./models/user");
const Project = require("./models/project");
const ContactQuery = require("./models/contactQuery");
const Blog = require("./models/blog");
const Testimonial = require("./models/testimonial");
const Work = require("./models/work");
const cors = require("cors");
const Razorpay = require("razorpay");
const work = require("./models/work");
const testimonial = require("./models/testimonial");
const nodemailer = require("nodemailer")
const path = require('path');
const { off } = require("./models/user");
// const YOUR_DOMAIN = "http://localhost:3000";
const YOUR_DOMAIN = "https://pure-journey-78047.herokuapp.com";
const buildLength = {
  starter: 2,
  basic: 6,
  plus: 25,
};
const plans = {
  // monthly
  StarterMonthly: "plan_ITGnZNHqShAfec",
  BasicMonthly: "plan_ITU4eRr10hr62z",
  PlusMonthly: "plan_ITU5EL6SQb33D2",
  // quarterly
  StarterQuarterly: "plan_ITU5jZfefJduhR",
  BasicQuarterly: "plan_ITU6HUYMWT66Rd",
  PlusQuarterly: "plan_ITU6gaxHk3oi6z",
  // yearly
  StarterYearly: "plan_ITU7CzDGB32wve",
  BasicYearly: "plan_ITU7csf7WGbXYO",
  PlusYearly: "plan_ITU80Lf0xL2EeN",
};
const instance = new Razorpay({
  key_id: "rzp_test_Au3uO8cawOO3zg",
  key_secret: "T2FCQvjSE7WbhlNQHeuT2sdU",
});
/*
==========================================
CONFIGURATIONS
==========================================
*/
const PORT = process.env.PORT || 3000;
mongoose.connect("mongodb+srv://monkeysingh:monkeysingh@monkeysingh.6arno.mongodb.net/monkeysingh?retryWrites=true&w=majority", (err) => {
  if (err) console.log(err);
  else console.log("connected");
}
);
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(cookieParser("secret"));
//PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret: "Monkey singh is best graphic designer",
  resave: false,
  saveUninitialized: false,
})
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.listen(PORT, function () {
  console.log(`Server Started at port ${PORT}`);
});
var email, username, firstName, lastName, password;
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  service: 'Gmail',
  auth: {
    type: 'OAuth2',
    user: 'monkeysinghindia@gmail.com',
    pass: 'monkey@123',
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN
  }
});


/*
==========================================
ROUTES
==========================================
*/

app.get("/", function (req, res) {
  Work.find({}, (err, workArray) => {
    if (err) console.log(err);
    else {
      Testimonial.find({}, (err, testimonialArray) => {
        if (err) console.log(err);
        else {
          res.render("home", {
            workArray: workArray,
            testimonialArray: testimonialArray,
            plans: plans,
          });
        }
      });
    }
  });
});
app.get("/howitworks", (req, res) => {
  res.render("howitworks");
});
app.get("/pricing", (req, res) => {
  res.render("pricing", { plans: plans });
});
app.get("/dashboard", isLoggedIn, async function (req, res) {
  // populating its posts and rendering dashboard
  User.findOne({ email: req.user.email }, (err, user) => {
    // monthly plan 
    // console.log(user)
    if (isMonthlyPlan(user.plan_id) == true) {
      instance.subscriptions.fetch(user.subscriptionId).then((response) => {
        var currentTimeInSeconds = Math.floor(Date.now() / 1000);
        // monthly active plan
        if (response.status == "completed" && response.current_end > currentTimeInSeconds) {
          user.end_at == response.current_end
          user.subscriptionStatus = "active";
          user.currentPlan = findPlanName(response.plan_id)
          user.save()
          User.findOne({ email: req.user.email }).populate("projects").exec(function (err, user) {
            if (err) console.log(err);
            else {
              res.render("dashboard", { user: user });
            }
          });
        }
        //monthly inactive plan
        else {
          user.subscriptionStatus = "expired";
          user.currentPlan = "";
          user.save()
          res.render("pricing", { plans: plans })
        }
      })
    }
    //quarterly or yearly plan
    else if (isQuarterlyOrYearlyPlan(user.plan_id) == true) {
      instance.subscriptions.fetch(user.subscriptionId).then((response) => {
        if (response.plan_id == user.plan_id && response.status == "active") {
          user.currentPlan = findPlanName(user.plan_id)
          user.customerId = response.customer_id
          user.subscriptionStatus = response.status
          user.save()
          // check completion date and render accordingly
          User.findOne({ email: req.user.email }).populate("projects").exec(function (err, user) {
            if (err) console.log(err);
            else {
              res.render("dashboard", { user: user });
            }
          });
        }
        else {
          user.currentPlan = "";
          user.subscriptionStatus = "expired"
          user.save()
          res.render("pricing", { plans: plans })
        }
      })
    }
    else {
      res.render("pricing", { plans: plans })
    }
  })
});
app.post("/project", isLoggedIn, function (req, res) {
  // getting todays date
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + "/" + mm + "/" + yyyy;

  // get data from form and add to projectList array
  User.findOne({ email: req.user.email }, (err, user) => {
    if (user.subscriptionStatus == "active") {
      Project.create(
        {
          title: req.body.projectTitle,
          category: req.body.category,
          state: "pending",
          date: today,
          url: "",
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
app.get("/register", function (req, res) {
  var err = {
    message: "",
  };
  res.render("register", { err: err.message });
});
app.post("/register", function (req, res) {
  if (isUserExist(req.body.username, req.body.email) == true) {
    var errmsg = {
      message: "Email or username already exist",
    };
    res.render("register", { err: errmsg.message });
  }
  else {
    username = req.body.username
    firstName = req.body.firstName
    lastName = req.body.lastName
    email = req.body.email
    password = req.body.password
    //generating random otp
    var otp = Math.random();
    otp = otp * 1000000;
    otp = parseInt(otp);
    console.log(otp);
    // send mail with defined transport object
    var mailOptions = {
      to: req.body.email,
      subject: "Otp for registration is: ",
      html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      res.render('otp', { err: "" });
    });
  }
});
app.post('/resend', function (req, res) {
  var mailOptions = {
    to: email,
    subject: "Otp for registration is: ",
    html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    res.render('otp', { err: "otp has been sent" });
  });
});
app.post('/verify', function (req, res) {
  if (req.body.otp == otp) {
    var newUser = new User({
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: email,
    });
    User.register(newUser, password, function (err, user) {
      if (err) {
        console.log(err);
        return res.render("register", { err: err.message });
      }
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    });
  }
  else {
    res.render('otp', { err: 'otp is incorrect' });
  }
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/login_err", (req, res) => {
  res.render("login_err");
});
app.post("/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login_err",
  }),
  function (req, res) { }
);
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
app.get("/contactus", (req, res) => {
  res.render("contactus", { isQuerySubmitted: false });
});
app.post("/contactus", (req, res) => {
  ContactQuery.create(
    {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      companyName: req.body.companyName,
      message: req.body.message,
    },
    (err, contactQuery) => {
      if (err) console.log(err);
      else {
        res.render("contactus", { isQuerySubmitted: true });
      }
    }
  );
});
app.get("/features", (req, res) => {
  res.render("features");
});
app.get("/ourwork", (req, res) => {
  res.redirect("/ourwork/all");
});
app.get("/ourwork/:category", (req, res) => {
  var category = req.params.category.toLowerCase();
  if (category == "all") {
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
app.get("/blog", (req, res) => {
  //find all blogs , make array and render all blogs
  Blog.find({}, (err, blogPostArray) => {
    if (err) console.log(err);
    else {
      res.render("blog", { blogPostArray: blogPostArray });
    }
  });
});
app.post("/create-new-blogpost", (req, res) => {
  // getting todays date
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + "/" + mm + "/" + yyyy;
  // creating post
  var newBlog = new Blog({
    author: req.body.author,
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    date: today,
  });
  //save this in blog collection and redirect to all blog page
  newBlog.save((err, blog) => {
    if (err) console.log(err);
    else {
      res.redirect("/blog");
    }
  });
});
app.post("/create-new-testimonial", (req, res) => {
  // creating testimonial
  var newTestimonial = new Testimonial({
    name: req.body.name,
    designation: req.body.designation,
    image: req.body.image,
    description: req.body.description,
  });
  //save this in testimonial collection and redirect to home page
  newTestimonial.save((err, testimonial) => {
    if (err) console.log(err);
    else {
      res.redirect("/");
    }
  });
});
app.post("/create-new-work", (req, res) => {
  // creating work
  var newWork = new Work({
    name: req.body.name,
    category: req.body.category,
    image: req.body.image,
    description: req.body.description,
  });
  //save this in testimonial collection and redirect to home page
  newWork.save((err, work) => {
    if (err) console.log(err);
    else {
      res.redirect("/");
    }
  });
});
app.get("/admin", (req, res) => {
  res.render("admin", { status: false });
});
app.post("/admin-login", (req, res) => {
  var adminId = "cc1BkAATqxf52oZo2P3q";
  var adminPassword = "ws1WQAMwap4tPJQFEHo0";
  var name = req.body.name;
  var password = req.body.password;
  if (adminId == name && adminPassword == password) {
    res.render("admin", { status: true });
  } else {
    res.redirect("/admin");
  }
});
let sub_id;
let selected_plan_id;
let total_count_var;
app.get("/checkout", isLoggedIn, (req, res) => {
  User.findOne({ email: req.user.email }, (err, user) => {
    res.render("checkout", { user: user })
  })
})
app.post("/create-checkout-session", isLoggedIn, (req, res) => {
  selected_plan_id = req.body.plan
  res.redirect("/checkout")
})
app.post("/one-time-access", isLoggedIn, (req, res) => {
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
    res.json(response)
  })
})
app.post("/verify", (req, res) => {
  instance.payments.fetch(req.body.razorpay_payment_id).then((paymenyDocument) => {
    console.log(paymenyDocument)
    if (paymenyDocument.status == "captured" || paymenyDocument.status == "authorized") {
      // transaction successful
      // save sub id to user database and payment id to database , and from plan id save plan name to database
      User.findOne({ email: req.user.email }, (err, user) => {
        if (err) console.log(err)
        else {
          user.subscriptionId = sub_id;
          user.plan_id = selected_plan_id;
          user.created_at = paymenyDocument.created_at
          user.save(function (err, user) {
            if (err) console.log(err)
          })
        }
      })
      res.redirect("/dashboard")
    }
    else {
      res.send("Waiting for transaction to be successful")
    }
  })
})
app.get("/cancel_subscription", isLoggedIn, (req, res) => {
  User.findOne({ email: req.user.email }, (err, user) => {
    user.subscriptionId = "";
    user.plan_id = "";
    user.currentPlan = "";
    user.subscriptionStatus = "cancelled"
    user.save()
    instance.subscriptions.cancel(user.subscriptionId)
    res.redirect("/dashboard")
  })
})



function isUserExist(userName, userEmail) {
  User.find({ $or: [{ username: userName }, { email: userEmail }] }, (err, foundUsers) => {
    if (foundUsers.length != 0)
      return true;
    return false;
  }
  );
}
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
function findPlanName(plan_id) {
  var planName
  if (plan_id == plans.StarterMonthly)
    planName = "Starter - Monthly"
  if (plan_id == plans.BasicMonthly)
    planName = "Basic - Monthly"
  if (plan_id == plans.PlusMonthly)
    planName = "Plus - Monthly"
  if (plan_id == plans.StarterQuarterly)
    planName = "Starter - Quarterly"
  if (plan_id == plans.BasicQuarterly)
    planName = "Basic - Quarterly"
  if (plan_id == plans.PlusQuarterly)
    planName = "Plus - Quarterly"
  if (plan_id == plans.StarterYearly)
    planName = "Starter - Yearly"
  if (plan_id == plans.BasicYearly)
    planName = "Basic - Yearly"
  if (plan_id == plans.PlusYearly)
    planName = "Plus - Yearly"
  return planName;
}
function isMonthlyPlan(plan_id) {
  if (plan_id == plans.StarterMonthly || plan_id == plans.BasicMonthly || plan_id == plans.PlusMonthly)
    return true;
  return false;
}
function isQuarterlyOrYearlyPlan(plan_id) {
  if (plan_id == plans.StarterQuarterly)
    return true;
  else if (plan_id == plans.BasicQuarterly)
    return true;
  else if (plan_id == plans.PlusQuarterly)
    return true;
  else if (plan_id == plans.StarterYearly)
    return true;
  else if (plan_id == plans.BasicYearly)
    return true;
  else if (plan_id == plans.PlusYearly)
    return true;
  return false;
}