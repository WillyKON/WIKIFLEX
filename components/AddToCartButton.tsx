"use client";

import { useCart, type CartItem } from "@/components/CartProvider";

export function AddToCartButton({ item }: { item: CartItem }) {
  const { add, has } = useCart();
  const inCart = has(item.id);

  return (
    <button
      type="button"
      className={inCart ? "btn btn-secondary" : "btn btn-primary"}
      onClick={() => add(item)}
      disabled={inCart}
    >
      {inCart ? "Dans le panier ✓" : "Ajouter au panier"}
    </button>
  );
}
