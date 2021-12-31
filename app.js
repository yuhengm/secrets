const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// localhost mongoDB
mongoose.connect("mongodb://127.0.0.1:27017/secretUserDB", {
  useNewUrlParser: true,
});

/* Create user database for Secret website */

const secretUserSchema = {
  email: String,
  password: String,
};
const SecretUser = new mongoose.model("SecretUser", secretUserSchema);

/* Set up home page */

app.route("/").get(function (req, res) {
  res.render("home");
});

/* Set up login page */

app
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post(function (req, res) {
    const email = req.body.username;
    const password = req.body.password;
    SecretUser.findOne({ email: email }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser && foundUser.password === password) {
          res.render("secrets");
        } else {
          res.render("home");
        }
      }
    });
  });

/* Set up register page */

app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(function (req, res) {
    const newUser = new SecretUser({
      email: req.body.username,
      password: req.body.password,
    });
    newUser.save(function (err) {
      if (!err) {
        res.render("secrets");
      } else {
        console.log(err);
      }
    });
  });

/* Set up server */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Our app is running on port ${PORT}`);
});
