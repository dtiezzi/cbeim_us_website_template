require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const multer = require("multer");
const upload = multer({ dest: "public/pictures/" });

const User = require("./models/user");
const userRoutes = require("./routes/users");
const Us = require("./models/us");
const usRoutes = require("./routes/uss");
const resRoutes = require("./routes/research");

const SECRET = process.env.SECRET;

mongoose
  .connect("mongodb://localhost:27017/usDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB CONNECTION OPEN!");
  })
  .catch((err) => {
    console.log(err);
  });

app.set("view engine", "ejs");
app.set("views", "views");

//app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SECRET,
    cookie: {
      maxAge: 4000000,
    },
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(__dirname + "/public"));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use("/", userRoutes);
app.use("/", usRoutes);
app.use("/", resRoutes);

const { isLoggedIn, isResearcher } = require("./middleware");

const { isAdmin } = require("./middleware");
const user = require("./models/user");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/user", isLoggedIn, async (req, res) => {
  const user = req.user.username;
  const info = req.user;
  const m_list = await Us.find();
  let br_list = [];
  let hist_list = [];
  let aff_list = [];
  for (var i = 0; i < Object.keys(m_list).length; i++) {
    br_list.push(m_list[i].birads);
    hist_list.push(m_list[i].histology);
    aff_list.push(m_list[i].affiliation);
  }
  const br_counts = {};
  const hist_counts = {};
  const aff_counts = {};

  for (const num of br_list) {
    br_counts[num] = br_counts[num] ? br_counts[num] + 1 : 1;
  }
  for (const num of hist_list) {
    hist_counts[num] = hist_counts[num] ? hist_counts[num] + 1 : 1;
  }
  for (const num of aff_list) {
    aff_counts[num] = aff_counts[num] ? aff_counts[num] + 1 : 1;
  }
  ky = ["2", "3", "4A", "4B", "4C", "5", "6"];
  const m_list1 = {};
  for (const k of ky) m_list1["br" + k] = br_counts[k];
  ky_histo = { 0: "benign", 1: "malignant", 2: "lr", undefined: "undefined" };
  const m_list2 = {};
  for (const k of Object.keys(ky_histo)) m_list2[ky_histo[k]] = hist_counts[k];
  res.render("user", {
    id: info.id,
    name: info.name,
    surename: info.surename,
    affiliation: info.affiliation,
    crg: info.crg,
    state: info.state,
    aff_url: info.aff_url,
    email: info.email,
    img_path: info.img_path,
    admin: req.user.admin,
    m_list1: m_list1,
    m_list2: m_list2,
    m_list3: aff_counts,
  });
});

app.get("/userres", isResearcher, async (req, res) => {
  const user = req.user.username;
  const info = req.user;
  res.render("userres", {
    username: info.username,
    id: info.id,
    name: info.name,
    surename: info.surename,
    affiliation: info.affiliation,
    crg: info.crg,
    state: info.state,
    aff_url: info.aff_url,
    email: info.email,
    img_path: info.img_path,
    msg: '',
  });
});

app.get("/admin", isAdmin, async (req, res) => {
  const m_list = await User.find();
  res.render("admin", { m_list });
});

app.get("/information", isLoggedIn, (req, res) => {
  res.render("information");
});

app.post("/user/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  let us = await User.findOne({ _id: id }, { _id: id });
  await User.updateOne({ id: id });
  us.active = false;
  await us.save();
  if (!req.user.admin) {
    req.logout();
    res.redirect("/");
  } else {
    const m_list = await User.find();
    res.render("admin", { m_list });
  }
});

// app.get("/edituser", isAdmin, (req, res) => {
//   res.render("edituser");
// });

app.post("/edituser", isAdmin, upload.single("image"), async (req, res) => {
  const affiliation = await User.distinct("affiliation");
  affiliation.sort();
  affiliation.push("Other");
  const id = req.body.id;
  const us = await User.findOne({ _id: id });
  const img_path = null;
  if (req.file) img_path = req.file.path.slice(7);
  else img_path = us.img_path;
  res.render("edituser", {
    id: us.id,
    name: us.name,
    middlename: us.middlename,
    surename: us.surename,
    affiliation: affiliation,
    position: us.position,
    expertise: us.expertise,
    aff_url: us.aff_url,
    email: us.email,
    img_path: img_path,
    active: us.active,
    admin: us.admin,
  });
});

app.get("/academia", async (req, res) => {
  const m_list = await User.find({ aff_nature: "academia" });
  const affiliations = await User.find().distinct("affiliation");
  res.render("academia", { affiliations, m_list });
});

app.get("/others", async (req, res) => {
  const m_list = await User.find({
    $or: [
      { aff_nature: "government" },
      { aff_nature: "industry" },
      { aff_nature: "research institute" },
      { aff_nature: "other" },
    ],
  });
  const affiliations = await User.find().distinct("affiliation");
  res.render("others", { affiliations, m_list });
});

app.listen(5000, () => {
  console.log("[INFO] US API is running on port 5000...");
});
