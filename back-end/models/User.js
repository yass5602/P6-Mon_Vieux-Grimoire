const mongoose = require("mongoose");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
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
        required: true
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = { User };