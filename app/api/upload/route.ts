import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Upload API] Request received");
    
    // Configure Cloudinary inside the handler
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Cloudinary configuration missing:", {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
      });
      return NextResponse.json(
        { error: "Server configuration error: Cloudinary not configured" },
        { status: 500 }
      );
    }

    // Get session cookie
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie) {
      console.error("[Upload API] No session cookie found");
      return NextResponse.json({ error: "Unauthorized: No session cookie" }, { status: 401 });
    }

    // Verify session
    try {
      await adminAuth.verifySessionCookie(sessionCookie);
      console.log("[Upload API] Session verified");
    } catch (error) {
      console.error("[Upload API] Session verification failed:", error);
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // 'profile' or 'work'

    if (!file) {
      console.error("[Upload API] No file in request");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("[Upload API] File received:", { name: file.name, type: file.type, size: file.size });

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      console.error("[Upload API] Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error("[Upload API] File too large:", file.size);
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    console.log("[Upload API] Converting file to buffer...");
    // Convert File -> Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine folder based on type
    const folder =
      type === "profile" ? "nearserve/profiles" : "nearserve/previous-work";

    console.log("[Upload API] Uploading to Cloudinary folder:", folder);
    
    // Upload to Cloudinary
    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            transformation: [
              { width: 500, height: 500, crop: "limit" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error: unknown, result: unknown) => {
            if (error) {
              console.error("[Upload API] Cloudinary upload error:", error);
              return reject(error);
            }
            console.log("[Upload API] Cloudinary upload successful");
            resolve(result as CloudinaryUploadResult);
          }
        );

        stream.end(buffer);
      }
    );

    return NextResponse.json(
      {
        publicId: result.public_id,
        url: result.secure_url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Upload API] Inner try-catch error:", error);
    console.error("[Upload API] Error type:", typeof error);
    console.error("[Upload API] Error stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Provide more detailed error message
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("[Upload API] Error message:", error.message);
      console.error("[Upload API] Error stack:", error.stack);
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to upload image",
        details: errorMessage,
        hint: process.env.NODE_ENV === "development" ? "Check Cloudinary configuration (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)" : undefined
      },
      { status: 500 }
    );
  }
  } catch (error) {
    console.error("[Upload API] Outer try-catch error (unhandled):", error);
    const errorMessage = error instanceof Error ? error.message : "Unhandled server error";
    return NextResponse.json(
      { error: "Server error", details: errorMessage },
      { status: 500 }
    );
  }
}
