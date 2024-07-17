import { Router } from "express";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { v1 } from "uuid";
import { db } from "../api/database.js";
import { auth } from "../api/firebase.js";

export const users = Router();

users.post("/create", async (req, res) => {
  const data = req.body;

  data.email = data.email.toLocaleLowerCase();
  data.username = data.username.toLocaleLowerCase();

  const result = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  )
    .then(async (userCredential) => {
      // Send verification email to current user.
      sendEmailVerification(auth.currentUser);

      // Create user info in database.
      await db.execute({
        sql: "insert into users (id, username, fullName, email, phone, address) values (?, ?, ?, ?, ?, ?)",
        args: [
          userCredential.user.uid,
          data.username,
          data.fullName,
          data.email,
          data.phone,
          data.address,
        ],
      });

      try {
        await db.execute({
          sql: "insert into carts (id, cart, userId) values (?, ?, ?)",
          args: [
            v1(),
            data.cart ? JSON.stringify(data.cart) : JSON.stringify([]),
            userCredential.user.uid,
          ],
        });
      } catch (error) {
        console.log(error);
      }

      return res
        .send({
          message: "User created successfully!",
          data: {
            id: userCredential.user.uid,
            username: data.username,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            emailVerified: userCredential.user.emailVerified,
            cart: data.cart ? data.cart : [],
            orders: [],
            status: "user",
          },
        })
        .status(201);
    })
    .catch((error) => {
      return res
        .send({
          message: "Error creating user!",
          error: error.message,
        })
        .status(400);
    });

  return result;
});

users.post("/login", async (req, res) => {
  const data = req.body;
  data.email = data.email.toLocaleLowerCase();

  const result = await signInWithEmailAndPassword(
    auth,
    data.email,
    data.password
  )
    .then(async (userCredential) => {
      const { rows: user } = await db.execute({
        sql: "select * from users inner join carts on carts.userId = users.id where users.id = ?",
        args: [userCredential.user.uid],
      });

      const { rows: userOrders } = await db.execute({
        sql: "select * from orders where userId = ?",
        args: [userCredential.user.uid],
      });

      userOrders.map((order) => {
        order.products = JSON.parse(order.products);
        order.userInfo = JSON.parse(order.userInfo);
      });

      return res
        .send({
          message: "User logged in successfully!",
          data: {
            ...user[0],
            orders: userOrders,
          },
        })
        .status(200);
    })
    .catch(() => {
      return res
        .send({
          message: "Error to login!",
          error: "Wrong credentials!",
        })
        .status(400);
    });

  return result;
});

users.post("/logout", async (req, res) => {
  const { cart, userId } = req.body;

  await db.execute({
    sql: "update carts set cart = ? where userId = ?",
    args: [JSON.stringify(cart || []), userId],
  });

  return res.status(200).json({
    message: "User logged out successfully",
  });
});
