const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  researcher: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: null,
  },
  surename: {
    type: String,
    default: null,
  },
  affiliation: {
    type: String,
    default: null,
  },
  minicv: {
    type: String,
    default: null,
  },
  crg: {
    type: String,
    default: null,
  },
  state: {
    type: String,
    default: null,
  },
  img_path: {
    type: String,
    default: null,
  },
  fill_date: {
    type: Date,
    default: null,
  },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User_auth", UserSchema);
