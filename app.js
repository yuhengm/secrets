const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


/* Set up home page */

app.get("/", function (req, res) {
    res.render("home");
});

/* Set up login page */

app.get("/login", function (req, res) {
    res.render("login");
});

/* Set up register page */

app.get("/register", function (req, res) {
    res.render("register");
});

/* Set up server */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Our app is running on port ${PORT}`);
});