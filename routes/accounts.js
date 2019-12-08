var express = require('express');
var services = require('../persistence_services/services');
var db = require('../persistence/index.js');

var router = express.Router();

router.get('/virtual', async function (req, res, next) {

    var accounts = await db.Account.findAll();

    for (var i = 0; i < accounts.length; i++) {

        var account = accounts[i];

        var amounts = await account.getAmounts();

        // compute total amount of money in this virtual account
        var totalAmount = 0;
        amounts.forEach(amount => {
            totalAmount += amount.amount;
        });

        // add the total amount as a custom data value to transfer it to the client
        account.dataValues.totalAmount = totalAmount;
    }

    res.status(200).send(accounts);
});

router.get('/virtual/:virtualaccountid', async function (req, res, next) {

    var virtualAccountId = req.params.virtualaccountid;

    var account = await services.retrieveVirtualAccountById(db, virtualAccountId);

    var amounts = await account.getAmounts();

    // compute total amount of money in this virtual account
    var totalAmount = 0;
    amounts.forEach(amount => {
        totalAmount += amount.amount;
    });

    // add the total amount as a custom data value to transfer it to the client
    account.dataValues.totalAmount = totalAmount;

    res.status(200).send(account);
});

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