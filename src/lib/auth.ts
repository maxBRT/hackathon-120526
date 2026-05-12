import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { Role } from "../generated/prisma/enums";

export async function getCurrentUser() {
const { userId } = await auth() ;
if (!userId ) return null ;
    return prisma.user.findUnique({ where: {id: userId}});
}

export async function requireRole(role: Role) {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");
    if (user.role !== role && user.role !== "ADMIN") {
        throw new Error ("Forbidden") ;
    }
    return user ;
}