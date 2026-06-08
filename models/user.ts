import database from "infra/database";
import password from "models/password";
import { ValidationError, NotFoundError } from "infra/errors";
import type { Feature } from "models/authorization";

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password: string;
  features: Feature[];
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  features?: Feature[];
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
}

async function findOneByUsername(username: string): Promise<UserRow> {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username: string): Promise<UserRow> {
    const results = await database.query<UserRow>({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });

    if (!results.rowCount) {
      throw new NotFoundError({
        message: "User not found.",
        action: "Check if the provided username is correct.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email: string): Promise<UserRow> {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email: string): Promise<UserRow> {
    const results = await database.query<UserRow>({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [email],
    });

    if (!results.rowCount) {
      throw new NotFoundError({
        message: "Email not found.",
        action: "Check if the provided email is correct.",
      });
    }

    return results.rows[0];
  }
}

async function findOneById(id: string): Promise<UserRow> {
  const userFound = await runSelectQuery(id);

  return userFound;

  async function runSelectQuery(id: string): Promise<UserRow> {
    const results = await database.query<UserRow>({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        id = $1
      LIMIT
        1
      ;`,
      values: [id],
    });

    if (!results.rowCount) {
      throw new NotFoundError({
        message: "ID not found.",
        action: "Check if the provided ID is correct.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues: UserCreateInput): Promise<UserRow> {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);
  injectDefaultFeaturesInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(
    userInputValues: UserCreateInput,
  ): Promise<UserRow> {
    const results = await database.query<UserRow>({
      text: `
      INSERT INTO
        users (username, email, password, features)
      VALUES
        ($1, $2, $3, $4)
      RETURNING
        *
      ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.features as Feature[],
      ],
    });

    return results.rows[0];
  }

  function injectDefaultFeaturesInObject(
    userInputValues: UserCreateInput,
  ): void {
    userInputValues.features = ["read:activation_token"];
  }
}

async function update(
  username: string,
  userInputValues: UserUpdateInput,
): Promise<UserRow> {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username as string);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email as string);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues as { password: string });
  }

  const userWithNewValues = {
    ...currentUser,
    ...userInputValues,
  };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues: UserRow): Promise<UserRow> {
    const results = await database.query<UserRow>({
      text: `
      UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function validateUniqueUsername(username: string): Promise<void> {
  const results = await database.query({
    text: `
    SELECT
      username
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  });

  if ((results.rowCount ?? 0) > 0) {
    throw new ValidationError({
      message: "This username is already in use.",
      action: "Use a different username for this operation.",
    });
  }
}

async function validateUniqueEmail(email: string): Promise<void> {
  const results = await database.query({
    text: `
    SELECT
      email
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    ;`,
    values: [email],
  });

  if ((results.rowCount ?? 0) > 0) {
    throw new ValidationError({
      message: "This email is already in use.",
      action: "Use a different email for this operation.",
    });
  }
}

async function hashPasswordInObject(userInputValues: {
  password: string;
}): Promise<void> {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function setFeatures(
  userId: string,
  features: Feature[],
): Promise<UserRow> {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(
    userId: string,
    features: Feature[],
  ): Promise<UserRow> {
    const results = await database.query<UserRow>({
      text: `
      UPDATE
        users
      SET
        features = $2,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

async function addFeatures(
  userId: string,
  features: Feature[],
): Promise<UserRow> {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(
    userId: string,
    features: Feature[],
  ): Promise<UserRow> {
    const results = await database.query<UserRow>({
      text: `
      UPDATE
        users
      SET
        features = array_cat(features, $2),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
  findOneByEmail,
  findOneById,
  update,
  setFeatures,
  addFeatures,
};

export default user;
