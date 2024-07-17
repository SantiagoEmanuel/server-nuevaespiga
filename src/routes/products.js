import { Router } from "express";
import { db } from "../api/database.js";

export const products = Router();

products.get("/", async (_req, res) => {
  const { rows } = await db.execute(
    "SELECT products.id, title, description, price, stock, imgPath, category, rate FROM products INNER JOIN productRate ON productRate.productId = products.id;"
  );
  if (rows.length === 0) {
    return res.status(200).send({ data: [], message: "Database is empty" });
  }
  rows.forEach((row) => {
    row.imgPath = `http://localhost:8080/${row.imgPath}`;
  });
  return res.status(200).send(rows);
});

products.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.execute({
    sql: "select * from products inner join productRate on products.id = productRate.productId where products.id = ?",
    args: [id],
  });
  if (rows.length === 0) {
    return res
      .status(400)
      .send({ data: "NOT FOUND", message: "Product not found" });
  }
  rows.forEach((row) => {
    row.imgPath = `http://localhost:8080/${row.imgPath}`;
  });
  return res.status(200).json(...rows);
});
