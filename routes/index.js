const express = require("express");

const router = express.Router();
const AppController = require("../controllers/AppController");
const UsersController = require("../controllers/UsersController");
const {AuthController} = require("../controllers/AuthController");

router.get("/status", (req, res) => {
  AppController.getStatus(req, res)
});

router.get("/stats", (req, res) => {
  AppController.getStats(req, res)
});

router.get('/connect', (req, res) => {
  AuthController.getConnect(req, res)
})

router.get("/disconnect", (req, res) => {
  AuthController.getDisconnect(req, res)
})

router.get("/users/me", UsersController.getMe)

router.post("/users", (req, res) => {
  UsersController.postNew(req, res);
});

module.exports = router;
