module.exports = (sequelize, DataTypes) => {
  const Punetori = sequelize.define('Punetori', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID'
    },
    emri: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Emri',
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    mbiemri: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Mbiemri',
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    pozita: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Pozita',
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    fabrikaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ID_Fabrika',
      references: {
        model: 'Fabrika',
        key: 'ID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  }, {
    tableName: 'Punetori',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['ID_Fabrika'] },
      { fields: ['Emri'] },
      { fields: ['Mbiemri'] }
    ]
  });

  return Punetori;
};
