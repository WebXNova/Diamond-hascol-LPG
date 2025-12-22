const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const CouponUsage = sequelize.define(
  "CouponUsage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "coupon_code",
      unique: true, // One-time-use enforcement at DB level (prevents race-condition reuse)
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "order_id",
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "discount_amount",
    },
  },
  {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: false, // No updated_at for this table
    tableName: "coupon_usage",
  }
);

module.exports = CouponUsage;

