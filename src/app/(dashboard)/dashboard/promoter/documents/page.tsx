import { PromoterDocumentsPage } from "@/features/dashboard/components/promoter-documents-page";
import { listDocumentReviewQueue } from "@/server/services/document-submissions.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function PromoterDocumentsRoute() {
  const user = await getAuthenticatedUser();
  const reviewQueue = user ? await listDocumentReviewQueue(user) : [];

  return <PromoterDocumentsPage reviewQueue={reviewQueue} />;
}
