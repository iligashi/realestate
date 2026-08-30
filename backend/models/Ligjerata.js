module.exports = (sequelize, DataTypes) => {
  const Ligjerata = sequelize.define('Ligjerata', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'LectureID'
    },
    lectureName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'LectureName',
      validate: {
        notEmpty: true,
        len: [2, 150]
      }
    },
    lecturerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'LecturerID',
      references: {
        model: 'Ligjeruesi',
        key: 'LecturerID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  }, {
    tableName: 'Ligjerata',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['LecturerID'] },
      { fields: ['LectureName'] }
    ]
  });

  return Ligjerata;
};
