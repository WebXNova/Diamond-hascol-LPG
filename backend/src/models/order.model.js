const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "customer_name",
    },
    phone: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cylinderType: {
      type: DataTypes.ENUM("Domestic", "Commercial"),
      allowNull: false,
      field: "cylinder_type",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    pricePerCylinder: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "price_per_cylinder",
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "total_price",
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "coupon_code",
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "in-transit", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "orders",
    freezeTableName: true,
  }
);

module.exports = Order;
