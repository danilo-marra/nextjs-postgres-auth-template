import * as cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextHandler } from "next-connect";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";
import type { Feature, AuthUser } from "models/authorization";
import type { UserRow } from "models/user";
import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors";

export interface AnonymousUser {
  features: Feature[];
}

export type ContextUser = UserRow | AnonymousUser;

export interface AppApiRequest extends NextApiRequest {
  context: {
    user: ContextUser;
  };
}

function onNoMatchHandler(
  _request: AppApiRequest,
  response: NextApiResponse,
): void {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(
  error: unknown,
  _request: AppApiRequest,
  response: NextApiResponse,
): void {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    response.status(error.statusCode).json(error);
    return;
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    response.status(error.statusCode).json(error);
    return;
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function setSessionCookie(
  sessionToken: string,
  response: NextApiResponse,
): Promise<void> {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function clearSessionCookie(response: NextApiResponse): Promise<void> {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(
  request: AppApiRequest,
  _response: NextApiResponse,
  next: NextHandler,
): Promise<void> {
  if (request.cookies?.session_id) {
    try {
      await injectAuthenticatedUser(request);
      return next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "User does not have an active session.",
          action: "Check if this user is logged in and try again.",
        });
      }

      throw error;
    }
  }

  injectAnonymousUser(request);
  return next();
}

async function injectAuthenticatedUser(request: AppApiRequest): Promise<void> {
  const sessionToken = request.cookies.session_id!;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = {
    user: userObject,
  };
}

function injectAnonymousUser(request: AppApiRequest): void {
  const anonymousUserObject: AnonymousUser = {
    features: [
      "read:activation_token",
      "create:session",
      "create:user",
      "create:password_reset_token",
      "read:password_reset_token",
    ],
  };

  request.context = {
    user: anonymousUserObject,
  };
}

function canRequest(feature: string) {
  return function canRequestMiddleware(
    request: AppApiRequest,
    _response: NextApiResponse,
    next: NextHandler,
  ): void {
    const userTryingToRequest = request.context.user as AuthUser;

    if (authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "You do not have permission to perform this action.",
      action: `Check if your user has the "${feature}" feature.`,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
