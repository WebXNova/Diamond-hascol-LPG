const express = require("express");
const router = express.Router();
const { createOrder } = require("../../controllers/order.controller");
const fs = require('fs');
const logPath = 'e:\\Desktop folder\\Desktop\\Work\\WebX Nova\\Diamond-hascol-LPG\\.cursor\\debug.log';

// POST /api/orders
router.post("/", (req, res, next) => {
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'order.routes.js:7',message:'Route handler called',data:{body:req.body,method:req.method,path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
  } catch(e) {}
  // #endregion
  createOrder(req, res, next);
});

module.exports = router;
