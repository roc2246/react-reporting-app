let lastRequestTime = 0;

export function rateLimitMiddleware(req, res, next) {
  const currentTime = Date.now();

  if (currentTime - lastRequestTime < 5 * 60 * 1000) {
    res.status(429).send("Too many requests. Please try again later.");
    return;
  }

  lastRequestTime = currentTime;
  next();
}

export function manageLogin(req, res, next) {
  const currentTime = Date.now();

  // Check if the user is logged in
  if (req.session && req.session.username) {
    // Check if the session has an expiration time and if it has expired
    if (req.session.expiresAt && req.session.expiresAt < currentTime) {
      // Session has expired, clear the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          // Handle the error, for example, log it or render an error page
        }

        // Redirect to the login page regardless of the session destruction result
        res.redirect('/login.html');
      });
    } else {
      // Update the lastAccessed time for the active session
      req.session.lastAccessed = currentTime;
      // User is logged in and the session is valid, allow access to the next middleware or route handler
      next();
    }
  } else {
    // User is not logged in, redirect to the login page or send an unauthorized response
    res.redirect('/login.html');
  }
}


