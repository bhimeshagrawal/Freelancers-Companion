var express = require("express");
var app = express();
var passport = require("passport")
const PORT = process.env.PORT || 3000;

app.set("view engine","ejs");
app.use(express.static("public"));

app.listen(PORT,function(){
    console.log(`Server Started at port ${PORT}`);
})

app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/signup",function(req,res){
    res.render("signup")
})

var projectList = [
    {
        _id:"1",
        title : "Captain Americal Artwork",
        image : "https://source.unsplash.com/random/",
        completedDate: "",
        orderedDate:"11/11/11",
        category : "Artwork",
        estimatedDate : "-",
        status : "pending", 
    },{
        _id:"",
        title : "Captain Americal Logo",
        image : "https://source.unsplash.com/random/",
        completedDate: "",
        orderedDate:"20/11/11",
        category : "Logo",
        estimatedDate : "12/10/2021",
        status : "active",
    },
    {
        _id:"",
        title : "Captain Americal Poster",
        image : "https://source.unsplash.com/random/",
        completedDate: "13/12/21",
        orderedDate:"11/11/11",
        category : "Poster",
        estimatedDate : "12/10/2021",
        status : "completed", 
    },{
        _id:"1",
        title : "Captain Americal Artwork",
        image : "https://source.unsplash.com/random/",
        completedDate: "",
        orderedDate:"11/11/11",
        category : "Artwork",
        estimatedDate : "-",
        status : "pending", 
    },
    {
        _id:"1",
        title : "Captain Americal Artwork",
        image : "https://source.unsplash.com/random/",
        completedDate: "",
        orderedDate:"11/11/11",
        category : "Artwork",
        estimatedDate : "-",
        status : "pending", 
    },
    {
        _id:"1",
        title : "Captain Americal Artwork",
        image : "https://source.unsplash.com/random/",
        completedDate: "",
        orderedDate:"11/11/11",
        category : "Artwork",
        estimatedDate : "-",
        status : "pending", 
    },
    {
        _id:"1",
        title : "Captain Americal Artwork",
        image : "https://source.unsplash.com/random/",
        completedDate: "",
        orderedDate:"11/11/11",
        category : "Artwork",
        estimatedDate : "-",
        status : "pending", 
    },
    {
        _id:"1",
        title : "Captain Americal Artwork",
        image : "https://source.unsplash.com/random/",
        completedDate: "",
        orderedDate:"11/11/11",
        category : "Artwork",
        estimatedDate : "-",
        status : "pending", 
    }
]
app.get("/app",function(req,res){
    res.render("app",{projectList : projectList});
})

