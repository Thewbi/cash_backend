var express = require('express');
const sql = require('mssql');
var router = express.Router();

const sqlConfig = {
    user: 'root',
    password: 'test',
    server: '127.0.0.1:3306',
    database: 'cash'
}

/* GET home page. */
router.get('/', function (req, res, next) {


});

module.exports = router;
