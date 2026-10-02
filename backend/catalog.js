export const productsBySlug = new Map([
  ["derma-roller", { name: "Derma Roller", price: 299 }],
  ["back-stretcher", { name: "Back Stretcher", price: 899 }],
  ["yoga-mat-6mm", { name: "Yoga Mat 6mm", price: 799 }],
  ["resistance-band", { name: "Resistance Band Set", price: 599 }],
  ["face-roller", { name: "Face Roller", price: 299 }],
  ["scalp-massager", { name: "3-in-1 Scalp Comb", price: 1399 }],
  ["electric-scalp-massager", { name: "Electric Scalp Massager", price: 599 }],
  ["mini-massage-gun", { name: "Mini Massage Gun", price: 649 }],
  ["neck-shoulder-massager", { name: "Neck & Shoulder Massager", price: 1499 }],
  ["body-scrubber", { name: "Silicone Body Scrubber", price: 399 }],
  ["waist-trimmer", { name: "Everyday Waist Trimmer", price: 699 }],
]);

export const FREE_SHIPPING_THRESHOLD_PAISE = 49900;
export const SHIPPING_FEE_PAISE = 6000;

export function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new Error("Add between 1 and 20 products to your order.");
  }

  const quantities = new Map();
  for (const item of items) {
    if (
      !item ||
      typeof item.slug !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 10
    ) {
      throw new Error(
        "Each product must have a valid slug and a quantity from 1 to 10.",
      );
    }
    const product = productsBySlug.get(item.slug);
    if (!product) throw new Error(`Unknown product: ${item.slug}`);
    const quantity = (quantities.get(item.slug) || 0) + item.quantity;
    if (quantity > 10)
      throw new Error("A maximum of 10 units per product is allowed.");
    quantities.set(item.slug, quantity);
  }

  const lines = [...quantities].map(([slug, quantity]) => {
    const product = productsBySlug.get(slug);
    return {
      slug,
      name: product.name,
      unitPricePaise: product.price * 100,
      quantity,
      lineTotalPaise: product.price * 100 * quantity,
    };
  });
  const subtotalPaise = lines.reduce(
    (sum, line) => sum + line.lineTotalPaise,
    0,
  );
  const shippingPaise =
    subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : SHIPPING_FEE_PAISE;

  return {
    lines,
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise,
  };
}
