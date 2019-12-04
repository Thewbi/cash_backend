module.exports = (sequelize, DataTypes) => {

    var Amount = sequelize.define('Amount', {
        'id': {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        'amount': {
            type: DataTypes.INTEGER(11)
        }
    });

    Amount.associate = function (models) {

        // optional, foreign key is stored in the source model (= Amount has foreign key to RealAccount)
        models.Amount.belongsTo(models.RealAccount, {
            foreignKey: 'realaccountid',
            targetKey: 'id'
        });

        models.Amount.belongsTo(models.Account, {
            foreignKey: 'virtualaccountid',
            targetKey: 'id'
        });
    };

    return Amount;
};