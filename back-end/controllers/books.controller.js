const { upload } = require("../middlewares/multer");
const { processImage } = require("../middlewares/imageProcessor");
const { Book } = require("../models/Book");
const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const booksRouter = express.Router();
booksRouter.get("/bestrating", getBestRating);
booksRouter.get("/:id", getBookById);
booksRouter.get("/", getBooks);
booksRouter.post("/", checkToken, upload.single("image"), processImage, postBook);
booksRouter.delete("/:id", checkToken, deleteBook);
booksRouter.put("/:id", checkToken, upload.single("image"), processImage, putBook);
booksRouter.post("/:id/rating", checkToken, postRating);

async function postRating(req, res) {
  const id = req.params.id;
  if (id == null || id == "undefined") {
    res.status(400).send("Book id is missing");
    return;
  }
  const rating = req.body.rating;
  const userId = req.tokenPayload.userId;
  try {
    const book = await Book.findById(id);
    if (book == null) {
      res.status(404).send("Book not found");
      return;
    }
    const ratingsInDb = book.ratings;
    const previousRatingFromCurrentUser = ratingsInDb.find((rating) => rating.userId == userId);
    if (previousRatingFromCurrentUser != null) {
      res.status(400).send("You have already rated this book");
      return;
    }
    const newRating = { userId, grade: rating };
    ratingsInDb.push(newRating);
    book.averageRating = calculateAverageRating(ratingsInDb);
    await book.save();
    res.send(book);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong:" + e.message);
  }
}

function calculateAverageRating(ratings) {
  const sumOfAllGrades = ratings.reduce((sum, rating) => sum + rating.grade, 0);
  return sumOfAllGrades / ratings.length;
}

async function getBestRating(req, res) {
  try {
    const booksWithBestRatings = await Book.find().sort({ averageRating: -1 }).limit(3);
    booksWithBestRatings.forEach((book) => {
      book.imageUrl = getAbsoluteImagePath(book.imageUrl);
    });
    res.send(booksWithBestRatings);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong:" + e.message);
  }
}

async function putBook(req, res) {
  const id = req.params.id;
  const book = JSON.parse(req.body.book);
  try {
    const bookInDb = await Book.findById(id);
    if (bookInDb == null) {
      res.status(404).send("Book not found");
      return;
    }
    const userIdInDb = bookInDb.userId;
    const userIdInToken = req.tokenPayload.userId;
    if (userIdInDb != userIdInToken) {
      res.status(403).send("You cannot modify other people's books");
      return;
    }

    const newBook = {};
    if (book.title) newBook.title = book.title;
    if (book.author) newBook.author = book.author;
    if (book.year) newBook.year = book.year;
    if (book.genre) newBook.genre = book.genre;
    
    // Si une nouvelle image est uploadée, supprimer l'ancienne
    if (req.file != null) {
      newBook.imageUrl = req.file.filename;
      
      // Supprimer l'ancienne image s'elle existe
      if (bookInDb.imageUrl) {
        // Gérer les images traitées avec le préfixe "processed_"
        const oldImageFilename = bookInDb.imageUrl.startsWith('processed_') 
          ? bookInDb.imageUrl 
          : `processed_${bookInDb.imageUrl}`;
        
        const oldImagePath = path.join(String(process.env.IMAGES_FOLDER), oldImageFilename);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log(`Ancienne image supprimée: ${oldImagePath}`);
          }
        } catch (imageError) {
          console.error(`Erreur lors de la suppression de l'ancienne image: ${imageError.message}`);
          // On continue même si la suppression de l'ancienne image échoue
        }
      }
    }

    await Book.findByIdAndUpdate(id, newBook);
    res.send("Book updated");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong:" + e.message);
  }
}

async function deleteBook(req, res) {
  const id = req.params.id;
  try {
    const bookInDb = await Book.findById(id);
    if (bookInDb == null) {
      res.status(404).send("Book not found");
      return;
    }
    const userIdInDb = bookInDb.userId;
    const userIdInToken = req.tokenPayload.userId;
    if (userIdInDb != userIdInToken) {
      res.status(403).send("You cannot delete other people's books");
      return;
    }

    // Supprimer le fichier image s'il existe
    if (bookInDb.imageUrl) {
      // Gérer les images traitées avec le préfixe "processed_"
      const imageFilename = bookInDb.imageUrl.startsWith('processed_') 
        ? bookInDb.imageUrl 
        : `processed_${bookInDb.imageUrl}`;
      
      const imagePath = path.join(String(process.env.IMAGES_FOLDER), imageFilename);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Image supprimée: ${imagePath}`);
        }
      } catch (imageError) {
        console.error(`Erreur lors de la suppression de l'image: ${imageError.message}`);
        // On continue même si la suppression de l'image échoue
      }
    }

    await Book.findByIdAndDelete(id);
    res.send("Book deleted");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong:" + e.message);
  }
}

function checkToken(req, res, next) {
  const headers = req.headers;
  const authorization = headers.authorization;
  if (authorization == null) {
    res.status(401).send("Unauthorized");
    return;
  }
  const token = authorization.split(" ")[1];
  try {
    const jwtSecret = String(process.env.JWT_SECRET);
    const tokenPayload = jwt.verify(token, jwtSecret);
    if (tokenPayload == null) {
      res.status(401).send("Unauthorized");
      return;
    }
    req.tokenPayload = tokenPayload;
    next();
  } catch (e) {
    console.error(e);
    res.status(401).send("Unauthorized");
  }
}

async function getBookById(req, res) {
  const id = req.params.id;
  try {
    const book = await Book.findById(id);
    if (book == null) {
      res.status(404).send("Book not found");
      return;
    }
    book.imageUrl = getAbsoluteImagePath(book.imageUrl);
    res.send(book);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong:" + e.message);
  }
}

async function postBook(req, res) {
  const stringifiedBook = req.body.book;
  const book = JSON.parse(stringifiedBook);
  const filename = req.file.filename;
  book.imageUrl = filename;
  try {
    const result = await Book.create(book);
    res.send({ message: "Book posted", book: result });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong:" + e.message);
  }
}
async function getBooks(req, res) {
  try {
    const books = await Book.find();
    books.forEach((book) => {
      book.imageUrl = getAbsoluteImagePath(book.imageUrl);
    });
    res.send(books);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong:" + e.message);
  }
}

function getAbsoluteImagePath(fileName) {
  // Encoder le nom de fichier pour les caractères spéciaux
  const encodedFileName = encodeURIComponent(fileName);
  return process.env.PUBLIC_URL + "/" + process.env.IMAGES_PUBLIC_URL + "/" + encodedFileName;
}

module.exports = { booksRouter };