import { requireUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db/client";
import { redirect, notFound } from "next/navigation";
import ClipDetail from "@/components/ClipDetail";

interface ClipPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClipPage({ params }: ClipPageProps) {
  const user = await requireUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;

  // Get clip with job data
  const clip = await prisma.clip.findUnique({
    where: { id },
    include: {
      job: true,
    },
  });

  if (!clip) {
    notFound();
  }

  // Verify user owns this clip (if clip has userId)
  if (clip.userId && clip.userId !== user.id) {
    notFound();
  }

  // Also check if user owns the job
  if (clip.job.userId && clip.job.userId !== user.id) {
    notFound();
  }

  // Convert to plain object to pass to client component
  const clipData = {
    ...clip,
    createdAt: clip.createdAt,
  };

  return <ClipDetail initialClip={clipData} />;
}
