const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParsor = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParsor());

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "vanillaice": {
    id: "vanillaice",
    email: "vanilla@ice.com",
    password: "ice-ice-baby"
  },
 "andre-3000": {
    id: "andre-3000",
    email: "andre@outkast.com",
    password: "sorrymrsjackson"
  }
};

app.get("/", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    "users": users
  };
  res.render("urls_new", templateVars);
});

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
  let templateVars = {urls: urlDatabase, user_id: req.cookies["user_id"], "users": users};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    "users": users
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {urls: urlDatabase, shortURL: req.params.id, user_id: req.cookies["user_id"], "users": users};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL;
    if (urlDatabase[req.params.shortURL]){
      longURL = urlDatabase[req.params.shortURL];
    } else {
      res.end("<html><body>That's not a valid short URL.</body></html>\n");
    }
  res.redirect(longURL);
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
  users[user_id] = {id: req.body.username, email: req.body.email, password: req.body.password};
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
});

app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls/");
});

app.post("/urls/", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
});

app.post("/login", (req, res) => {
  res.cookie(Object.keys(req.body)[0], req.body.user_id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls/new");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString () {
  let string = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  while (string.length < 6) {
    string += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return string;
};
