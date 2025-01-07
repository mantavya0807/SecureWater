// server/routes/auth.routes.js
const express = require('express');
const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;