import user from "models/user";
import password from "models/password";
import { NotFoundError, UnauthorizedError } from "infra/errors";
import type { UserRow } from "models/user";

async function getAuthenticatedUser(
  providedEmail: string,
  providedPassword: string,
): Promise<UserRow> {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatedPassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Authentication data does not match.",
        action: "Check if the submitted data is correct.",
      });
    }

    throw error;
  }

  async function findUserByEmail(providedEmail: string): Promise<UserRow> {
    let storedUser: UserRow;

    try {
      storedUser = await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email does not match.",
          action: "Check if this value is correct.",
        });
      }

      throw error;
    }
    return storedUser;
  }

  async function validatedPassword(
    providedPassword: string,
    storedPassword: string,
  ): Promise<void> {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Password does not match.",
        action: "Check if this value is correct.",
      });
    }
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
