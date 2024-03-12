require("dotenv").config();
const express = require("express");
const passport = require("passport");
const bodyParser = require('body-parser');
const catchAsync = require("../utils/catchAsync");
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const { isResearcher } = require("../middleware");

const data = require('../public/csv_db/us_db_110_balanced.json');
const samples = Object.keys(data)
const { Array } = require("../array")
const info_array = Array

const host = process.env.DB_HOST;
const username = process.env.DB_USER;
const passwd = process.env.DB_PASS;
const dbName = process.env.DBPG_NAME;

const { Pool, Client } = require("pg");

(async () => {
  const pool = new Pool({
    user: username,
    host: host,
    database: dbName,
    password: passwd,
    port: 5432
  });

  const client = await pool.connect();

  router.post('/research', isResearcher, async (req, res) => {
    const user = req.body.username
    //const client = await pool.connect();
    const text = 'SELECT username, id, case_number FROM users WHERE username = $1'
    client.query(text, [user], (err, resp) => {
	      if (err) {
   		    console.log(err.stack)
  	    } else
		//console.log('THIS');
		//console.log(resp.rows[0]);
          if (resp.rows[0]) {
            var obj = data[samples[resp.rows[0].case_number]]; 
	    if (resp.rows[0].case_number < 109)
                res.render('researchinit', { obj: obj, count: resp.rows[0].case_number, user_id: resp.rows[0].id, img_info: info_array[resp.rows[0].case_number] });
            else
		res.redirect("/userres");
	  } else {
            client.query('INSERT INTO users(username) VALUES($1)', [user], (err, resp) => {
            if (err) {
              console.log(err.stack)
              res.render('loginres', { messages: req.flash("login error") });
            } else {
              var obj = data[samples[resp.rows[0].case_number]]; 
              res.render('researchinit', { obj: obj, count: resp.rows[0].case_number, user_id: resp.rows[0].id, img_info: info_array[resp.rows[0].case_number] });
            }
          });
        }   
	    });
    });

  router.post('/research1', isResearcher, async (req, res) => {
    let count = req.body.count;
    let user_br = req.body.resp;
    let user_id = req.body.user_id;
    let real_br = req.body.real_br;
    let img_id = req.body.img_id;
    let img_info = req.body.img_info;
    console.log(req.body);
    //const client = await pool.connect();
    //console.log('THAT', count, user_id);
    if (count < 109) {
      client.query('INSERT INTO response(user_id, user_br, real_br, img_id, img_info) VALUES($1, $2, $3, $4, $5)', [user_id, user_br, real_br, img_id, img_info], (err, resp) => {
        if (err) {
          console.log(err.stack)
          res.render('loginres', { messages: req.flash("login error") });
        } else {
          count++;
          client.query('UPDATE users SET case_number = $1 WHERE id = $2', [count, user_id], (err, resp) => {
            if (err) {
	      console.log('ERR');
              count--
              img_info = info_array[count]
              var obj = data[samples[count]]
              res.render('researchinit',{obj: obj, count:count, user_id: user_id, img_info: img_info });
            } else {
              var obj = data[samples[count]]
	      //console.log(obj);
	      //console.log('THIS');
              res.render('researchinit',{obj: obj, count:count, user_id: user_id, img_info: info_array[count] });
            }
          })
        }
      }); 
    } else {
      console.log('THIS', count)
      pool.end();
      res.redirect("/userres");
      //res.render('userres',{msg: 'Você analisou todos os exames!!!'});
    }
  })

  router.get('/cancel', isResearcher, async (req, res) => {
    await pool.end();
    res.redirect("/userres");
    //res.render('userres',{msg: 'Análises parciais foram registradas...'});
  });
})().catch(console.error);

module.exports = router;
