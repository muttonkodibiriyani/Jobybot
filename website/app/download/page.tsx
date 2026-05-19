import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-page section-pad text-center">
      <h1 className="h2">Download</h1>
      <p className="lead mx-auto mt-4 max-w-md">
        Purchased Jobybot Pro? Use the link on your success page after checkout.
      </p>
      <Link href="/pricing" className="btn-primary mt-8 inline-flex">
        Go to pricing
      </Link>
    </div>
  );
}
