import bcrypt from "bcrypt";
import { generateRandomString } from "../utilities/index.js";
import * as models from "../models/index.js";

const sessionTimeout = 30 * 60 * 1000;

export async function hashString(inputString) {
  const saltRounds = 10;
  return await bcrypt.hash(inputString, saltRounds);
}

export async function login(req, res) {
  const userExists = await models.findUser(req.body.username);
  if (!userExists) return res.status(401).send("Invalid credentials");

  const passwordMatch = await bcrypt.compare(req.body.password, userExists.password);
  if (!passwordMatch) return res.status(401).send("Invalid credentials");

  const sessionId = generateRandomString(20);
  const currentTime = Date.now();

  req.session.username = req.body.username;
  req.session.lastAccessed = currentTime;
  req.session.sessionId = sessionId;
  req.session.expiresAt = currentTime + sessionTimeout;

  res.status(200).redirect("/hours-and-fba.html");
}

export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error("Error destroying session:", err);
    else res.redirect("/login");
  });
}
