import database from "infra/database";

afterAll(async () => database.end());
