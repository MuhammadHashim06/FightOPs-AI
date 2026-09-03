import { NextResponse } from "next/server";

import { unauthorized } from "@/lib/api/response";
import { downloadDocumentSubmission } from "@/server/services/document-submissions.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/document-submissions/[submissionId]/file">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { submissionId } = await context.params;
    const file = await downloadDocumentSubmission({ user, submissionId });
    const safeFileName = file.fileName.replace(/[\r\n"\\]/g, "_");

    return new NextResponse(new Uint8Array(file.body), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${safeFileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Unable to open document.",
        },
      },
      { status: 404 },
    );
  }
}
