const { app } = require("./config/app");
const { usersRouter } = require("./controllers/users.controller");
const { booksRouter } = require("./controllers/books.controller");
// use json body parser
app.get('/', (req, res) => res.send("Server running!"));

app.use("/api/auth", usersRouter);
app.use("/api/books", booksRouter);

/*function logRequest(req, res, next) {
   console.log("the request:", req.body);
    next();
}*/




