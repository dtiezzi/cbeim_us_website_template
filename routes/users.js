require("dotenv").config();
const express = require("express");
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const router = express.Router();
const User = require("../models/user");
const multer = require("multer");
const upload = multer({ dest: "public/pictures/" });
const { MongoClient, ObjectId } = require("mongodb");

const { isLoggedIn } = require("../middleware");

(async () => {
  const url = "mongodb://localhost:27017";

  //const host = process.env.DB_HOST;
  //const user = process.env.DB_USER;
  //const pass = process.env.DB_PASS;
  const dbName = process.env.DB_NAME;

  //const url = `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
  console.info("Conectando ao banco de dados...");

  const client = await MongoClient.connect(url, { useUnifiedTopology: true });

  console.info("MongoDB conectado com sucesso!");

  const db = client.db(dbName);

  router.get("/register", async (req, res) => {
    res.render("users/register");
  });

  router.post(
    "/register",
    catchAsync(async (req, res) => {
      try {
        const { username, email, password } = req.body;
        const emails = db.collection("emails");
        const email_obj = await await emails.find().toArray();
        const email_list = [];
        for (let i = 0; i < email_obj.length; i++)
          email_list.push(email_obj[i].email);
        const active = email_list.includes(email);
        const fill_date = new Date();
        const user = new User({ email, username, fill_date });
        const registerUser = await User.register(user, password);
        req.flash("success", "Welcome to COVIRT!");
        res.redirect("login");
      } catch (e) {
        console.log("ERROR");
        req.flash("error", e.message);
        res.redirect("register");
      }
    })
  );

  router.get("/login", (req, res) => {
    res.render("login", { messages: req.flash("error") });
  });

  router.post(
    "/login",
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    (req, res) => {
      req.flash("success", "Welcome!!");
      res.redirect("/user");
    }
  );

  router.get("/loginres", (req, res) => {
    res.render("loginres", { messages: req.flash("error") });
  });

  router.post(
    "/loginres",
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/loginres",
    }),
    (req, res) => {
      req.flash("success", "Bem vindo!");
      res.redirect("/userres");
    }
  );

  router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged out!");
    res.redirect("/");
  });

  router.get("/updateuser", isLoggedIn, async (req, res) => {
    const affiliation = await User.distinct("affiliation");
    affiliation.sort();
    affiliation.push("Other");
    const info = req.user;
    res.render("users/updateuser", {
      id: info.id,
      user: info.username,
      name: info.name,
      surename: info.surename,
      affiliation: affiliation,
      minicv: info.minicv,
      crg: info.crg,
      state: info.state,
      email: info.email,
      image: info.img_path,
    });
  });

  router.post(
    "/updateuser",
    isLoggedIn,
    upload.single("image"),
    catchAsync(async (req, res) => {
      try {
        const {
          id,
          name,
          surename,
          affiliation,
          aff_other,
          minicv,
          crg,
          state,
          email,
          image,
        } = req.body;
        let us = await User.findOne({ username: req.user.username });

        await User.updateOne(
          { username: req.user.username },
          { username: req.user.username }
        );
        us.name = name;
        us.surename = surename;
        if (affiliation == "Other") us.affiliation = aff_other;
        else us.affiliation = affiliation;
        us.minicv = minicv;
        us.crg = crg;
        us.state = state;
        us.email = email;
        if (req.file) us.img_path = req.file.path.slice(7);
        us.fill_date = new Date();
        await us.save();
        // req.flash("success", "Welcome to COVIRT!");
        res.redirect("user");
      } catch (e) {
        console.log("ERROR");
        req.flash("error", e.message);
        res.redirect("user");
      }
    })
  );
})();

module.exports = router;
