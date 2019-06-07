const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
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
    password: "pass"
  },
    "RandomID": {
    id: "RandomID",
    email: "nolan@gmail.com",
    password: "password"
  }
}

// store (key)shortURL and (Value)longURL
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  },
    "b2xVgnsd2": {
    longURL: "http://www.cbc.ca",
    userID: "RandomID"
  },
  "0sm5sgsxK": {
    longURL: "http://www.tsn.ca",
    userID: "RandomID"
  }
};

//================================================
// Displays the registration page
app.get("/register", (req, res) => {
  let templateVars = {
  };
  res.render("registration", templateVars);
})

//Displays the login page
app.get("/login", (req, res) => {
  let templateVars = {
  };
  res.render("login", templateVars);
})

// Browse - Displays all URLs in urlDatabase
app.get("/urls", (req, res) => {
  const key = req.cookies["user"];
  const userUrls = urlsForUser(key);

  let templateVars = {
    user: users[key],
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

// Displays a form to add new URL
app.get("/urls/new", (req, res) => {
  const key = req.cookies["user"];
  if (key) {
  let templateVars = {
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
  let key = req.cookies["user"];
  let shortURL = req.params.shortURL;
  let templateVars = {
    user: users[key],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]['longUrl']
  };
  res.render("urls_show", templateVars);
});

 // Will redirect to the longURL webpage
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Registration
app.post("/register", (req, res, callback) => {
  const randomID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPassword, 10);
  console.log(hashedPassword);
  const doesEmailExist = emailLookUp(newUserEmail);

  if (!newUserEmail || !newUserPassword) {
    res.sendStatus(400);
  } if (doesEmailExist) {
    res.sendStatus(400);
    } else {
      users[randomID] = {
        id: randomID,
        email: newUserEmail,
        password: hashedPassword
      }
      console.log(users)
      res.cookie('user', randomID);
      res.redirect("/urls");
      }
});

// Login
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const user = getUser(userEmail);
  const hashedPassword = user.password;
  const userPassword = req.body.password;

  const compareHashedPassword = bcrypt.compareSync(userPassword, hashedPassword);
  console.log(compareHashedPassword);
  const doesEmailExist = emailLookUp(userEmail);

  if (!compareHashedPassword) {
    res.sendStatus(403);
  } else if (doesEmailExist && !compareHashedPassword) {
    res.sendStatus(403);
  } else {
      const user = getUser(userEmail);
      res.cookie('user', user['id']);
      res.redirect("/urls");
  }
})

// Adds a new URL to urlDatabase
app.post("/urls", (req, res, callback) => {
  const newShortUrl = generateRandomString();
  const userID = req.cookies['user']
  const newLongURL = req.body.longURL;
  if (newLongURL) {
    urlDatabase[newShortUrl] = {
      longURL: newLongURL,
      userID: userID
    }
    res.redirect(`/u/${newShortUrl}`);
  } else {
     res.redirect("/urls/new");
  }
});

// On-click of logout button clears cookie
app.post("/logout", (req, res) => {
  const key = req.cookies["user"];
  res.clearCookie('user', 'id');
  res.redirect("/urls");
})

// Edit/Update URL
app.post("/urls/:shortURL", (req, res) => {
  const userLoggedIn = req.cookies['user'];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (!userLoggedIn) {
    res.redirect("/urls");
  } else {
  if (longURL) {
    urlDatabase[shortURL] = longURL;
  }
  res.redirect("/urls");
}
;})

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const userLoggedIn = req.cookies['user'];
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



function generateRandomString() {
  let output = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    output += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return output;
}

function getUser(email) {
  for (let key in users) {
    if (email === users[key]['email']) {
      return users[key];
    }
  }
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

function comparePasswords(newPassword) {
  let passwordsMatch = false;
  for (let key in users) {
    if (newPassword === users[key]['password']) {
      return passwordsMatch = true;
    } else {
      return passwordsMatch;
    }
  }
}

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



