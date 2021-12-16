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
const WorkCategory = require("./models/workCategory");
const testimonial = require("./models/testimonial");
const path = require('path');
const sgMail = require('@sendgrid/mail');
const workCategory = require("./models/workCategory");


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
let WorkCategoryArray = [
  'App-Development', 'Banner',
  'Books', 'Card',
  'Digital-Ads', 'Logo',
  'Newspaper-Ad', 'Packaging',
  'Promotional', 'Social-Media',
  'T-Shirt', 'Typography',
  'Web-Design'
]
sgMail.setApiKey("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")
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
app.use('/static', express.static(path.join(__dirname, 'public')))
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
const tempdetails = { email: "", username: "", firstName: "", lastName: "", password: "", otp: "" }


/*
==========================================
ROUTES
==========================================
*/

app.get("/", function (req, res) {
  Work.find({}, (err, workArray) => {
    shuffle(workArray);
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
    user.currentPlan = findPlanName(response.plan_id)
    await user.save()
    // active subscription
    if (user.current_end > currentTimeInUnix && (response.status == "active" || response.status == "completed")) {
      User.findOne({ email: req.user.email }).populate("projects").exec(function (err, user) {
        if (err) console.log(err);
        else {
          res.render("dashboard", { user: user, WorkCategoryArray: WorkCategoryArray, current_end: unixToDate(user.current_end), validTill: unixToDate(user.validTill) });
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
    tempdetails.username = req.body.username
    tempdetails.firstName = req.body.firstName
    tempdetails.lastName = req.body.lastName
    tempdetails.email = req.body.email
    tempdetails.password = req.body.password
    //generating random otp
    tempdetails.otp = generateOTP()
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
        res.render('otpregister', { err: "" });
      })
      .catch((error) => {
        console.error(error)
      })
  }
});
app.post('/resend', function (req, res) {
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
app.post('/verifyregister', function (req, res) {
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
app.get("/forgotpassword", (req, res) => {
  res.render("forgotpassword", { err: "" })
})
app.post("/sendotpforgotpassword", (req, res) => {
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
})
app.post("/verifyotpforgotpassword", (req, res) => {
  if (req.body.otp == tempdetails.otp) {
    res.render("changepassword")
  }
  else {
    res.render("otpforgotpassword", { err: "Incorrect OTP entered" })
  }
})
app.post("/changepassword", (req, res) => {
  User.findOne({ email: tempdetails.email }, (err, user) => {
    user.setPassword(req.body.password, function (err, user) {
      user.save()
      res.redirect("/dashboard")
    })
  })
})
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
  res.redirect("/ourwork/All");
});
app.get("/ourwork/:category", (req, res) => {
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
    image: req.body.image,
    description: req.body.description,
    date: req.body.date,
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
  res.render("admin", { status: false, WorkCategoryArray: WorkCategoryArray });
});
app.post("/admin-login", (req, res) => {
  var adminId = "cc1BkAATqxf52oZo2P3q";
  var adminPassword = "ws1WQAMwap4tPJQFEHo0";
  var name = req.body.name;
  var password = req.body.password;
  if (adminId == name && adminPassword == password) {
    res.render("admin", { status: true, WorkCategoryArray: WorkCategoryArray });
  } else {
    res.redirect("/admin");
  }
});
let sub_id;
let selected_plan_id;
let total_count_var;
app.get("/checkout", isLoggedIn, async (req, res) => {
  let user = await User.findOne({ email: req.user.email })
  res.render("checkout", { user: user })
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
    console.log(response)
    res.json(response)
  })
})
app.post("/verify", async (req, res) => {
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
})
app.get("/cancel_subscription", isLoggedIn, (req, res) => {
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
})
app.get("/blog/:id", (req, res) => {
  Blog.findOne({ _id: req.params.id }, (err, blogPost) => {
    res.render("blogpage", { blogPost: blogPost })
  })
})
app.get("/forgotusername", (req, res) => {
  res.render("forgotusername")
})
app.post("/sendusernameforgotusername", (req, res) => {
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
function generateOTP() {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}
function unixToDate(unix) {
  let unixMilliSeconds = unix * 1000;
  let dateObject = new Date(unixMilliSeconds)
  let humanDateFormat = dateObject.toLocaleDateString()
  return humanDateFormat;
}