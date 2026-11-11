import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema, usernameSchema } from "./schemas";

describe("usernameSchema", () => {
  it("normalizes the login to lower case and trims spaces", () => {
    expect(usernameSchema.parse("  Anna_01 ")).toBe("anna_01");
  });

  it.each([
    ["ab", "слишком короткий"],
    ["a".repeat(21), "слишком длинный"],
    ["анна", "кириллица"],
    ["anna smirnova", "пробел"],
    ["anna@mail", "спецсимвол"],
  ])("rejects %s (%s)", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = { username: "anna", name: " Анна Смирнова ", password: "password123" };

  it("accepts valid data and trims the display name", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      username: "anna",
      name: "Анна Смирнова",
      password: "password123",
    });
  });

  it("requires a display name", () => {
    expect(signUpSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });

  it("requires a password of at least 8 characters", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
  });

  it("keeps spaces inside the password untouched", () => {
    expect(signUpSchema.parse({ ...valid, password: " pass word " }).password).toBe(" pass word ");
  });
});

describe("signInSchema", () => {
  it("normalizes the login", () => {
    expect(signInSchema.parse({ username: " ANNA ", password: "x" }).username).toBe("anna");
  });

  it("requires both fields without revealing the rules", () => {
    const result = signInSchema.safeParse({ username: "", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Введите логин", "Введите пароль"]);
  });
});
