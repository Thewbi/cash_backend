module.exports = (sequelize, DataTypes) => {

    var Transaction = sequelize.define('Transaction', {
        'id': {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        'name': {
            type: DataTypes.STRING(255)
        },
        'amount': {
            type: DataTypes.INTEGER(11)
        }
    });

    Transaction.associate = function (models) {

        // https://sequelize.readthedocs.io/en/2.0/docs/associations/

        // BelongsTo associations are associations where the foreign key for the 
        // one-to-one relation exists on the source model.

        // HasOne associations are associations where the foreign key for the 
        // one-to-one relation exists on the target model.

        // connection to source virtual account
        models.Transaction.Source = models.Transaction.belongsTo(models.Account, {
            as: 'Source'
        });

        // connect to target virtual account
        models.Transaction.Target = models.Transaction.belongsTo(models.Account, {
            as: 'Target'
        });
    };

    return Transaction;
};