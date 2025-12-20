const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const OrderStatusHistory = sequelize.define(
  "OrderStatusHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "order_id",
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "delivered", "cancelled"),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "changed_at",
    },
  },
  {
    timestamps: false, // Using changedAt instead
    underscored: true,
    tableName: "order_status_history",
  }
);

module.exports = OrderStatusHistory;

