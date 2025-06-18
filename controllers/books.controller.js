const { books } = require("../db/books");
const { Book } = require("../models/Book");
const express = require("express");
const { upload } = require("../middlewares/multer");


async function postBook(req, res) {
    const body = req.body;
    const file = req.file
    const stringifiedBook = req.body.book;
    const book= JSON.parse(stringifiedBook);
    try {
    const result = await Book.create(book);
    res.send({ message: "Book posted", book: result });
    } catch (e) {
        console.error(e);
        res.status(500).send("Something went wrong" + e.message);
    }
}

function getBooks(req, res) {
    res.send(books);
}

const booksRouter = express.Router();
booksRouter.get("/", getBooks);
booksRouter.post("/", upload.single("image"), postBook);

module.exports = { booksRouter };