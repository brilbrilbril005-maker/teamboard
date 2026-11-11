import "server-only";
import { getDb } from "@/db/client";
import { createUserRepository, type UserRepository } from "./repository";

let userRepository: UserRepository | undefined;

export function getUserRepository(): UserRepository {
  userRepository ??= createUserRepository(getDb());
  return userRepository;
}
