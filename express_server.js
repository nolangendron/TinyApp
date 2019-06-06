const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());

app.set("view engine", "ejs");

// store User data: email and password
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "nolanglengendron@gmail.com",
    password: "sfsfsfs"
  }
}

// store (key)shortURL and (Value)longURL
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//================================================
// Displays the registration page
app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  };
  res.render("registration", templateVars);
})

// Browse - Displays all URLs in urlDatabase
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Displays a form to add new URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

// Displays one URL to page
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {
    username: req.cookies["username"],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]
  };
  res.render("urls_show", templateVars);
});

 // Will redirect to the longURL webpage
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// Adds a new user to users object
app.post("/register", (req, res, callback) => {
  const randomID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const doesEmailExist = emailLookUp(newUserEmail);
  console.log(doesEmailExist);

  if (!newUserEmail || !newUserPassword) {
    res.sendStatus(400);
  } if (doesEmailExist) {
    res.sendStatus(400);
    } else {
      users[randomID] = {
        id: randomID,
        email: newUserEmail,
        password: newUserPassword
      }
      res.cookie('user', randomID);
      res.redirect("/urls");
      }
});

// Adds a new URL to urlDatabase
app.post("/urls", (req, res, callback) => {
  const randomString = generateRandomString();
  const newLongURL = req.body.longURL;
  if (newLongURL) {
  urlDatabase[randomString] = newLongURL;
  res.redirect(`/u/${randomString}`);
  } else {
    res.redirect("/urls/new");
    }
});

// Adds cookie to username
app.post("/login", (req, res) => {
  const username = req.body.username;
  if (username) {
  res.cookie('username', username);
}
  res.redirect("/urls");
})

// On-click of logout button clears cookie
app.post("/logout", (req, res) => {
  const username = req.body.username;
  res.clearCookie('username', username)
  res.redirect("/urls");
})

// Edit/Update URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (longURL) {
    urlDatabase[shortURL] = longURL;
  }
  res.redirect("/urls");
;})

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
})

// catchall route
app.get('*', (req, res) => {
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let output = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    output += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return output;
}

function emailLookUp(newEmail) {
  let emailExist = false;
  for (let key in users) {
    if (newEmail === users[key]['email']) {
      return emailExist = true;
    } else {
      return emailExist;
    }
  }
}





