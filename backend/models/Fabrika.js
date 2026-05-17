module.exports = (sequelize, DataTypes) => {
  const Fabrika = sequelize.define('Fabrika', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID'
    },
    emriFabrikes: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'EmriFabrikes',
      validate: {
        notEmpty: true,
        len: [2, 150]
      }
    },
    lokacioni: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'Lokacioni',
      validate: {
        notEmpty: true,
        len: [2, 150]
      }
    }
  }, {
    tableName: 'Fabrika',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['EmriFabrikes'] },
      { fields: ['Lokacioni'] }
    ]
  });

  return Fabrika;
};
