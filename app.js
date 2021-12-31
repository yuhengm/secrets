require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

/* Authentication and password security */
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

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
    googleId: String
});

// add passportLocalMongoose to schema
secretUserSchema.plugin(passportLocalMongoose);
secretUserSchema.plugin(findOrCreate);

const SecretUser = new mongoose.model("SecretUser", secretUserSchema);

// use passportLocalMongoose in new model
passport.use(SecretUser.createStrategy());
passport.serializeUser(function (user, done) {
	done(null, user);
});
passport.deserializeUser(function (user, done) {
	done(null, user);
});
passport.serializeUser(SecretUser.serializeUser());
passport.deserializeUser(SecretUser.deserializeUser());
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/secrets",
			passReqToCallback: true,
		},
		function (request, accessToken, refreshToken, profile, done) {
            SecretUser.findOrCreate(
				{ googleId: profile.id },
				function (err, user) {
					return done(err, user);
				}
			);
		}
	)
);

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

/* Set up Google OAuth */

app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
	"/auth/google/secrets",
	passport.authenticate("google", {
		successRedirect: "/secrets",
		failureRedirect: "/login",
	}),
	function (req, res) {
		res.redirect("/");
	}
);

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
