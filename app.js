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
const WorkCategory = require("./models/workCategory");
const path = require('path');
const sgMail = require('@sendgrid/mail');
const indexRouter = require('./routes/indexRoutes');
const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const paymentRouter = require('./routes/paymentRoutes');
require('dotenv').config()
const YOUR_DOMAIN = "https://wwww.monkeysingh.com";
sgMail.setApiKey(process.env.TWILIO_API_KEY);
const instance = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_CONN_STRING, (err) => {
  if (err) console.log(err);
  else console.log("connected");
}
);
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
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


app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/payment', paymentRouter);

app.listen(PORT, function () {
  console.log(`Server Started at port ${PORT}`);
});



