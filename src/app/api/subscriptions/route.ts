import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/subscriptions - Get user's subscriptions or all (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const all = searchParams.get("all") === "true";

    let subscriptions;
    
    if (all) {
      // Admin view - require admin
      const { requireAdmin } = await import('@/lib/admin')
      const adminCheck = await requireAdmin(request)
      if (!(adminCheck as any).ok) return adminCheck as NextResponse

      // get all subscriptions with module details
      subscriptions = await prisma.subscription.findMany({
        include: {
          module: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (userId) {
      // Get specific user's subscriptions
      subscriptions = await prisma.subscription.findMany({
        where: { userId },
        include: {
          module: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "userId parameter required or use all=true" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create new subscription (during account creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, moduleId } = body;

    if (!userId || !moduleId) {
      return NextResponse.json(
        { success: false, error: "userId and moduleId are required" },
        { status: 400 }
      );
    }

    // Get module price
    const moduleData = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleData) {
      return NextResponse.json(
        { success: false, error: "Module not found" },
        { status: 404 }
      );
    }

    // Check if user already has this module
    const existing = await prisma.subscription.findFirst({
      where: { userId, moduleId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "User already has this module" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        moduleId,
        amount: moduleData.price,
      },
      include: {
        module: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions - Update subscription status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, endDate } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        module: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions - Cancel/delete subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
