const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "L'email est obligatoire"],
        unique: true,
        validate: {
            validator: function(email) {
                return emailRegex.test(email);
            },
            message: 'Veuillez saisir une adresse email valide'
        }
    },
    password: {
        type: String,
        required: [true, "Le mot de passe est obligatoire"]
    }
});

// Appliquer le plugin unique-validator
UserSchema.plugin(uniqueValidator, {
    message: "Cette adresse email est déjà utilisée"
});

const User = mongoose.model("User", UserSchema);

module.exports = { User };