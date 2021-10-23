var express = require("express");
var app = express();

app.set("view engine","ejs");
app.use(express.static("public"));

app.listen(3000,function(){
    console.log("Server Started at port 3000");
})

app.get("/",function(req,res){
    res.render("home");
})
