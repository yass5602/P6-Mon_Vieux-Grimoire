const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.toLowerCase() + Date.now() + ".jpg";
        cb(null, Date.now() + "-" + fileName);
    }
});
const upload = multer({
    storage: storage
});

module.exports = { upload };