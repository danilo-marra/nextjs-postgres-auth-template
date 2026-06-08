import { InternalServerError } from "infra/errors";

export type Feature =
  | "create:user"
  | "read:user"
  | "read:user:self"
  | "update:user"
  | "update:user:others"
  | "create:session"
  | "read:session"
  | "read:activation_token"
  | "create:password_reset_token"
  | "read:password_reset_token"
  | "read:migration"
  | "create:migration"
  | "read:status"
  | "read:status:all";

export interface AuthUser {
  features: string[];
  id?: string;
}

const availableFeatures: Feature[] = [
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",
  "create:session",
  "read:session",
  "read:activation_token",
  "create:password_reset_token",
  "read:password_reset_token",
  "read:migration",
  "create:migration",
  "read:status",
  "read:status:all",
];

function can(user: AuthUser, feature: string, resource?: unknown): boolean {
  validateUser(user);
  validateFeature(feature);

  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;
    const r = resource as { id?: string };
    if (user.id === r.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(
  user: AuthUser,
  feature: string,
  resource: unknown,
): unknown {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  if (feature === "read:user") {
    const r = resource as {
      id: string;
      username: string;
      features: Feature[];
      created_at: Date;
      updated_at: Date;
    };
    return {
      id: r.id,
      username: r.username,
      features: r.features,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  if (feature === "read:user:self") {
    const r = resource as {
      id: string;
      username: string;
      email: string;
      features: Feature[];
      created_at: Date;
      updated_at: Date;
    };
    if (user.id === r.id) {
      return {
        id: r.id,
        username: r.username,
        email: r.email,
        features: r.features,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }
  }

  if (feature === "read:session") {
    const r = resource as {
      id: string;
      token: string;
      user_id: string;
      created_at: Date;
      updated_at: Date;
      expires_at: Date;
    };
    if (user.id === r.user_id) {
      return {
        id: r.id,
        token: r.token,
        user_id: r.user_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
        expires_at: r.expires_at,
      };
    }
  }

  if (feature === "read:activation_token") {
    const r = resource as {
      id: string;
      user_id: string;
      created_at: Date;
      updated_at: Date;
      expires_at: Date;
      used_at: Date | null;
    };
    return {
      id: r.id,
      user_id: r.user_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      expires_at: r.expires_at,
      used_at: r.used_at,
    };
  }

  if (feature === "read:password_reset_token") {
    const r = resource as {
      id: string;
      user_id: string;
      created_at: Date;
      updated_at: Date;
      expires_at: Date;
      used_at: Date | null;
    };
    return {
      id: r.id,
      user_id: r.user_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      expires_at: r.expires_at,
      used_at: r.used_at,
    };
  }

  if (feature === "read:migration" || feature === "create:migration") {
    if (Array.isArray(resource)) {
      return resource.map(
        (migration: { path: string; name: string; timestamp: number }) => ({
          path: migration.path,
          name: migration.name,
          timestamp: migration.timestamp,
        }),
      );
    }
  }

  if (feature === "read:status") {
    const r = resource as {
      updated_at: string;
      dependencies: {
        database: {
          version: string;
          max_connections: number;
          opened_connections: number;
        };
      };
    };
    const output: {
      updated_at: string;
      dependencies: {
        database: {
          version?: string;
          max_connections: number;
          opened_connections: number;
        };
      };
    } = {
      updated_at: r.updated_at,
      dependencies: {
        database: {
          max_connections: r.dependencies.database.max_connections,
          opened_connections: r.dependencies.database.opened_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version = r.dependencies.database.version;
    }

    return output;
  }
}

function validateUser(user: unknown): asserts user is AuthUser {
  const u = user as { features?: unknown } | null | undefined;
  if (!u || !u.features) {
    throw new InternalServerError({
      cause: "`user` is required in the `authorization` model.",
    });
  }
}

function validateFeature(feature: unknown): void {
  if (!feature || !availableFeatures.includes(feature as Feature)) {
    throw new InternalServerError({
      cause: "A valid `feature` is required in the `authorization` model.",
    });
  }
}

function validateResource(resource: unknown): void {
  if (!resource) {
    throw new InternalServerError({
      cause: "`resource` is required in `authorization.filterOutput()`.",
    });
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
