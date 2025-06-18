const express = require('express');
const { User } = require("../models/User");
const bcrypt = require("bcrypt");


async function signUp(req, res) {
    const body = req.body;
    console.log("body:", body);
    const email = req.body.email;
    const password = req.body.password;

    const userInDb = await User.findOne({
        email: email
    });
    console.log("userInDb:", userInDb);
    if (userInDb != null) {
        res.status(400).send("User already exists")
        return
    }
    const user = {
        email: email,
        password: hashPassword(password)
    };
    // users.push(user);
    try{
    await User.create(user);
    } catch(e) {
        console.error(e);
        res.status(500).send("Something went wrong");
        return;
    }
    res.send("Sign Up");
}

async function login(req, res) {
    const body = req.body;

    const userInDb = await User.findOne({
        email: body.email
    });
    console.log("userInDb:", userInDb);
    if (userInDb == null) {
        res.status(401).send("User not found");
        return;
    }
    const passwordInDb = userInDb.password;
    if (!isPasswordCorrect(req.body.password, passwordInDb)) {
        res.status(401).send("Wrong password");
        return;
    }

    res.send({
        userId: userInDb._id,
        token: "token"
    });
}

function hashPassword(password) {
    console.log("password:", password);
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    console.log("hash:", hash);
    return hash;
}

function isPasswordCorrect(password, hash) {
    console.log("hash:", hash);
    console.log("password:", password);
    const isOk = bcrypt.compareSync(password, hash);
    console.log("isOk:", isOk);
    return isOk;
}

const usersRouter = express.Router();

usersRouter.post('signup', signUp);
usersRouter.post('login', login);

module.exports = { usersRouter };