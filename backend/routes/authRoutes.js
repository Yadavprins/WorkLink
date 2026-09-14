const express = require("express");

const {
    registerCustomer,
    registerWorker,
    loginCustomer,
    loginWorker,
    loginAdmin
} = require("../controllers/authController");

const router = express.Router();

router.post("/customer/register", registerCustomer);
router.post("/worker/register", registerWorker);

router.post("/customer/login", loginCustomer);
router.post("/worker/login", loginWorker);
router.post("/admin/login", loginAdmin);

module.exports = router;