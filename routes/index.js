var express = require('express');
var services = require('../persistence_services/services');

var router = express.Router();

router.get('/', function (req, res, next) {
    res.send('ok');
});

module.exports = router;
