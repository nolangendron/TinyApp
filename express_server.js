const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

// store User's data: id, email and password
const users = {}

// stores User's short and long URLs
const urlDatabase = {};

//================================================
//                 Routes
//================================================

//===================GET Routes====================


app.get("/", (req, res) => {
  const userLoggedIn = req.session["user"];
  if (userLoggedIn) {
    res.redirect("/urls")
  } else {
      const templateVars = {
      }
    res.render("login", templateVars);
    }
})

// Displays the registration page
app.get("/register", (req, res) => {
  const templateVars = {};
  res.render("registration", templateVars);
})

//Displays the login page
app.get("/login", (req, res) => {
  const templateVars = {};
  res.render("login", templateVars);
})

// Displays all URLs in urlDatabase unique to user
app.get("/urls", (req, res) => {
  const key = req.session["user"];
  const userUrls = urlsForUser(key);

  const templateVars = {
    user: users[key],
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

// Displays a form to add new URL
app.get("/urls/new", (req, res) => {
  const key = req.session["user"];
  if (key) {
  const templateVars = {
    user: users[key],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
    }
});

// Displays one URL to page
app.get("/urls/:shortURL", (req, res) => {
  const key = req.session["user"];
  const shortURL = req.params.shortURL;
  const templateVars = {
    user: users[key],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]['longURL']
  };
  res.render("urls_show", templateVars);
});

 // Will redirect to the longURL webpage
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//=================POST Routes==========================

// Registration page
app.post("/register", (req, res, callback) => {
  const randomID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPassword, 10);
  const doesEmailExist = emailLookUp(newUserEmail);
  console.log(doesEmailExist)
  if (!newUserEmail || !newUserPassword) {
    res.sendStatus(400);
  } else if (doesEmailExist) {
    res.sendStatus(400);
    } else {
      users[randomID] = {
        id: randomID,
        email: newUserEmail,
        password: hashedPassword
      }
      req.session.user = randomID;
      res.redirect("/urls");
      }
});

// Login page
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const user = getUser(userEmail);
  const hashedPassword = user.password;
  const userPassword = req.body.password;
  const compareHashedPassword = bcrypt.compareSync(userPassword, hashedPassword);
  const doesEmailExist = emailLookUp(userEmail);

  if (!userEmail || !userPassword) {
    res.redirect("/login");
    } else if (!compareHashedPassword) {
    res.sendStatus(403);
    } else if (doesEmailExist && !compareHashedPassword) {
    res.sendStatus(403);
    } else {
      const user = getUser(userEmail);
      req.session.user = user['id'];
      res.redirect("/urls");
      }
})

// Edit longURL
app.post("/urls/:shortURL", (req, res) => {
  const userLoggedIn = req.session['user'];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (!userLoggedIn) {
    res.redirect("/urls");
    } else {
    if (longURL) {
      urlDatabase[shortURL] = {
      longURL: longURL,
      userID: userLoggedIn
      }
    }
    res.redirect("/urls");
  }
})

// Adds a new URL to urlDatabase
app.post("/urls", (req, res, callback) => {
  const newShortUrl = generateRandomString();
  const userID = req.session['user']
  const newLongURL = req.body.longURL;
  if (newLongURL) {
    urlDatabase[newShortUrl] = {
      longURL: newLongURL,
      userID: userID
    }
    res.redirect("/urls");
    } else {
        res.redirect("/urls/new");
      }
});

// On-click of logout button clears cookies
app.post("/logout", (req, res) => {
  const key = req.session["user"];
  req.session = null;
  res.redirect("/urls");
})

// Deletes a URL from user's list
app.post("/urls/:shortURL/delete", (req, res) => {
  const userLoggedIn = req.session['user'];
  const shortURL = req.params.shortURL;
  if (!userLoggedIn) {
    res.redirect("/urls");
  } else {
      delete urlDatabase[shortURL];
      res.redirect("/urls");
    }
})

// catchall route
app.get('*', (req, res) => {
  res.redirect('/urls');
})

//==========================================
//          Helper Functions
//==========================================

// Generates a random string to represent the ShortURL when a new one is created
function generateRandomString() {
  let output = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    output += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return output;
}

// gets a user from the users DB using the userEmail to lookup specific user
function getUser(email) {
  for (const key in users) {
    if (email === users[key]['email']) {
      return users[key];
    }
  }
}

// usese a newUserEmail to look in users DB to check is newEmail already exist
function emailLookUp(newEmail) {
  let emailExist = false;
  for (const key in users) {
    if (newEmail === users[key]['email']) {
      return emailExist = true;
    } else {
        return emailExist;
      }
  }
}

// Gets all the URLs unique to a specific user id
function urlsForUser(id) {
  let userUrl = {};
  for (const key in urlDatabase) {
    if (id === urlDatabase[key]['userID']) {
      userUrl[key] = urlDatabase[key];
    }
  }
  return userUrl;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



