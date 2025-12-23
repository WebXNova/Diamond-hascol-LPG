const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Coupon = sequelize.define(
  "Coupon",
  {
    code: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    discountType: {
      type: DataTypes.ENUM("percentage", "flat"),
      allowNull: false,
      field: "discount_type",
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      field: "discount_value",
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: { min: 1 },
      field: "usage_limit",
    },
    applicableCylinderType: {
      type: DataTypes.ENUM("Domestic", "Commercial", "Both"),
      allowNull: false,
      field: "applicable_cylinder_type",
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "min_order_amount",
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "expiry_date",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "coupons",
  }
);

module.exports = Coupon;
