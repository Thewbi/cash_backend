var express = require('express');
var services = require('../persistence_services/services');
var db = require('../persistence/index.js');

var router = express.Router();

const Op = db.Sequelize.Op;

router.get('/:virtualaccountid', async function (req, res, next) {

    //console.log(req.params);
    //console.log(req.params.virtualaccountid);

    var virtualAccountId = req.params.virtualaccountid;

    var result = await db.Transaction.findAll({
        where: {
            [Op.or]: [{ SourceId: virtualAccountId }, { TargetId: virtualAccountId }]
        }
    });

    res.status(200).send(result);

});

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
router.post('/create', async function (req, res, next) {

    const transactionDescriptor = req.body;

    console.log(transactionDescriptor);

    if ((typeof transactionDescriptor.SourceId === "undefined" || transactionDescriptor.SourceId <= 0)
        && (typeof transactionDescriptor.TargetId === "undefined" || transactionDescriptor.TargetId <= 0)) {

        // The 422 (Unprocessable Entity) status code means the server understands 
        // the content type of the request entity (hence a 415(Unsupported Media Type) 
        // status code is inappropriate), and the syntax of the request entity is correct 
        // (thus a 400 (Bad Request) status code is inappropriate) but was unable to process 
        // the contained instructions. For example, this error condition may occur if an XML 
        // request body contains well-formed (i.e., syntactically correct), but semantically 
        // erroneous, XML instructions.

        res.status(400).send('the transaction requires at least a SourceId or a TargetId or both!');

    } else if (typeof transactionDescriptor.SourceId === "undefined" || transactionDescriptor.SourceId <= 0) {

        var result = await services.alterVirtualAccount(db, transactionDescriptor.TargetId, transactionDescriptor.amount, false, transactionDescriptor.name);
        res.status(200).send(result);

    } else if (typeof transactionDescriptor.TargetId === "undefined" || transactionDescriptor.TargetId <= 0) {

        var result = await services.alterVirtualAccount(db, transactionDescriptor.SourceId, transactionDescriptor.amount, true, transactionDescriptor.name);
        res.status(200).send(result);

    } else {

        var sourceVirtualAccount = await services.retrieveVirtualAccountById(db, transactionDescriptor.SourceId);
        console.log('Source:', sourceVirtualAccount);

        var targetVirtualAccount = await services.retrieveVirtualAccountById(db, transactionDescriptor.TargetId);
        console.log('Target:', targetVirtualAccount);

        await services.transferAmount(db, sourceVirtualAccount, targetVirtualAccount, transactionDescriptor.amount);

        var result = await services.addTransaction(db, sourceVirtualAccount.id, targetVirtualAccount.id, transactionDescriptor.name, transactionDescriptor.amount);

        // insert transaction 
        res.status(200).send(result);
    }

});

module.exports = router;