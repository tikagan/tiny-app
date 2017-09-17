const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys:['secreted-keys'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

let urlDatabase = {};

const users = {};

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  } else {
    res.render("login");
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls");
    return;
  } else {
    res.render("register");
  }
});

app.get("/urls.json", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id
  };
  res.json(urlDatabase, templateVars);
});

app.get("/urls", (req, res) => {
  isLoggedIn(req.session.user_id, "/urls/new", res);
  //creates filtered url database using cookie stored user_id
  userURLs = urlsForUser(req.session.user_id);
  let templateVars = {urls: userURLs, user_id: req.session.user_id, "users": users};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {};
  //if user is logged in creates approprate variable to pass to page
  if (req.session.user_id) {
    templateVars = {
      user_id: req.session["user_id"],
      "users": users
    };
    //if user is not logged in creates alternate variable to pass to page
  } else {
    templateVars = {
      "users": users,
      user_id: undefined
    };
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  isLoggedIn(req.session.user_id, "/urls/new", res);
  //checks if requested shortURL (req.session.user_id) exsists
  if (urlDatabase[req.params.id]) {
    //checks if that that shortURL is assigned to the user that requested it
    if (urlDatabase[req.params.id].user_id === req.session.user_id) {
      //filters urlDatabase for urls assigned to current user
        userURLs = urlsForUser(req.session.user_id);
        let templateVars = {urls: userURLs, shortURL: req.params.id, "user_id": req.session.user_id, "users": users};
        res.render("urls_show", templateVars)
      } else {
         res.status(403).send("Forbidden: that's not your shortened URL.");
      }
  } else {
    res.status(404).send("Not Found: that's not a valid shortened URL.");
  }
});

app.get("/u/:id", (req, res) => {
  let longURL;
  //checks that requested shortened URL exists in the database
    if (urlDatabase[req.params.id]){
      longURL = urlDatabase[req.params.id].longURL;
      res.redirect(longURL);
      return;
    } else {
      //if not returns error message
      // console.log("longURL: ", urlDatabase[req.params.shortURL].longURL);
      res.status(404).send("Not Found: that's not a valid shortened URL.");
    }
});

app.get("/", (req, res) => {
  res.redirect("/urls/new");
});

app.post("/register", (req, res) => {
  let newUser = generateRandomString()
  //checks if submitted username, email and passwords fields are empty
  if (req.body.username === "" || req.body.email === "" || req.body.password === "") {
    res.status(400).send("Bad Request: please fill out all the fields.");
  }
  for (let user_id in users) {
    //checks if submitted email already exists in the users database
    if (users[user_id].email === req.body.email) {
      res.status(400).send("Bad Request: that email is already registered to a user.");
    }
  }
  const password = req.body.password;
  //hashes password
  const hashedPassword = bcrypt.hashSync(password, 10);
  //creates new user in the users database
  users[newUser] = {id: req.body.username, email: req.body.email, password: hashedPassword};
  req.session.user_id = newUser;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  isLoggedIn(req.session.user_id, "/urls/new", res);
  //checks if the url being requested belongs to the user requesting
  if (urlDatabase[req.params.id].user_id === req.session.user_id) {
      delete urlDatabase[req.params.id];
      res.redirect("/urls/");
    }
});

app.post("/urls/:id", (req, res) => {
  isLoggedIn(req.session.user_id, "/urls/new", res);
  //checks if the url being requested belongs to the user requesting
  if (urlDatabase[req.params.id].user_id === req.session.user_id) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls/");
    return;
  } else {
    res.status(403).send("Forbidden: that's not your short URL.");
  }
});

app.post("/urls/", (req, res) => {
  isLoggedIn(req.session.user_id, "/urls/new", res);
  let shortURL = generateRandomString();
  //creates short url key in urlDatabase
  urlDatabase[shortURL] = {}
  //creates and assigns a longURL key and value to it
  urlDatabase[shortURL].longURL = req.body.longURL;
  //creates and assign a user_id to it
  urlDatabase[shortURL].user_id = req.session.user_id;
  res.redirect("/urls/" + shortURL);
});

app.post("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  for (user_id in users) {
    //checks if the submitted email belongs to a user in the users database
    if (users[user_id].email === req.body.email) {
      //hashes the submitted password and compares it to stored hashed password
      if (bcrypt.compareSync(req.body.password, users[user_id].password)) {
        req.session.user_id = user_id;
        res.redirect("/urls");
        return;
      }
    }
  }
  res.status(403).send("Forbidden: incorrect email and/or password.");
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//filters urlDatabase by user_id to return an object containing only shortedened URLs created by that user
function urlsForUser(id){
  let userURLs = {};
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].user_id === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

//checks if a user is logged or not and redirects them as approprate
function isLoggedIn (user_id, redirect, res) {
  if (!user_id) {
    res.redirect(redirect);
  }
  return
};

//generates 6 character long strings to be used for shortened URLs and user_id
function generateRandomString () {
  let string = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  while (string.length < 6) {
    string += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return string;
};
