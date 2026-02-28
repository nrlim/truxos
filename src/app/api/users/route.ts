import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json(
                { error: "Tenant ID is required" },
                { status: 400 }
            );
        }

        const users = await prisma.user.findMany({
            where: {
                tenantId: tenantId,
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                tenantId: true,
                driverId: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullName, username, password, role, tenantId, driverId } = body;

        if (!fullName || !username || !password || !role || !tenantId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if username already exists in the same tenant
        const existingUser = await prisma.user.findFirst({
            where: {
                username,
                tenantId
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username already exists in this organization" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                fullName,
                username,
                password: hashedPassword,
                role,
                tenantId,
                driverId: role === "DRIVER" ? (driverId || null) : null,
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                tenantId: true,
                driverId: true,
            }
        });

        return NextResponse.json({ user: newUser }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
