var express = require('express');
var services = require('../persistence_services/services');
var db = require('../persistence/index.js');

var router = express.Router();

/*
{
	"name":"account-real-1",
	"amount":100
}
*/
router.post('/create/real', async function (req, res, next) {

    // create the real account
    var realAccountObject = req.body;

    // add real account
    var realAccount = await services.addRealAccount(db, realAccountObject.name, realAccountObject.amount);

    // virtual account for real account
    var virtualAccount = await services.addVirtualAccount(db, realAccountObject.name, realAccount);

    // amount for virtual account 1
    var amount1 = await services.addAmount(db, realAccount, virtualAccount, realAccountObject.amount);

    // return the virtual amount
    res.status(200).send(virtualAccount);
});

/*
{
	"name":"account-virtual-2"
}
*/
router.post('/create/virtual', async function (req, res, next) {

    var virtualAccountObject = req.body;

    // create the virtual account
    var virtualAccount = await services.addVirtualAccount(db, virtualAccountObject.name, null);

    // return the virtual amount
    res.status(200).send(virtualAccount);
});

module.exports = router;