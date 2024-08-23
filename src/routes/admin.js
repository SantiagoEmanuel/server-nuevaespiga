import { Router } from "express";
import { relative } from "node:path";
import { v1, v4 } from "uuid";
import { __dirname } from "../index.js";
import { db } from "../api/database.js";

export const admin = Router();

admin.get("/order/:id", async (req, res) => {
  const { id } = req.params;
  const { rows: order } = await db.execute({
    sql: "select * from orders where id = ?",
    args: [id],
  });
  return res.status(200).send(...order);
});

admin.get("/orders", async (_req, res) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const today = `${year}-${month < 10 ? `0${month}` : month}-${
    day < 10 ? `0${day}` : day
  }`;
  const { rows } = await db.execute({
    sql: "select * from orders where withdrawnOn = ?",
    args: [today],
  });
  return res.status(200).send({
    message: `All order for today: ${today}`,
    data: rows,
  });
});

admin.get("/orders/all", async (_req, res) => {
  const { rows } = await db.execute("select * from orders");
  return res.status(200).send({
    message: "All orders found in database here",
    data: rows,
  });
});

admin.post("/orders/update/paymentStatus/success", (req, res) => {
  console.log(req.params, req.body, req.query, req.headers);
  const { preferenceId, preference_id } = req.params;
  db.execute({
    sql: "update orders set paid = ? where preferenceId = ?",
    args: [true, preference_id || preferenceId],
  });
  res.status(200).redirect("https://nuevaespiga.com");
});

admin.post("/orders/update/paymentStatus/failure", (req, res) => {
  console.log(req.params, req.body, req.query, req.headers);

  res.status(200).send({
    error: "Payment failed",
  });
});

admin.post("/orders/update/payment", async (req, res) => {
  const data = req.body;
  await db.execute({
    sql: "update orders set paid = ? where id = ? ",
    args: [true, data.id],
  });
  res.status(200).send({
    message: "Payment updated successfully",
  });
});

admin.post("/orders/update/orderWithdrawn", (req, res) => {
  const data = req.body;
  db.execute({
    sql: "update orders set orderWithdrawn = ? where id = ? ",
    args: [true, data.id],
  });
  res.status(200).send({
    message: "Order withdrawn successfully",
  });
});

admin.post("/products/create", async (req, res) => {
  const data = req.body;
  // TODO: get path from image, save image, and upload image path to database.
  const imgFile = req.file;
  // Create id for product
  const productID = v4();
  const imgPath = relative(__dirname, imgFile.path);
  // Create image path
  await db.execute({
    sql: "insert into products (id, imgPath, title, description, category, price, stock) values (?, ?, ?, ?, ?, ?, ?)",
    args: [
      productID,
      imgPath,
      data.title,
      data.description,
      data.category,
      data.price,
      data.stock,
    ],
  });
  await db.execute({
    sql: "insert into productRate (id, rate, productId) values (?, ?, ?)",
    args: [v1(), null, productID],
  });
  return res.status(201).send({
    message: "Product created successfully",
  });
});

admin.post("/products/update", async (req, res) => {
  const data = req.body;
  await db.execute({
    sql: "update products set price = ?, stock = ? where id = ?",
    args: [data.price, data.stock, data.productId],
  });
  return res.status(200).send({
    message: "Product updated successfully",
  });
});

admin.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  await db.execute({
    sql: "delete from products where id = ?",
    args: [id],
  });
  // TODO -> Delete image from server
  return res.status(200).send({
    message: "Product deleted successfully",
  });
});

admin.post("/combos/create", async (req, res) => {
  const data = req.body;
  const imgFile = req.file;
  let id = v1();
  let imgPath = relative(__dirname, imgFile.path);
  console.log(data, imgPath);
  try {
    await db.execute({
      sql: "insert into combos (id, title, description, imgPath, price, stock, products) values (?, ?, ?, ?, ?, ?, ?)",
      args: [
        id,
        data.title,
        data.description,
        imgPath,
        data.price,
        data.stock,
        JSON.stringify(data.product),
      ],
    });
    res.status(201).send({
      message: "Combo created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message,
    });
  }
});

admin.post("/categories/create", (req, res) => {
  const data = req.body;
  db.execute({
    sql: "insert into categories (id, category) values (?, ?)",
    args: [v1(), data.category],
  });
  res.status(201).send({
    message: "Category created successfully",
  });
});

admin.get("/categories", async (_req, res) => {
  const { rows } = await db.execute("select * from categories");
  return res.send(rows);
});
