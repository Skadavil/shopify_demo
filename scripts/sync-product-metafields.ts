import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { productMetafieldDefinitions } from "../config/product-metafields.schema.ts";

type Definition = {
  name: string;
  namespace: string;
  key: string;
  description: string | null;
  type: { name: string };
};

type UserError = {
  field: string[] | null;
  message: string;
  code?: string | null;
};

const OWNER_TYPE = "PRODUCT";

function loadLocalEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function normalizeStore(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function formatErrors(errors: UserError[]): string {
  return errors
    .map((error) => `${error.field?.join(".") ?? "definition"}: ${error.message}`)
    .join("; ");
}

async function main(): Promise<void> {
  if (process.argv.includes("--print")) {
    console.table(
      productMetafieldDefinitions.map(({ name, namespace, key, type }) => ({
        name,
        identifier: `${namespace}.${key}`,
        type,
      })),
    );
    return;
  }

  loadLocalEnv();

  const store = normalizeStore(process.env.SHOPIFY_STORE ?? "");
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || "2026-07";

  if (!store || !token) {
    throw new Error(
      "Missing SHOPIFY_STORE or SHOPIFY_ADMIN_ACCESS_TOKEN. Copy .env.example to .env and add a custom-app Admin API token.",
    );
  }
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(store)) {
    throw new Error("SHOPIFY_STORE must be a *.myshopify.com hostname, without a path.");
  }
  if (!/^\d{4}-(01|04|07|10)$/.test(apiVersion)) {
    throw new Error("SHOPIFY_API_VERSION must use Shopify's YYYY-MM format, for example 2026-07.");
  }

  const endpoint = `https://${store}/admin/api/${apiVersion}/graphql.json`;

  async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    const payload = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    if (!response.ok) {
      throw new Error(`Shopify returned HTTP ${response.status}.`);
    }
    if (payload.errors?.length) {
      throw new Error(payload.errors.map(({ message }) => message).join("; "));
    }
    if (!payload.data) throw new Error("Shopify returned no GraphQL data.");

    return payload.data;
  }

  const existing: Definition[] = [];
  let cursor: string | null = null;

  do {
    const data = await graphql<{
      metafieldDefinitions: {
        nodes: Definition[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(
      `query ProductMetafieldDefinitions($ownerType: MetafieldOwnerType!, $after: String) {
        metafieldDefinitions(ownerType: $ownerType, first: 250, after: $after) {
          nodes { name namespace key description type { name } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { ownerType: OWNER_TYPE, after: cursor },
    );

    existing.push(...data.metafieldDefinitions.nodes);
    cursor = data.metafieldDefinitions.pageInfo.hasNextPage
      ? data.metafieldDefinitions.pageInfo.endCursor
      : null;
  } while (cursor);

  const byIdentifier = new Map(existing.map((definition) => [`${definition.namespace}.${definition.key}`, definition]));
  const summary = { created: 0, updated: 0, unchanged: 0, conflicts: 0 };

  for (const desired of productMetafieldDefinitions) {
    const identifier = `${desired.namespace}.${desired.key}`;
    const current = byIdentifier.get(identifier);

    if (!current) {
      const data = await graphql<{
        metafieldDefinitionCreate: { userErrors: UserError[] };
      }>(
        `mutation CreateProductMetafieldDefinition($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) {
            createdDefinition { namespace key }
            userErrors { field message code }
          }
        }`,
        { definition: { ...desired, ownerType: OWNER_TYPE, pin: true } },
      );
      const errors = data.metafieldDefinitionCreate.userErrors;
      if (errors.length) throw new Error(`Could not create ${identifier}: ${formatErrors(errors)}`);

      console.log(`Created:   ${identifier}`);
      summary.created += 1;
      continue;
    }

    if (current.type.name !== desired.type) {
      console.error(`Conflict:  ${identifier} is ${current.type.name}; expected ${desired.type}`);
      summary.conflicts += 1;
      continue;
    }

    if (current.name === desired.name && (current.description ?? "") === desired.description) {
      console.log(`Unchanged: ${identifier}`);
      summary.unchanged += 1;
      continue;
    }

    const data = await graphql<{
      metafieldDefinitionUpdate: { userErrors: UserError[] };
    }>(
      `mutation UpdateProductMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
        metafieldDefinitionUpdate(definition: $definition) {
          updatedDefinition { namespace key }
          userErrors { field message code }
        }
      }`,
      {
        definition: {
          ownerType: OWNER_TYPE,
          namespace: desired.namespace,
          key: desired.key,
          name: desired.name,
          description: desired.description,
          pin: true,
        },
      },
    );
    const errors = data.metafieldDefinitionUpdate.userErrors;
    if (errors.length) throw new Error(`Could not update ${identifier}: ${formatErrors(errors)}`);

    console.log(`Updated:   ${identifier}`);
    summary.updated += 1;
  }

  console.log("\nSync summary", summary);
  if (summary.conflicts > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
