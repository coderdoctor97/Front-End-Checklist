import rawThemeSchema from "../data/theme.schema.json";

type SchemaType = "object" | "string" | "array" | "number" | "integer" | "boolean" | "null";

type SchemaNode = {
  type?: SchemaType | SchemaType[];
  required?: string[];
  properties?: Record<string, SchemaNode>;
  enum?: unknown[];
  pattern?: string;
  minLength?: number;
  additionalProperties?: boolean | SchemaNode;
  $ref?: string;
};

type SchemaDocument = SchemaNode & {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  definitions?: Record<string, SchemaNode>;
};

const themeSchema = rawThemeSchema as unknown as SchemaDocument;

export type SchemaValidationResult = { ok: true } | { ok: false; errors: string[] };

function isSchemaNode(value: unknown): value is SchemaNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function typeMatches(value: unknown, type: string): boolean {
  switch (type) {
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
}

function resolveRef(node: SchemaNode, definitions: Record<string, SchemaNode>): SchemaNode {
  if (!node.$ref) return node;
  if (node.$ref.startsWith("#/definitions/")) {
    const key = node.$ref.slice("#/definitions/".length);
    const target = definitions[key];
    if (target) return resolveRef(target, definitions);
  }
  return {};
}

function childPath(path: string, key: string): string {
  return path ? `${path}.${key}` : key;
}

function walk(value: unknown, node: SchemaNode, path: string, errors: string[], definitions: Record<string, SchemaNode>) {
  const label = path || "Theme";

  if (node.enum && !node.enum.some((entry) => Object.is(entry, value))) {
    const list = node.enum.map((entry) => JSON.stringify(entry)).join(", ");
    errors.push(`${label} must be one of: ${list}`);
    return;
  }

  if (node.type) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    if (!types.some((type) => typeMatches(value, type))) {
      errors.push(`${label} must be a ${types.join(" or ")}`);
      return;
    }
  }

  if (typeof value === "string") {
    if (node.minLength !== undefined && value.length < node.minLength) {
      errors.push(`${label} must not be empty`);
    }
    if (node.pattern && !new RegExp(node.pattern).test(value)) {
      errors.push(`${label} must be lowercase kebab-case (e.g. "my-theme")`);
    }
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) return;

  const object = value as Record<string, unknown>;
  const hasProperties = node.properties !== undefined;

  for (const key of node.required ?? []) {
    if (!(key in object)) {
      errors.push(`Missing required property: ${childPath(path, key)}`);
    }
  }

  if (hasProperties) {
    for (const [key, sub] of Object.entries(node.properties as Record<string, SchemaNode>)) {
      if (key in object) {
        walk(object[key], resolveRef(sub, definitions), childPath(path, key), errors, definitions);
      }
    }
  }

  const additional = node.additionalProperties ?? true;
  for (const key of Object.keys(object)) {
    if (hasProperties && key in (node.properties as Record<string, SchemaNode>)) continue;
    if (additional === false) {
      errors.push(`${label} has an unknown property: ${key}`);
    } else if (isSchemaNode(additional)) {
      walk(object[key], resolveRef(additional, definitions), childPath(path, key), errors, definitions);
    }
  }
}

export function validateAgainstSchema(value: unknown, schema: SchemaDocument = themeSchema): SchemaValidationResult {
  const errors: string[] = [];
  const definitions = schema.definitions ?? {};
  walk(value, resolveRef(schema, definitions), "", errors, definitions);
  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}