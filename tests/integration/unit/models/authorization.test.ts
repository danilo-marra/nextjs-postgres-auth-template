import authorization from "models/authorization";
import { InternalServerError } from "infra/errors";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        // @ts-expect-error testing runtime validation with no arguments
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      expect(() => {
        // @ts-expect-error testing runtime validation with user missing features
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("without unknown feature", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and valid known `feature`", () => {
      const createdUser = {
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        // @ts-expect-error testing runtime validation with no arguments
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      expect(() => {
        // @ts-expect-error testing runtime validation with user missing features
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("without unknown feature", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        // @ts-expect-error testing runtime validation with missing resource
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and invalid `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };
      expect(() => {
        // @ts-expect-error testing runtime validation with missing resource
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and valid `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };
      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        email: "resource@resource.com",
        password: "reource",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });
});
