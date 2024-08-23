import { Router } from "express";
import { v1 } from "uuid";
import { db } from "../api/database.js";
import { validateUser } from "../schema/users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const users = Router();

users.post("/create", async (req, res) => {
  const {
    name,
    email,
    password,
    passwordConfirmation,
    phone,
    addressStreet,
    addressNumber,
    cart,
  } = req.body;

  if (password !== passwordConfirmation)
    return res.status(400).send({ error: "Passwords don't match!" });

  const result = validateUser({
    name,
    email,
    password,
    phone,
    addressStreet,
    addressNumber,
  });

  if (!result.success) {
    return res.status(400).send({ error: result.error.message });
  }

  const passwordHashed = bcrypt.hashSync(password, 10);
  const id = v1();

  const token = jwt.sign(
    {
      id: id,
      name: name,
      email: email,
      phone: phone,
      addressStreet: addressStreet,
      addressNumber: addressNumber,
    },
    process.env.SECRET_KEY
  );

  console.log(cart);

  await db.execute({
    sql: "insert into users (id, name, email, password, phone, addressStreet, addressNumber, cart) values (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      id,
      name,
      email,
      passwordHashed,
      phone,
      addressStreet,
      addressNumber,
      JSON.stringify(cart || []),
    ],
  });

  return res
    .cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    .send({
      message: "User created successfully!",
      data: {
        id: id,
        name: name,
        email: email,
        phone: phone,
        addressStreet: addressStreet,
        addressNumber: addressNumber,
        cart: cart || [],
        orders: [],
      },
    });
});

users.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { rows: user } = await db.execute({
    sql: "select * from users where email = ?",
    args: [email],
  });

  if (!user.length) return res.status(400).send({ error: "User not found" });

  const result = bcrypt.compareSync(password, user[0].password);

  if (!result) return res.status(400).send({ error: "Invalid password" });

  const { rows: orders } = await db.execute({
    sql: "select * from orders where userId = ?",
    args: [user[0].id],
  });

  const token = jwt.sign(
    {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      phone: user[0].phone,
      addressStreet: user[0].addressStreet,
      addressNumber: user[0].addressNumber,
      cart: user[0].cart || [],
      orders: orders || [],
    },
    process.env.SECRET_KEY
  );

  return res
    .cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    .send({
      message: "User logged in successfully",
      data: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        phone: user[0].phone,
        addressStreet: user[0].addressStreet,
        addressNumber: user[0].addressNumber,
        cart: user[0].cart || [],
        orders: orders || [],
        status: user[0].status,
      },
      token,
    });
});

users.post("/login/refresh", async (req, res) => {
  const token = req.cookies.auth_token;
  const authToken = req.body.token;
  if (!token && !authToken)
    return res.status(400).send({ error: "No token found" });

  try {
    const data = jwt.verify(authToken, process.env.SECRET_KEY);

    const { rows } = await db.execute({
      sql: "select * from users where id = ?",
      args: [data.id],
    });

    if (rows.length < 1)
      return res.status(400).send({ error: "Invalid token" });

    const { rows: orders } = await db.execute({
      sql: "select * from orders where userId = ?",
      args: [rows[0].id],
    });

    return res.status(200).send({
      message: "User logged in successfully",
      data: {
        id: data.id,
        name: rows[0].name,
        email: rows[0].email,
        phone: rows[0].phone,
        addressStreet: rows[0].addressStreet,
        addressNumber: rows[0].addressNumber,
        cart: rows[0].cart || [],
        orders: orders || [],
        status: rows[0].status,
      },
    });
  } catch (error) {
    return res.status(400).send({ error: "Token expired" });
  }
});

users.post("/logout", async (req, res) => {
  const { cart, id } = req.body;

  await db.execute({
    sql: "update users set cart = ? where id = ?",
    args: [JSON.stringify(cart), id],
  });

  return res.clearCookie("auth_token").send({
    message: "User logged out successfully",
  });
});
