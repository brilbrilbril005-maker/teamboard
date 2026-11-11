"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ROUTES } from "@/lib/routes";
import { publicAction } from "@/lib/server/action";
import { getRequestContext } from "@/lib/server/request";
import { signInSchema, signUpSchema } from "../schemas";
import { getAuthService } from "./index";

const noInputSchema = z.void();

export const signInAction = publicAction("auth.signIn", signInSchema, async (credentials) => {
  await getAuthService().signIn(credentials, await getRequestContext());
  redirect(ROUTES.home);
});

export const signUpAction = publicAction("auth.signUp", signUpSchema, async (data) => {
  await getAuthService().signUp(data, await getRequestContext());
  redirect(ROUTES.home);
});

export const signInAsDemoAction = publicAction("auth.signInAsDemo", noInputSchema, async () => {
  await getAuthService().signInAsDemo(await getRequestContext());
  redirect(ROUTES.home);
});

export const signOutAction = publicAction("auth.signOut", noInputSchema, async () => {
  await getAuthService().signOut(await getRequestContext());
  redirect(ROUTES.login);
});
