require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

/* Authentication and password security */
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/* Authentication and password security */
app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: true,
	})
);
app.use(passport.initialize());
app.use(passport.session());

// localhost mongoDB
mongoose.connect("mongodb://127.0.0.1:27017/secretUserDB", {
	useNewUrlParser: true,
});
// mongoose.set("useCreateIndex", true);

const secretUserSchema = new mongoose.Schema({
	email: String,
	password: String,
});

// add passportLocalMongoose to schema
secretUserSchema.plugin(passportLocalMongoose);

const SecretUser = new mongoose.model("SecretUser", secretUserSchema);

// use passportLocalMongoose in new model
passport.use(SecretUser.createStrategy());
passport.serializeUser(SecretUser.serializeUser());
passport.deserializeUser(SecretUser.deserializeUser());

/* Set up home page */

app.route("/").get(function (req, res) {
	res.render("home");
});

/* Set up secret page */

app.get("/secrets", function (req, res) {
	if (req.isAuthenticated()) {
		res.render("secrets");
	} else {
		res.redirect("/login");
	}
});

/* Set up login page */

app.route("/login")
	.get(function (req, res) {
		res.render("login");
	})
	.post(function (req, res) {
		const secretUser = new SecretUser({
			username: req.body.username,
			password: req.body.password,
		});
		req.login(secretUser, function (err) {
			if (err) {
				console.log(err);
			} else {
				passport.authenticate("local")(req, res, function () {
					res.redirect("/secrets");
				});
			}
		});
	});

/* Set up register page */

app.route("/register")
	.get(function (req, res) {
		res.render("register");
	})
	.post(function (req, res) {
		SecretUser.register(
			{ username: req.body.username },
			req.body.password,
			function (err, user) {
				if (err) {
					console.log(err);
					res.redirect("/register");
				} else {
					passport.authenticate("local")(req, res, function () {
						res.redirect("/secrets");
					});
				}
			}
		);
	});

/* Set up submit page */

app.get("/submit", function (req, res) {
	res.render("submit");
});

/* Set up logout page */

app.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});

/* Set up server */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Our app is running on port ${PORT}`);
});
