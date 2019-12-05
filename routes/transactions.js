var express = require('express');
var router = express.Router();

var db = require('../persistence/index.js');

/**
 * Income: to add amount 10 to the virtual account with the id 1 without source:
 * This only works if the virtual account is backed by a real account and if the
 * amount is positive.
 * 
 * {
 *   "name": "transaction-1",
 *   "amount": 10,
 *   "TargetId": 1
 * }
 * 
 * Expense: remove money from a virtual account with id 1 without target.
 * This only works if the virtual account is backed by a real account
 * and if the amount is negative.
 * 
 * {
 *   "name": "transaction-1",
 *   "amount": -10,
 *   "SourceId": 1
 * }
 * 
 * Transfer between two virtual accounts:
 * 
 * {
 *   "name": "transaction-1",
 *   "amount": 22,
 *   "SourceId": 1,
 *   "TargetId": 2
 * }
 */
router.post('/create', function (req, res, next) {

    const transactionDescriptor = req.body;

    if ((typeof transactionDescriptor.SourceId === "undefined")
        && (typeof transactionDescriptor.TargetId === "undefined")) {

        // The 422 (Unprocessable Entity) status code means the server understands 
        // the content type of the request entity (hence a 415(Unsupported Media Type) 
        // status code is inappropriate), and the syntax of the request entity is correct 
        // (thus a 400 (Bad Request) status code is inappropriate) but was unable to process 
        // the contained instructions. For example, this error condition may occur if an XML 
        // request body contains well-formed (i.e., syntactically correct), but semantically 
        // erroneous, XML instructions.

        res.status(400).send('the transaction requires at least a SourceId or a TargetId or both!');
    }
    else if (typeof transactionDescriptor.SourceId === "undefined") {

        // money is added as an income to an account

        // start a transaction

        // load the virtual target account.
        // load the virtual target account's amount.

        // add the amount in the transaction virtual target account's amount

        // if there is a real account assigned to the virtual target account,
        // add money into the real account.

        // the amount is associated to the real account
        // the virtual account is associated to the real account

        /*
        {
            "name": "transaction-1",
            "amount": 100,
            "TargetId": 1
        }
        */

        alterVirtualAccount(
            transactionDescriptor.TargetId,
            transactionDescriptor.amount,
            transactionDescriptor.name).then((transaction) => {
                console.log('ddddone,');

                const result = transaction.get({
                    plain: true
                });

                res.send(result);
            });
    }
    else if (typeof transactionDescriptor.TargetId === "undefined") {

        /*
        {
            "name": "transaction-2",
            "amount": -50,
            "SourceId": 1
        }
        */

        alterVirtualAccount(
            transactionDescriptor.SourceId,
            transactionDescriptor.amount,
            transactionDescriptor.name).then((transaction) => {
                console.log('ddddone,');

                const result = transaction.get({
                    plain: true
                });

                res.send(result);
            });

    }
    else {

        var sourceAccount = null;
        var targetAccount = null;

        db.Account.findByPk(transactionDescriptor.SourceId)
            .then(account => {
                sourceAccount = account;

                const result = sourceAccount.get({
                    plain: true
                });
                console.log(result);

                return db.Account.findByPk(2)
            }).then(account => {
                targetAccount = account;

                const result = targetAccount.get({
                    plain: true
                });
                console.log(result);

            }).then(() => {

                var transaction = db.Transaction.create({
                    name: transactionDescriptor.name,
                    amount: transactionDescriptor.amount
                }).then((transaction) => {

                    // set source and target with the save: false option
                    // so that sequelize does not try to create those objects
                    transaction.setSource(sourceAccount, { save: false });
                    transaction.setTarget(targetAccount, { save: false });

                    transaction.save().then((transaction) => {
                        const result = transaction.get({
                            plain: true
                        });

                        res.send(result);
                    });
                });
            });
    }
});

function alterVirtualAccount(virtualAccountId, amount, name) {

    var targetAccountObject = null;
    var amountObject = null;

    console.log('alterVirtualAccount() ...');

    // load the virtual account
    return db.Account.findByPk(virtualAccountId)
        .then(account => {

            targetAccountObject = account;

            // load all the amounts associated with this virtual account by id
            var result = db.Amount.findAll({
                where: {
                    virtualaccountid: targetAccountObject.id
                }
            });

            return result;

        }).then(amounts => {

            amountObject = amounts[0];

            // increment the amount
            var newAmount = amountObject.amount + amount;

            // update the object
            amountObject.update({
                amount: newAmount
            }).then(() => { });

            if (typeof amountObject.realaccountid === "undefined") {
                res.send('ok');
                return;
            }

            // find real account
            var result = db.RealAccount.findByPk(amountObject.realaccountid);

            return result;

        }).then(realaccount => {

            var newAmount = realaccount.amount + amount;

            // update the object
            realaccount.update({
                amount: newAmount
            }).then(() => { });

        }).then(() => {

            console.log('saving transaction ...');

            return db.Transaction.create({
                name: name,
                amount: amount
            }).then((transaction) => {

                // set source and target with the save: false option
                // so that sequelize does not try to create those objects
                //transaction.setSource(sourceAccount, { save: false });
                transaction.setTarget(targetAccountObject, { save: false });

                // transaction.save().then((transaction) => {
                //     console.log('returning transaction ...');
                //     return transaction;
                // });

                //return transaction.save();
                //return transaction.save();
                return transaction.save();

                //return transaction;
            });
        });


}

module.exports = router;