async function addVirtualAccount(db, name, realAccount) {

    // if a real account was specified, connect the virtual account to that real account
    if (realAccount) {
        return db.Account.create({
            name: name,
            realaccountid: realAccount.id
        });
    }

    // create a sole virtual account without connection to a real account
    return db.Account.create({
        name: name
    });
};

async function transferAmount(db, virtualAccountSource, virtualAccountTarget, amount) {

    if (amount <= 0) {
        console.log('amount has to be larger than zero!');
        return;
    }

    // accumulate the amount of money in the source account
    var sourceAmounts = await virtualAccountSource.getAmounts();

    if (typeof sourceAmounts === 'undefined' || sourceAmounts.length === 0) {
        console.log('No source amounts!');
        return;
    }

    var totalAmountInSource = 0;
    sourceAmounts.forEach(sourceAmount => {
        totalAmountInSource += sourceAmount.amount;
    });

    // check if the source amount can serve the request
    if (totalAmountInSource < amount) {
        console.log('There is not enough money in the source account!');
        return;
    }

    var amountLeft = amount;

    // copy amounts until the total amount was transferred
    for (var i = 0; i < sourceAmounts.length; i++) {

        var sourceAmount = sourceAmounts[i];

        // create amount in target virtual account
        var targetAmount = null;
        var targetAmounts = await findAmountInVirtualAccount(db, virtualAccountTarget, sourceAmount.realaccountid);
        if (typeof targetAmounts !== 'undefined' && targetAmounts.length > 0) {

            targetAmount = targetAmounts[0];

        } else {

            targetAmount = await addAmountByIds(db, sourceAmount.realaccountid, virtualAccountTarget.id, 0);
        }

        if (amountLeft <= sourceAmount.amount) {

            sourceAmount.amount -= amountLeft;
            await sourceAmount.save().then(() => { });
            targetAmount.amount += amountLeft;
            await targetAmount.save().then(() => { });

            // if there is a physical account backing the target virtual account
            // transfer real money

            if (virtualAccountTarget.realaccountid) {

                var realAccount = await virtualAccountTarget.getRealAccount();
                realAccount.amount += amountLeft;
                await realAccount.save().then(() => { });

                // subtract from the source real account
                var sourceRealAccount = await sourceAmount.getRealAccount();
                sourceRealAccount.amount -= amountLeft;
                await sourceRealAccount.save().then(() => { });
            }

            amountLeft = 0;

            // do not iterate further
            break;

        } else {

            var oldSourceAmount = sourceAmount.amount;

            sourceAmount.amount = 0;
            await sourceAmount.save().then(() => { });
            targetAmount.amount += oldSourceAmount;
            await targetAmount.save().then(() => { });

            // if there is a physical acount backing the target virtual account
            // transfer real money
            if (virtualAccountTarget.realaccountid) {

                var realAccount = await virtualAccountTarget.getRealAccount();
                realAccount.amount += oldSourceAmount;
                await realAccount.save().then(() => { });

                // subtract from the source real account
                var sourceRealAccount = await sourceAmount.getRealAccount();
                sourceRealAccount.amount -= oldSourceAmount;
                await sourceRealAccount.save().then(() => { });
            }

            amountLeft -= oldSourceAmount;
        }
    }
}

async function findAmountInVirtualAccount(db, virtualAccount, realaccountid) {
    return db.Amount.findAll({
        where: {
            realaccountid: realaccountid,
            virtualaccountid: virtualAccount.id
        }
    });
}

async function retrieveTransactionById(db, transactionId) {
    return await db.Transaction.findOne({ where: { id: transactionId } });
}

async function addRealAccount(db, name, amount) {
    return db.RealAccount.create({
        name: name,
        amount: amount
    });
}

// uses objects to add an amount
async function addAmount(db, realAccount, virtualAccount, amount) {
    return db.Amount.create({
        amount: amount,
        realaccountid: realAccount.id,
        virtualaccountid: virtualAccount.id
    });
}

// uses ids of objects to add an amount
async function addAmountByIds(db, realAccountId, virtualAccountId, amount) {
    return db.Amount.create({
        amount: amount,
        realaccountid: realAccountId,
        virtualaccountid: virtualAccountId
    });
}

async function addTransaction(db, sourceAccountId, targetAccountId, name, amount, dateTime) {
    return db.Transaction.create({
        name: name,
        amount: amount,
        SourceId: sourceAccountId,
        TargetId: targetAccountId,
        dateTime: dateTime
    });
}

async function retrieveVirtualAccountById(db, virtualAccountId) {
    return await db.Account.findOne({ where: { id: virtualAccountId } });
}

// adds (removes) an amount into a virtual account and into its real account
// also ads a transaction
//
// TODO: separate code that creates a transaction from this method!
async function alterVirtualAccount(db, virtualAccountId, amount, source, name, dateTime, apply) {

    var targetAccountObject = null;
    var amountObject = null;

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

            // only if the user wants to apply this transaction, change the amounts
            // This feature is important for documenting old transactions for validation purposes
            if (apply) {

                // increment the amount in the virtual account
                var newAmount = +amountObject.amount + +amount;

                // update the object
                amountObject.update({
                    amount: newAmount
                }).then(() => { });
            }

            if (typeof amountObject.realaccountid === "undefined") {
                return;
            }

            // find real account
            var result = db.RealAccount.findByPk(amountObject.realaccountid);

            return result;

        }).then(realaccount => {

            // only if the user wants to apply this transaction, change the amounts
            // This feature is important for documenting old transactions for validation purposes
            if (apply) {
                var newAmount = +realaccount.amount + +amount;

                // update the amount in the real account
                realaccount.update({
                    amount: newAmount
                }).then(() => { });
            }

        }).then(() => {

            console.log('dateTime:', dateTime);

            return db.Transaction.create({
                name: name,
                amount: amount,
                dateTime: dateTime
            }).then((transaction) => {

                // set source and target with the save: false option
                // so that sequelize does not try to create those objects
                if (source) {
                    transaction.setSource(targetAccountObject, { save: false });
                } else {
                    transaction.setTarget(targetAccountObject, { save: false });
                }

                return transaction.save();
            });
        });
}

module.exports = {

    transferAmount: transferAmount,
    findAmountInVirtualAccount: findAmountInVirtualAccount,
    addRealAccount: addRealAccount,
    addVirtualAccount: addVirtualAccount,
    addAmount: addAmount,
    addAmountByIds: addAmountByIds,
    addTransaction: addTransaction,
    retrieveVirtualAccountById: retrieveVirtualAccountById,
    alterVirtualAccount: alterVirtualAccount,
    retrieveTransactionById: retrieveTransactionById

};