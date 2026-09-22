# Product metafield schema

The product page uses merchant-owned Shopify metafields. Their definitions are
declared in `config/product-metafields.schema.ts`, synchronized through the
Admin GraphQL API, and rendered by the theme's beauty product blocks.

Product values remain editorial content in Shopify. This repository versions
the data model and presentation, not each product's content.

## Definitions

| Name | Identifier | Shopify type | Required | Example |
| --- | --- | --- | --- | --- |
| Short summary | `custom.summary` | Single-line text | No | A barrier-supporting daily serum. |
| Skin types | `custom.skin_types` | List of single-line text | No | Dry, Sensitive |
| Skin concerns | `custom.skin_concerns` | List of single-line text | No | Dehydration, Redness |
| Key benefits | `custom.key_benefits` | List of single-line text | No | Hydrates, Calms, Supports the skin barrier |
| Routine step | `custom.routine_step` | Single-line text | No | Serum |
| How to use | `custom.how_to_use` | Rich text | No | Apply two drops after cleansing. |
| Ingredients | `custom.ingredients` | Rich text | No | Aqua, glycerin, squalane… |
| Cruelty free | `custom.cruelty_free` | True/false | No | True |

All fields are optional so incomplete catalog records still render correctly.
Empty fields are hidden, except for the customer-friendly fallbacks on How to
use and Ingredients.

## Review the schema locally

Node 22.6 or newer is required. This command prints the intended schema and
does not contact Shopify:

```sh
npm run metafields:print
```

## Synchronize definitions with Shopify

1. Create a Shopify custom app with Admin API access to products.
2. Copy `.env.example` to `.env`.
3. Put the store's Admin API access token in `.env`. Never commit this file.
4. Run:

```sh
npm run metafields:sync
```

The command is safe to repeat. It creates missing definitions and updates names
or descriptions. It never deletes a definition or changes its identity. Because
Shopify doesn't permit changing a definition's type, a type mismatch is reported
as a conflict and the command exits unsuccessfully for manual review.

After synchronization, enter product-specific values in Shopify Admin under
**Products → product → Metafields**.

## Liquid access

Use `.value` for typed values:

```liquid
{% assign skin_types = product.metafields.custom.skin_types.value %}
```

Use `metafield_tag` for rich text so Shopify produces the appropriate markup:

```liquid
{{ product.metafields.custom.how_to_use | metafield_tag }}
```
