const { User } = require("../models/User");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const usersRouter = express.Router();
usersRouter.post("/signup", signUp);
usersRouter.post("/login", login);

async function signUp(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  
  if (email == null || password == null) {
    res.status(400).send("Email and password are required");
    return;
  }

  // Validation du format email
  if (!emailRegex.test(email)) {
    res.status(400).send("Format d'email invalide");
    return;
  }

  try {
    const user = {
      email,
      password: hashPassword(password)
    };
    await User.create(user);
    res.send("Sign up");
  } catch (e) {
    console.error(e);
    
    // Gestion spécifique des erreurs d'unicité
    if (e.code === 11000) {
      res.status(400).send("Cette adresse email est déjà utilisée");
      return;
    }
    
    // Gestion des erreurs de validation
    if (e.name === 'ValidationError') {
      const errorMessages = Object.values(e.errors).map(err => err.message);
      res.status(400).send(errorMessages.join(', '));
      return;
    }
    
    res.status(500).send("Something went wrong");
  }
}

async function login(req, res) {
  const body = req.body;
  if (body.email == null || body.password == null) {
    res.status(400).send("Email and password are required");
    return;
  }
  
  // Validation du format email
  if (!emailRegex.test(body.email)) {
    res.status(400).send("Format d'email invalide");
    return;
  }
  
  try {
    const userInDb = await User.findOne({
      email: body.email
    });
    if (userInDb == null) {
      res.status(401).send("Wrong credentials");
      return;
    }
    const passwordInDb = userInDb.password;
    if (!isPasswordCorrect(req.body.password, passwordInDb)) {
      res.status(401).send("Wrong credentials");
      return;
    }

    res.send({
      userId: userInDb._id,
      token: generateToken(userInDb._id)
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
}

function generateToken(idInDb) {
  const payload = {
    userId: idInDb
  };
  const jwtSecret = String(process.env.JWT_SECRET);
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: "1d"
  });
  return token;
}

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
}

function isPasswordCorrect(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = { usersRouter };