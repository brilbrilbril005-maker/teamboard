import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import { createTestDatabase, type TestDatabase } from "../../../../tests/helpers/test-db";
import { createUserRepository, type UserRepository } from "./repository";

let testDb: TestDatabase;
let repository: UserRepository;
let olgaId: string;

beforeAll(async () => {
  testDb = await createTestDatabase();
  repository = createUserRepository(testDb.db);
  const inserted = await testDb.db
    .insert(users)
    .values([
      { name: "Ольга Кузнецова", username: "olga", email: "olga@users.teamboard.invalid" },
      { name: "Анна Смирнова", username: "anna", email: "anna@users.teamboard.invalid" },
    ])
    .returning({ id: users.id, username: users.username });
  olgaId = inserted.find((row) => row.username === "olga")?.id ?? "";
});

afterAll(async () => {
  await testDb.close();
});

describe("user repository", () => {
  it("lists team members sorted by name", async () => {
    const members = await repository.listTeamMembers();

    expect(members.map((member) => member.name)).toEqual(["Анна Смирнова", "Ольга Кузнецова"]);
  });

  it("exposes only public fields", async () => {
    const [member] = await repository.listTeamMembers();

    expect(Object.keys(member ?? {}).sort()).toEqual(["id", "name", "username"]);
  });

  it("finds a member by id", async () => {
    expect(await repository.findTeamMemberById(olgaId)).toEqual({
      id: olgaId,
      name: "Ольга Кузнецова",
      username: "olga",
    });
  });

  it("returns null for an unknown id", async () => {
    expect(await repository.findTeamMemberById("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("counts users", async () => {
    expect(await repository.countUsers()).toBe(2);
  });
});
