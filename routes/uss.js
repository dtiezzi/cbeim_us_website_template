require("dotenv").config();
const express = require("express");
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
const md5 = require("md5");
const router = express.Router();
const User = require("../models/user");
const Us = require("../models/us");
const { encrypt, decrypt } = require("../crypto");
const multer = require("multer");
const upload = multer({ dest: "public/pictures/" });
const upload_us = multer({ dest: "public/us_img/" });
const upload_pdf = multer({ dest: "public/us_pdf" });
const { MongoClient, ObjectId, MongoTimeoutError } = require("mongodb");
const moment = require("moment");

const { isLoggedIn } = require("../middleware");

(async () => {
  const url = "mongodb://localhost:27017";

  const dbName = process.env.DB_NAME;

  console.info("Conectando ao banco de dados...");

  const client = await MongoClient.connect(url, { useUnifiedTopology: true });

  console.info("MongoDB conectado com sucesso!");

  const db = client.db(dbName);

  router.use((req, res, next) => {
    res.locals.moment = moment;
    next();
  });

  router.get("/ptregister", isLoggedIn, async (req, res) => {
    const username = req.user.username;
    const affiliation = req.user.affiliation;
    res.render("us/ptregister", {
      username: username,
      affiliation: affiliation,
    });
  });

  const salt = process.env.SECRETKEY;

  router.get("/usregister", isLoggedIn, async (req, res) => {
    const pt_hash = md5(req.query.pt_id + salt);

    const search_id = await db
      .collection("us_datas")
      .find({ pt_id: pt_hash, username: req.query.username })
      .toArray();
    const res_search = Object.keys(search_id).length;
    console.log(Object.keys(search_id).length);
    if (res_search > 0) {
      res.render("us/ptregister", {
        username: req.user.username,
        affiliation: req.user.affiliation,
      });
    } else {
      res.render("us/usregister", {
        pt_id: pt_hash,
        username: req.query.username,
        affiliation: req.query.affiliation,
        birth_dt: req.query.birth_dt,
        personal_history: req.query.personal_hist,
        familial_history: req.query.familial_history,
        mutation: req.query.mutation,
        previous_bx: req.query.pre_biopsy,
      });
    }
  });

  router.post(
    "/usregister",
    isLoggedIn,
    upload_us.single("img_path"),
    catchAsync(async (req, res) => {
      fill_date = new Date();

      const pt = new Us({
        pt_id: req.body.pt_id,
        username: req.body.username,
        affiliation: req.body.affiliation,
        bt_date: req.body.birth_dt,
        personal_hist: req.body.personal_history,
        family_hist: req.body.familial_history,
        mutation: req.body.mutation,
        pre_biopsy: req.body.previous_bx,
        us_date: req.body.us_dt,
        birads: req.body.br,
        size: req.body.size,
        palpable: req.body.palpable,
        vessels: req.body.vessels,
        ir: req.body.ir,
        shape: req.body.shape,
        margins: req.body.margins,
        orientation: req.body.orientation,
        fill_date: fill_date,
      });
      if (req.file) {
        pt.img_path0 = req.file.path.slice(7);
      }
      await pt.save();
      res.redirect("user");
    })
  );

  router.get("/ptsearch", isLoggedIn, async (req, res) => {
    const username = req.user.username;
    const affiliation = req.user.affiliation;
    let source = req.query.search_type;
    res.render("us/ptsearch", {
      username: username,
      affiliation: affiliation,
      source: source,
    });
  });

  router.post("/ptsearch", isLoggedIn, async (req, res) => {
    const pt_hash = md5(req.body.pt_id + salt);
    console.log(pt_hash);
    let pt_id = pt_hash;
    const source = req.body.search_type;
    const username = req.user.username;
    const affiliation = req.body.affiliation;
    const multiple = req.body.multipe;
    const result = await db
      .collection("us_datas")
      .find({ pt_id: pt_id, username: username })
      .toArray();
    const objlen = Object.keys(result).length;
    if (objlen == 0)
      res.render("us/ptsearch", {
        username: username,
        affiliation: affiliation,
        source: source,
      });
    else if (objlen == 1) {
      const _id = result[0]._id;
      if (source == "pathology") {
        res.render("us/pathology", {
          _id: _id,
          pt_id: pt_id,
          username: username,
          affiliation: affiliation,
          multiple: multiple,
        });
      } else if (source == "newimg") {
        res.render("us/newimg", {
          _id: _id,
          pt_id: pt_id,
          username: username,
          affiliation: affiliation,
          multiple: multiple,
        });
      } else if (source == "pdf") {
        res.render("us/pdfreport", {
          _id: _id,
          pt_id: pt_id,
          username: username,
          affiliation: affiliation,
          multiple: multiple,
        });
      } else if (source == "newnodule") {
        res.render("us/newnodule", {
          _id: _id,
          pt_id: pt_id,
          username: username,
          affiliation: affiliation,
          multiple: multiple,
        });
      } else if (source == "reviewus") {
        res.render("us/reviewus", {
          _id: _id,
          pt_id: pt_id,
          username: username,
          affiliation: affiliation,
          multiple: multiple,
        });
      }
    } else if (source == "newnodule") {
      res.render("us/newnodule", {
        pt_id: pt_id,
        username: username,
        affiliation: affiliation,
        multiple: multiple,
      });
    } else {
      res.render("us/multipleus", {
        pt_id: pt_id,
        username: username,
        affiliation: affiliation,
        source: source,
        result: result,
      });
    }
  });

  router.get("/multipleus", isLoggedIn, async (req, res) => {
    const username = req.user.username;
    const affiliation = req.user.affiliation;
    res.render("us/multipleus");
  });

  router.post("/confirmid", isLoggedIn, async (req, res) => {
    const _id = req.body._id;
    const pt_id = req.body.pt_id;
    const username = req.body.username;
    const affiliation = req.body.affiliation;
    const source = req.body.search_type;
    const multiple = req.body.multiple;
    console.log(_id, multiple);

    if (source == "pathology") {
      res.render("us/pathology", {
        _id: _id,
        pt_id: pt_id,
        username: username,
        affiliation: affiliation,
        multiple: multiple,
      });
    } else if (source == "newimg") {
      res.render("us/newimg", {
        _id: _id,
        pt_id: pt_id,
        username: username,
        affiliation: affiliation,
        multiple: multiple,
      });
    } else if (source == "pdf") {
      res.render("us/pdfreport", {
        _id: _id,
        pt_id: pt_id,
        username: username,
        affiliation: affiliation,
        multiple: multiple,
      });
    } else if (source == "newnodule") {
      res.render("us/newnodule", {
        _id: _id,
        pt_id: pt_id,
        username: username,
        affiliation: affiliation,
        multiple: multiple,
      });
    } else if (source == "reviewus") {
      try {
        let us = await Us.findOne({ _id: _id });
        res.render("us/reviewus", {
          us: us,
          _id: _id,
          pt_id: pt_id,
          username: username,
          affiliation: affiliation,
          multiple: multiple,
        });
      } catch (e) {
        res.redirect("user");
      }
    }
  });

  router.get("/pathology", isLoggedIn, async (req, res) => {
    const username = req.user.username;
    const affiliation = req.user.affiliation;
    res.render("us/pathology", {
      username: username,
      affiliation: affiliation,
    });
  });

  router.post(
    "/pathology",
    isLoggedIn,
    catchAsync(async (req, res) => {
      try {
        const _id = req.body._id;
        const histo = req.body.histo;
        const grade = req.body.grade;
        const er = req.body.er;
        const er_perc = req.body.er_perc;
        const pr = req.body.pr;
        const pr_perc = req.body.pr_perc;
        const ki67 = req.body.ki67;
        const her2 = req.body.her2;
        const ish = req.body.ish;
        let us = await Us.findOne({ _id });
        await Us.updateOne({ _id: _id }, { _id: _id });
        us.histology = histo;
        us.grade = grade;
        us.er = er;
        us.er_percent = er_perc;
        us.pr = pr;
        us.pr_percent = pr_perc;
        us.ki67 = ki67;
        us.her2 = her2;
        us.ish = ish;
        await us.save();
        res.redirect("user");
      } catch (e) {
        console.log("ERROR");
        req.flash("error", e.message);
        res.redirect("user");
      }
    })
  );

  router.get("/newimg", isLoggedIn, async (req, res) => {
    const username = req.user.username;
    const affiliation = req.user.affiliation;
    console.log(username);
    res.render("us/newimg", { username: username, affiliation: affiliation });
  });

  router.post(
    "/newimg",
    isLoggedIn,
    upload_us.single("img_path1"),
    catchAsync(async (req, res) => {
      try {
        const _id = req.body._id;
        let us = await Us.findOne({ _id });
        await Us.updateOne({ _id: _id }, { _id: _id });
        if (req.file) us.img_path1 = req.file.path.slice(7);
        await us.save();

        res.redirect("user");
      } catch (e) {
        console.log("ERROR");
        req.flash("error", e.message);
        res.redirect("user");
      }
    })
  );

  router.get("/pdfreport", isLoggedIn, async (req, res) => {
    const username = req.user.username;
    const affiliation = req.user.affiliation;
    console.log(username);
    res.render("us/pdfreport", {
      username: username,
      affiliation: affiliation,
    });
  });

  router.post(
    "/pdfreport",
    isLoggedIn,
    upload_pdf.single("pdf_path"),
    catchAsync(async (req, res) => {
      try {
        const _id = req.body._id;
        let us = await Us.findOne({ _id });
        await Us.updateOne({ _id: _id }, { _id: _id });
        if (req.file) us.img_path1 = req.file.path.slice(7);
        await us.save();
        res.redirect("user");
      } catch (e) {
        console.log("ERROR");
        req.flash("error", e.message);
        res.redirect("user");
      }
    })
  );

  router.get("/newnodule", isLoggedIn, async (req, res) => {
    const username = req.user.username;
    const affiliation = req.user.affiliation;
    console.log(username);
    res.render("us/newnodule", {
      username: username,
      affiliation: affiliation,
    });
  });

  router.post(
    "/newnodule",
    isLoggedIn,
    upload_us.single("img_path"),
    catchAsync(async (req, res) => {
      fill_date = new Date();
      const pt = new Us({
        pt_id: req.body.pt_id,
        username: req.body.username,
        affiliation: req.body.affiliation,
        bt_date: req.body.birth_dt,
        personal_hist: req.body.personal_history,
        family_hist: req.body.familial_history,
        mutation: req.body.mutation,
        pre_biopsy: req.body.previous_bx,
        us_date: req.body.us_dt,
        birads: req.body.br,
        size: req.body.size,
        palpable: req.body.palpable,
        vessels: req.body.vessels,
        ir: req.body.ir,
        shape: req.body.shape,
        margins: req.body.margins,
        orientation: req.body.orientation,
        fill_date: fill_date,
      });
      if (req.file) {
        pt.img_path0 = req.file.path.slice(7);
      }
      await pt.save();
      res.redirect("user");
    })
  );

  router.post(
    "/reviewus",
    isLoggedIn,
    upload_us.single("img_path"),
    catchAsync(async (req, res) => {
      const _id = req.body._id;
      fill_date = new Date();
      try {
        let us = await Us.findOne({ _id: _id });
        await Us.updateOne(
          { _id: _id },
          {
            us_date: req.body.us_dt,
            birads: req.body.br,
            size: req.body.size,
            palpable: req.body.palpable,
            vessels: req.body.vessels,
            ir: req.body.ir,
            shape: req.body.shape,
            margins: req.body.margins,
            orientation: req.body.orientation,
            fill_date: fill_date,
          }
        );
        if (req.file) {
          us.img_path0 = req.file.path.slice(7);
        }
        await us.save();
        res.redirect("user");
      } catch (e) {
        res.redirect("user");
      }
    })
  );

  router.post(
    "/searchmyus",
    isLoggedIn,
    catchAsync(async (req, res) => {
      const username = req.user.username;
      try {
        let result = await Us.find({ username: username });
        res.render("us/viewmyus", { username: username, result: result });
      } catch (e) {
        res.redirect("user");
      }
    })
  );

  router.post(
    "/deldata",
    isLoggedIn,
    catchAsync(async (req, res) => {
      const _id = req.body._id;
      const username = req.user.username;
      try {
        await Us.deleteOne({ _id: _id });
        let result = await Us.find({ username: username });
        res.render("us/viewmyus", { username: username, result: result });
      } catch (e) {
        res.redirect("user");
      }
    })
  );
})();

module.exports = router;
