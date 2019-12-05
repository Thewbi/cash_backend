var express = require('express');
var router = express.Router();

var db = require('../persistence/index.js');

router.post('/create/real', function (req, res, next) {

    console.log('/create/real');
    console.log(req.body);

    var realAccount = null;
    var virtualAccount = null;
    var amount = null;

    db.sequelize.sync().then(function () {

        console.log('start');

        // create the real account
        var realAccountObject = req.body;
        realAccountObject.amount = 0;
        var realAccountBuild = db.RealAccount.build(realAccountObject);
        // save() is asynchronous, the result is only available in the then-case!
        var realAccountPromise = realAccountBuild.save()
            .then(function (realAccountParameter) {
                console.log('Real Account saved!')
                realAccount = realAccountParameter;
            });

        // create the virtual account
        var virtualAccountObject = req.body;
        virtualAccountObject.name += '-virtual';
        var virtualAccountBuild = db.Account.build(virtualAccountObject);
        // save() is asynchronous, the result is only available in the then-case!
        var virtualAccountPromise = virtualAccountBuild.save()
            .then(function (virtualAccountParameter) {
                console.log('Virtual Account saved!')
                virtualAccount = virtualAccountParameter;
            });

        // create the amount
        var amountObject = {};
        amountObject.amount = 0;
        var amountObjectBuild = db.Amount.build(amountObject)
        // save() is asynchronous, the result is only available in the then-case!
        var amountPromise = amountObjectBuild.save()
            .then(function (amountParameter) {
                console.log('Amount saved!')
                amount = amountParameter;

                db.sequelize.sync().then(function () {

                    // virtual account to real account
                    virtualAccount.setRealAccount(realAccount);

                    // amount to real account
                    amount.setRealAccount(realAccount);

                    // amount to virtual account.
                    amount.setAccount(virtualAccount);
                });

                return virtualAccount;

            }).then(function (virtualAccount) {

                // convert account to json
                const result = virtualAccount.get({
                    plain: true
                });

                // return the virtual account
                res.send(result);
            });
    });
});

router.post('/create/virtual', function (req, res, next) {

    console.log('/create/virtual');
    console.log(req.body);

    db.sequelize.sync().then(function () {

        // create a real account and pass it on
        return db.Account.create(req.body);

    }).then(function (virtualAccount) {

        // convert account to json
        const result = virtualAccount.get({
            plain: true
        });

        // return the virtual account
        res.send(result);
    });

});

module.exports = router;