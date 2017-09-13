const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.render("urls_new");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls/");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {urls: urlDatabase, shortURL: req.params.id};
  res.render("urls_show", templateVars);
});

app.post("/urls/", (req, res) => {
  // console.log(req.body);
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
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

app.post("/login", (req, res) => {
  res.cookie(Object.keys(req.body)[0], req.body.username);
  res.redirect("/urls");
})

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
}
