const { Double } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UsSchema = new Schema({
  pt_id: {
    type: String,
  },
  username: {
    type: String,
  },
  affiliation: {
    type: String,
  },
  bt_date: {
    type: Date,
  },
  personal_hist: {
    type: String,
  },
  family_hist: {
    type: String,
  },
  mutation: {
    type: String,
  },
  pre_biopsy: {
    type: String,
  },
  us_date: {
    type: Date,
  },
  birads: {
    type: String,
  },
  size: {
    type: String,
  },
  palpable: {
    type: String,
  },
  vessels: {
    type: String,
  },
  ir: {
    type: String,
  },
  shape: {
    type: String,
  },
  margins: {
    type: String,
  },
  orientation: {
    type: String,
  },
  img_path0: {
    type: String,
  },
  img_path1: {
    type: String,
  },
  pdf_path: {
    type: String,
  },
  fill_date: {
    type: Date,
  },
  histology: {
    type: String,
  },
  grade: {
    type: String,
  },
  er: {
    type: String,
  },
  er_percent: {
    type: String,
  },
  pr: {
    type: String,
  },
  pr_percent: {
    type: String,
  },
  ki67: {
    type: String,
  },
  her2: {
    type: String,
  },
  ish: {
    type: String,
  },
});

UsSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Us_data", UsSchema);
