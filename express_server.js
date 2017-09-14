const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParsor = require("cookie-parser");
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParsor());

let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    user_id: "vanillaice"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    user_id: "andre-3000"
  }
};

const users = {};

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/urls.json", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"]
  };
  res.json(urlDatabase, templateVars);
});

app.get("/urls", (req, res) => {
   if (!req.cookies.user_id) {
    res.redirect("/login");
    return
  }
  let id = req.cookies["user_id"]
  userURLs = urlsForUser(id);
  let templateVars = {urls: userURLs, user_id: req.cookies["user_id"], "users": users};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
    return
  }
  let templateVars = {
    user_id: req.cookies["user_id"],
    "users": users
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let id = req.cookies["user_id"];
  userURLs = urlsForUser(id);
  if (userURLs[req.params.id]) {
    let templateVars = {urls: userURLs, shortURL: req.params.id, "user_id": id, "users": users};
    res.render("urls_show", templateVars);
    return
  }
  res.render("urls_new");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL;
    if (urlDatabase[req.params.shortURL]){
      longURL = urlDatabase[req.params.shortURL];
    } else {
      res.end("<html><body>That's not a valid short URL.</body></html>");
    }
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    "users": users
  };
  res.redirect("/urls/new");
});

app.post("/register", (req, res) => {
  let user_id = generateRandomString()
  if (req.body.username === "" || req.body.email === "" || req.body.password === "") {
    res.status(400).send("Bad Request: please fill out all the fields.")
  }
  for (user_id in users) {
    if (users[user_id].email === req.body.email) {
      res.status(400).send("Bad Request: that email is already registered to a user.")
    }
  }
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10)
  users[user_id] = {id: req.body.username, email: req.body.email, password: hashedPassword};
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id].user_id === req.cookies["user_id"]) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls/");
  };
  res.status(403).send("Forbidden: please login to continue.");
});

app.post("/urls/:id/edit", (req, res) => {
  if (urlDatabase[req.params.id].user_id === req.cookies["user_id"]) {
    urlDatabase[req.params.id].longURL =req.body.longURL;
    res.redirect("/urls/")
    return
  };
  res.status(403).send("Forbidden: please login to continue.");
});

app.post("/urls/", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {}
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].user_id = req.cookie.user_id
  res.redirect("/urls/" + shortURL);
});

app.post("/login", (req, res) => {
  for (user_id in users) {
    if (users[user_id].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[user_id].password)) {
        res.cookie("user_id", user_id);
        res.redirect("/");
        return
      }
    }
  }
  res.status(403).send("Forbidden: incorrect email and/or password.")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls/new");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function urlsForUser(id){
  let userURLs = {}
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].user_id === id) {
      userURLs[shortURL] = urlDatabase[shortURL]
    }
  }
  return userURLs;
}

function generateRandomString () {
  let string = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  while (string.length < 6) {
    string += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return string;
};
