import database from "infra/database.js";

afterAll(() => database.end());
