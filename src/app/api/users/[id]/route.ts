import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { fullName, username, password, role, tenantId } = body;

        if (!fullName || !username || !role || !tenantId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user exists and belongs to the correct tenant
        const existingUser = await prisma.user.findFirst({
            where: {
                id: params.id,
                tenantId: tenantId
            }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found or access denied" },
                { status: 404 }
            );
        }

        const dataToUpdate: any = {
            fullName,
            username,
            role,
        };

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: params.id,
            },
            data: dataToUpdate,
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                tenantId: true,
            }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json(
                { error: "Tenant ID is required" },
                { status: 400 }
            );
        }

        // Check if user belongs to the tenant
        const userToDelete = await prisma.user.findFirst({
            where: {
                id: params.id,
                tenantId: tenantId
            }
        });

        if (!userToDelete) {
            return NextResponse.json(
                { error: "User not found or access denied" },
                { status: 404 }
            );
        }

        await prisma.user.delete({
            where: {
                id: params.id,
            },
        });

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
