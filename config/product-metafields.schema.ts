export type ProductMetafieldDefinition = {
  name: string;
  namespace: "custom";
  key: string;
  type: string;
  description: string;
};

/**
 * Merchant-owned product metafield definitions used by the theme.
 *
 * namespace + key + owner type form the stable identity. Shopify doesn't allow
 * those fields, or a definition's type, to be changed after creation.
 */
export const productMetafieldDefinitions = [
  {
    name: "Short summary",
    namespace: "custom",
    key: "summary",
    type: "single_line_text_field",
    description: "A concise product introduction displayed below the product title.",
  },
  {
    name: "Skin types",
    namespace: "custom",
    key: "skin_types",
    type: "list.single_line_text_field",
    description: "Skin types for which the product is suitable, such as Dry or Sensitive.",
  },
  {
    name: "Skin concerns",
    namespace: "custom",
    key: "skin_concerns",
    type: "list.single_line_text_field",
    description: "Concerns the product is designed to address, such as Redness or Dehydration.",
  },
  {
    name: "Key benefits",
    namespace: "custom",
    key: "key_benefits",
    type: "list.single_line_text_field",
    description: "Short, customer-focused product benefits.",
  },
  {
    name: "Routine step",
    namespace: "custom",
    key: "routine_step",
    type: "single_line_text_field",
    description: "The product's place in a beauty routine, such as Cleanser, Serum, or Moisturiser.",
  },
  {
    name: "How to use",
    namespace: "custom",
    key: "how_to_use",
    type: "rich_text_field",
    description: "Product-specific application and usage instructions.",
  },
  {
    name: "Ingredients",
    namespace: "custom",
    key: "ingredients",
    type: "rich_text_field",
    description: "The product's ingredient information.",
  },
  {
    name: "Cruelty free",
    namespace: "custom",
    key: "cruelty_free",
    type: "boolean",
    description: "Whether the product is confirmed as cruelty free.",
  },
] as const satisfies readonly ProductMetafieldDefinition[];
