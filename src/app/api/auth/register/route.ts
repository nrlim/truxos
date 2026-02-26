import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyName, fullName, username, password } = body;

        // Validation
        if (!companyName || !fullName || !username || !password) {
            return NextResponse.json(
                { error: "All fields are required." },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters." },
                { status: 400 }
            );
        }

        if (username.length < 3) {
            return NextResponse.json(
                { error: "Username must be at least 3 characters." },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username is already taken." },
                { status: 409 }
            );
        }

        // Generate unique slug
        let slug = slugify(companyName);
        const existingTenant = await prisma.tenant.findUnique({
            where: { slug },
        });

        if (existingTenant) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create tenant and owner user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    slug,
                },
            });

            const user = await tx.user.create({
                data: {
                    username: username.toLowerCase(),
                    password: hashedPassword,
                    fullName,
                    role: "OWNER",
                    tenantId: tenant.id,
                },
            });

            return { tenant, user };
        });

        // Generate JWT
        const token = signToken({
            userId: result.user.id,
            username: result.user.username,
            role: result.user.role,
            tenantId: result.tenant.id,
            tenantSlug: result.tenant.slug,
        });

        return NextResponse.json(
            {
                message: "Organization created successfully.",
                token,
                user: {
                    id: result.user.id,
                    username: result.user.username,
                    fullName: result.user.fullName,
                    role: result.user.role,
                },
                tenant: {
                    id: result.tenant.id,
                    name: result.tenant.name,
                    slug: result.tenant.slug,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
