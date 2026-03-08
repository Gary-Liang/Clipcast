import JobStatus from "@/components/JobStatus";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobPage({ params }: PageProps) {
  const { jobId } = await params;

  return (
    <div className="py-8">
      <JobStatus jobId={jobId} />
    </div>
  );
}
