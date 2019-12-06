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
        // Income (no source)
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
        // Expense (no target)
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

        // TODO: case where money is flowing into a target real account!

        /*
        // move cash into virtual account without altering real account
        {
            "name": "transaction-1",
            "amount": 50,
            "SourceId": 1,
            "TargetId": 4
        }
        */

        /*
        // move cash out of virtual account without altering real account
        {
            "name": "transaction-1",
            "amount": -50,
            "SourceId": 1,
            "TargetId": 1
        }
        */

        // is the target virtual account backed by a real account?
        // TODO:

        // if not:

        console.log('A');

        // move cash into the target virtual account
        insertIntoVirtualAccount(
            transactionDescriptor.SourceId,
            transactionDescriptor.TargetId,
            transactionDescriptor.amount,
            transactionDescriptor.name).then(() => {

                console.log('B');

                // remove cash from the source virtual account but not from the source real account
                insertIntoVirtualAccount(
                    transactionDescriptor.SourceId,
                    transactionDescriptor.SourceId,
                    (transactionDescriptor.amount * -1),
                    transactionDescriptor.name).then((amount) => {
                        res.send(amount);
                    });


            })

        // .then((amount) => {
        //     res.send(amount);
        // });




        // remove cash from the source virtual account but not from the source real account
        // TODO:

    }
});

// adds (removes) an amount into a virtual account without altering any real accounts
// Does not add a transaction
function insertIntoVirtualAccount(sourceVirtualAccountId, targetVirtualAccountId, amount, name) {

    console.log("insertIntoVirtualAccount ");
    console.log("sourceVirtualAccountId ", sourceVirtualAccountId);
    console.log("targetVirtualAccountId ", targetVirtualAccountId);
    console.log("amount ", amount);
    console.log("name ", name);

    // find all amounts by targetAccountId that are connected to source account it

    var sourceRealAccountId = -1;
    //var sourceRealAccountObject = null;

    return db.Account.findByPk(sourceVirtualAccountId)
        .then(sourceVirtualAccount => {

            // TODO: loading the real accout is not needed.
            // The real account id is stored in the amounts.
            // only look at the amounts, never look at real account objects
            // because when transferring from purely virtual to purely virtual account
            // you will not be able to load a real account because there is none at any
            // of the purely virtual accounts!

            if (sourceVirtualAccount.realaccountid === undefined) {

                // TODO: if there is no real account associated to the source virtual account,
                // find the amounts the source virtual account has for the source real account id
                // and transfer money from those
                return db.Account.build({ id: 17 });

            } else {

                return db.Account.findByPk(sourceVirtualAccount.realaccountid);
            }

        }).then(sourceRealAccount => {

            var sourceRealAccountObject = sourceRealAccount;
            sourceRealAccountId = sourceRealAccountObject.id;

            console.log('targetVirtualAccountId', targetVirtualAccountId);
            console.log('sourceRealAccountId', sourceRealAccountId);

            // find all amounts
            return db.Amount.findAll({
                where: {
                    virtualaccountid: targetVirtualAccountId,
                    realaccountid: sourceRealAccountId,
                }
            })

        }).then(amounts => {

            console.log('amounts', amounts);
            console.log('Array.isArray', Array.isArray(amounts));
            console.log('amounts.length', amounts.length);

            if (Array.isArray(amounts) && amounts.length) {

                // if one exists, alter that amount

                console.log('not empty');

                var amountObject = amounts[0];

                console.log('amount id', amountObject.id);
                console.log('amount amount', amountObject.amount);

                var newAmount = amountObject.amount + amount;

                console.log('new amount', newAmount);

                // update the existing object
                return amountObject.update({
                    amount: newAmount
                }).then((amount) => { return amount; });
            }
            else {

                // if none exists, create one

                console.log('empty');

                return db.Amount.create({
                    name: name,
                    amount: amount,
                    virtualaccountid: targetVirtualAccountId,
                    realaccountid: sourceRealAccountId
                }).then((amount) => {

                    return amount;
                });
            }

        })

}

// adds (removes) an amount into a virtual account and into its real account
// also ads a transaction
//
// TODO: separate code that creates a transaction from this method!
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

                return transaction.save();
            });
        });
}

module.exports = router;