const bcrypt = require("bcrypt");
module.exports = function (app, shopData) {
  // Handle our routes

  const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
      res.redirect("./login");
    } else {
      next();
    }
  };

  // home page route
  app.get("/", function (req, res) {
    res.render("index.ejs", shopData);
  });

  // about page route
  app.get("/about", function (req, res) {
    res.render("about.ejs", shopData);
  });

  // search page route
  app.get("/search", redirectLogin,function (req, res) {
    res.render("search.ejs", shopData);
  });

  // search result route
  app.get("/search-result", redirectLogin, function (req, res) {
    //searching in the database
    const q = req.query.keyword;
    let sqlquery = `SELECT * FROM  books where name LIKE "%${q}%"`;
    // execute sql query
    db.query(sqlquery, (err, result) => {
      if (err) {
        res.redirect("./");
      }
      shopData.result = result;
      res.render("searchresult.ejs", shopData);
    });
  });

  // regester route
  app.get("/register", function (req, res) {
    res.render("register.ejs", shopData);
  });

  // list route
  app.get("/list", redirectLogin, (req, res) => {
    let sqlquery = "SELECT * FROM books";
    db.query(sqlquery, (err, result) => {
      if (err) {
        res.redirect("./");
      }
      shopData.result = result;
      res.render("list.ejs", shopData);
    });
  });

  // registered route
  app.post("/registered", function (req, res) {
    const saltRounds = 10;
    const plainPassword = req.body.password;

    const sqlquery = "CALL InsertNewUser(?, ?, ?, ?,?)";

    // hashing password
    bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
      // Store hash in your password DB.
      const values = [
        req.body.email,
        req.body.username,
        req.body.first,
        req.body.last,
        hashedPassword,
      ];

      db.query(sqlquery, values, (err, result) => {
        // if error
        if (err) {
          return console.error(err.message);
        }

        // saving data in database
        res.send(
          " Hello " +
            req.body.first +
            " " +
            req.body.last +
            " you are now registered!  We will send an email to you at " +
            req.body.email
        );
      });
    });
  });

  // add book  route
  app.get("/addbook", redirectLogin, function (req, res) {
    res.render("addbook.ejs", shopData);
  });

  // bookadded route
  app.post("/bookadded", redirectLogin, function (req, res) {
    // saving data in database
    let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
    // execute sql query
    let newrecord = [req.body.name, req.body.price];
    db.query(sqlquery, newrecord, (err, result) => {
      if (err) {
        return console.error(err.message);
      } else
        res.send(
          " This book is added to database, name: " +
            req.body.name +
            " price " +
            req.body.price
        );
    });
  });

  // bargainbooks route
  app.get("/bargainbooks", (req, res) => {
    // execute sql query
    let sqlquery = "SELECT * FROM books WHERE price < 20";
    db.query(sqlquery, (err, result) => {
      if (err) {
        res.redirect("./");
      }
      shopData.result = result;
      res.render("bargainbooks.ejs", shopData);
    });
  });

  // listusers route
  app.get("/listusers", redirectLogin, (req, res) => {
    let sqlquery = "SELECT first, last, email FROM users";
    db.query(sqlquery, (err, result) => {
      if (err) {
        res.redirect("./");
      }
      shopData.result = result;
      res.render("listusers.ejs", shopData);
    });
  });

  // login route
  app
    .get("/login", function (req, res) {
      res.render("login.ejs", shopData);
    })
    .post("/login", (req, res) => {
      // code for login
      console.log(req.body);
      const email = req.body.email;

      let sqlquery = `
      SELECT password
         FROM passwords
         WHERE id =  (SELECT id 
                                FROM users
                                WHERE email = ?)`;

      db.query(sqlquery, email, (err, result) => {
        if (err) {
          console.log(err);
          res.redirect("./");
        } else {
          if (result.length === 0) {
            res.send("User not found");
          } else {
            bcrypt.compare(
              req.body.password,
              result[0].password,
              function (err, result) {
                if (result === true) {
                  // Save user session here, when login is successful
                  req.session.userId = req.body.username;
                  res.send("Login successful");
                } else {
                  res.send("Incorrect password");
                }
              }
            );
          }
        }
      });
    });

    app.get("/logout", redirectLogin, (req, res) => {
      req.session.destroy((err) => {
        if (err) {
          return res.redirect("./");
        }
        res.send("you are now logged out. <a href=" + "./" + ">Home</a>");
      });
    });

  // end of module
};
