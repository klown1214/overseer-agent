const axios = require("axios");

const GUMROAD_TOKEN = process.env.GUMROAD_ACCESS_TOKEN;
const BASE_URL = "https://api.gumroad.com/v2";

async function createProduct({ name, description, price, content }) {
  try {
    const response = await axios.post(`${BASE_URL}/products`, {
      access_token: GUMROAD_TOKEN,
      name,
      description,
      price_cents: Math.round(price * 100),
      url: null,
      published: false,
    });

    const productId = response.data.product.id;
    console.log(`[GUMROAD] Product created: ${name} (${productId})`);

    // Upload content as file
    await uploadContent(productId, content, name);

    // Publish it
    await publishProduct(productId);

    return { success: true, productId, name };
  } catch (err) {
    console.error("[GUMROAD ERROR]", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

async function uploadContent(productId, content, name) {
  try {
    const { Blob } = require("buffer");
    const FormData = require("form-data");
    const form = new FormData();

    const fileContent = Buffer.from(content, "utf-8");
    form.append("access_token", GUMROAD_TOKEN);
    form.append("file", fileContent, {
      filename: `${name.replace(/\s+/g, "_")}.txt`,
      contentType: "text/plain",
    });

    await axios.post(`${BASE_URL}/products/${productId}/files`, form, {
      headers: form.getHeaders(),
    });

    console.log(`[GUMROAD] Content uploaded for product ${productId}`);
  } catch (err) {
    console.error("[GUMROAD UPLOAD ERROR]", err.response?.data || err.message);
  }
}

async function publishProduct(productId) {
  try {
    await axios.put(`${BASE_URL}/products/${productId}`, {
      access_token: GUMROAD_TOKEN,
      published: true,
    });
    console.log(`[GUMROAD] Product published: ${productId}`);
  } catch (err) {
    console.error("[GUMROAD PUBLISH ERROR]", err.response?.data || err.message);
  }
}

async function getSales() {
  try {
    const response = await axios.get(`${BASE_URL}/sales`, {
      params: { access_token: GUMROAD_TOKEN },
    });
    return response.data.sales || [];
  } catch (err) {
    console.error("[GUMROAD SALES ERROR]", err.message);
    return [];
  }
}

async function getProducts() {
  try {
    const response = await axios.get(`${BASE_URL}/products`, {
      params: { access_token: GUMROAD_TOKEN },
    });
    return response.data.products || [];
  } catch (err) {
    console.error("[GUMROAD PRODUCTS ERROR]", err.message);
    return [];
  }
}

module.exports = { createProduct, getSales, getProducts };
