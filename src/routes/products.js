import { Router } from "express";
import { db } from "../api/database.js";

export const products = Router();

products.get("/", async (_req, res) => {
  const { rows: products } = await db.execute(
    "select products.id, products.title, products.description, products.price, products.stock, products.imgPath, categories.name as category FROM products inner join categories on products.category = categories.id"
  );
  if (products.length === 0) {
    return res.status(204).send({ data: [], message: "Database is empty" });
  }
  products.forEach(async (product) => {
    const { rows: rate } = await db.execute({
      sql: "select * from productRate where productId = ?",
      args: [product.id],
    });
    let rating = 0;
    rate.map((r) => {
      rating += r.rate;
    });
    product.rate = rating / rate.length;
  });
  products.forEach((product) => {
    product.imgPath = `https://nearly-touched-mosquito.ngrok-free.app/${product.imgPath}`;
  });
  return res.status(200).send(products);
});

products.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { rows: product } = await db.execute({
    sql: "select products.id, products.title, products.description, products.price, products.stock, products.imgPath, categories.name as category FROM products inner join categories on products.category = categories.id where products.id = ?",
    args: [id],
  });

  product.forEach(async (product) => {
    const { rows: rate } = await db.execute({
      sql: "select * from productRate where productId = ?",
      args: [product.id],
    });
    let rating = 0;
    rate.map((r) => {
      rating += r.rate;
    });
    product.rate = rating / rate.length;
  });

  product.forEach((row) => {
    row.imgPath = `https://nearly-touched-mosquito.ngrok-free.app/${row.imgPath}`;
  });

  return res.status(200).json(product);
});

products.get("/category/:category", async (req, res) => {
  const { category } = req.params;
  const { rows: products } = await db.execute({
    sql: "select products.id, products.title, products.description, products.price, products.stock, products.imgPath, categories.name as category FROM products inner join categories on products.category = categories.id where categories.name = ?",
    args: [category],
  });
  if (products.length === 0) {
    return res.status(204).send({ data: [], message: "Database is empty" });
  }
  products.forEach(async (product) => {
    const { rows: rate } = await db.execute({
      sql: "select * from productRate where productId = ?",
      args: [product.id],
    });
    let rating = 0;
    rate.map((r) => {
      rating += r.rate;
    });
    product.rate = rating / rate.length;
  });
  products.forEach((product) => {
    product.imgPath = `https://nearly-touched-mosquito.ngrok-free.app/${product.imgPath}`;
  });
  return res.status(200).send(products);
});

products.get("/combos/all", async (req, res) => {
  try {
    const { rows: combos } = await db.execute("select * from combos");
    if (combos.length === 0) {
      return res
        .status(204)
        .send({ message: "No se encuentran combos disponibles" });
    }

    combos.map((combo) => {
      const products = [];

      combo.imgPath = `https://nearly-touched-mosquito.ngrok-free.app/${combo.imgPath}`;

      combo.products = JSON.parse(combo.products);

      combo.products.map((productId, index) => {
        db.execute({
          sql: "select * from products where id = ?",
          args: [productId],
        }).then(({ rows: product }) => {
          product.map((item) => {
            item.imgPath = `https://nearly-touched-mosquito.ngrok-free.app/${item.imgPath}`;
          });
          products.push(product[0]);
          if (index === combo.products.length - 1) {
            combo.products = products;
            return res.status(200).send(combos);
          }
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message });
  }
});

products.get("/combos/:id", async (req, res) => {
  const { id } = req.params;
  const { rows: combo } = await db.execute({
    sql: "select * from combos where id = ?",
    args: [id],
  });
  if (combo.length === 0) {
    return res.status(400).send({ message: "No se encuentra el combo" });
  }
  combo.forEach((combo) => {
    const products = [];

    combo.imgPath = `https://nearly-touched-mosquito.ngrok-free.app/${combo.imgPath}`;

    combo.products = JSON.parse(combo.products);

    combo.products.map((productId, index) => {
      db.execute({
        sql: "select * from products where id = ?",
        args: [productId],
      }).then(({ rows: product }) => {
        product.map((item) => {
          item.imgPath = `https://nearly-touched-mosquito.ngrok-free.app/${item.imgPath}`;
        });
        products.push(product[0]);
        if (index === combo.products.length - 1) {
          combo.products = products;
          return res.status(200).send(combo);
        }
      });
    });
  });
});
