"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { ClipStatus } from "@/types/job.types";

interface Clip {
  id: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  status: string;
  progress: number;
  videoUrl: string | null;
  createdAt: Date;
  jobId: string;
  userId: string | null;
  job: {
    id: string;
    filename: string;
    userId: string | null;
  };
}

interface ClipDetailProps {
  initialClip: Clip;
}

export default function ClipDetail({ initialClip }: ClipDetailProps) {
  const [clip, setClip] = useState<Clip>(initialClip);
  const [isDownloading, setIsDownloading] = useState(false);

  // Show feedback toast on initial load if clip is complete and user hasn't seen it
  useEffect(() => {
    if (clip.status === ClipStatus.COMPLETE) {
      const hasSeenFeedback = localStorage.getItem('clipcast_feedback_shown');
      if (!hasSeenFeedback) {
        setTimeout(() => {
          toast((t) => (
            <div className="flex flex-col gap-2">
              <div className="font-semibold">🎉 How was your first clip?</div>
              <div className="text-sm text-gray-600">We'd love your feedback!</div>
              <div className="flex gap-2 mt-1">
                <a
                  href="https://tally.so/r/jaMxLQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-teal-500 text-white text-sm font-medium rounded hover:bg-teal-600 transition-colors"
                  onClick={() => {
                    localStorage.setItem('clipcast_feedback_shown', 'true');
                    toast.dismiss(t.id);
                  }}
                >
                  Share Feedback
                </a>
                <button
                  onClick={() => {
                    localStorage.setItem('clipcast_feedback_shown', 'true');
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          ), {
            duration: 10000,
            position: 'bottom-center',
          });
        }, 2000); // 2 second delay on page load
      }
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Poll for updates if clip is generating
    if (clip.status === ClipStatus.GENERATING) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/clips/${clip.id}`);
          if (response.ok) {
            const data = await response.json();
            const wasGenerating = clip.status === ClipStatus.GENERATING;
            setClip(data);

            // Stop polling if clip is complete or failed
            if (data.status === ClipStatus.COMPLETE || data.status === ClipStatus.FAILED) {
              clearInterval(interval);

              // Show feedback toast on first successful clip completion
              if (wasGenerating && data.status === ClipStatus.COMPLETE) {
                const hasSeenFeedback = localStorage.getItem('clipcast_feedback_shown');
                if (!hasSeenFeedback) {
                  setTimeout(() => {
                    toast((t) => (
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold">🎉 How was your first clip?</div>
                        <div className="text-sm text-gray-600">We'd love your feedback!</div>
                        <div className="flex gap-2 mt-1">
                          <a
                            href="https://tally.so/r/jaMxLQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-teal-500 text-white text-sm font-medium rounded hover:bg-teal-600 transition-colors"
                            onClick={() => {
                              localStorage.setItem('clipcast_feedback_shown', 'true');
                              toast.dismiss(t.id);
                            }}
                          >
                            Share Feedback
                          </a>
                          <button
                            onClick={() => {
                              localStorage.setItem('clipcast_feedback_shown', 'true');
                              toast.dismiss(t.id);
                            }}
                            className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900"
                          >
                            Maybe Later
                          </button>
                        </div>
                      </div>
                    ), {
                      duration: 10000, // Show for 10 seconds
                      position: 'bottom-center',
                    });
                  }, 1000); // Small delay so user sees the completed video first
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching clip status:", error);
        }
      }, 500); // Poll every 0.5 seconds for faster updates

      return () => clearInterval(interval);
    }
  }, [clip.id, clip.status]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm hover:shadow"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Clip Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{clip.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                Duration:{" "}
                {Math.floor((clip.endTime - clip.startTime) / 60)}:
                {String(Math.floor((clip.endTime - clip.startTime) % 60)).padStart(2, "0")}
              </span>
              <span>•</span>
              <span>
                {Math.floor(clip.startTime / 60)}:
                {String(Math.floor(clip.startTime % 60)).padStart(2, "0")} -{" "}
                {Math.floor(clip.endTime / 60)}:
                {String(Math.floor(clip.endTime % 60)).padStart(2, "0")}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              clip.status === "COMPLETE"
                ? "bg-green-100 text-green-800"
                : clip.status === "GENERATING"
                ? "bg-yellow-100 text-yellow-800"
                : clip.status === "FAILED"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {clip.status}
          </span>
        </div>

        {clip.description && (
          <p className="text-gray-700 mb-4">{clip.description}</p>
        )}

        {/* Progress Bar (if generating) */}
        {clip.status === "GENERATING" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Generating Video</span>
              <span className="text-sm font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {clip.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-3 rounded-full transition-all duration-200 ease-linear relative ${
                  clip.progress < 30
                    ? "bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500"
                    : clip.progress < 70
                    ? "bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500"
                    : "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600"
                }`}
                style={{ width: `${clip.progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                     style={{
                       backgroundSize: '200% 100%',
                       animation: 'shimmer 2s infinite'
                     }}
                />
              </div>
            </div>
            <style jsx>{`
              @keyframes shimmer {
                0% {
                  background-position: -200% 0;
                }
                100% {
                  background-position: 200% 0;
                }
              }
            `}</style>
            <p className="text-xs text-gray-500 mt-2">
              This usually takes 1-2 minutes. The page will update automatically.
            </p>
          </div>
        )}
      </div>

      {/* Video Player */}
      {clip.status === "COMPLETE" && clip.videoUrl ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Preview</h2>

          <div className="aspect-[9/16] max-w-md mx-auto bg-black rounded-lg overflow-hidden">
            <video controls className="w-full h-full" src={clip.videoUrl}>
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={async () => {
                try {
                  setIsDownloading(true);
                  // Use our API endpoint to proxy the download
                  const response = await fetch(`/api/clips/${clip.id}/download`);

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || `Download failed: ${response.status}`);
                  }

                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${clip.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Download failed:', error);
                  alert('Failed to download video. Please try again.');
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download MP4
                </>
              )}
            </button>
          </div>
        </div>
      ) : clip.status === "GENERATING" ? (
        <div className="bg-teal-50 rounded-lg border border-teal-200 p-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-4">
            <svg
              className="animate-spin h-8 w-8 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generating Your Video
          </h3>
          <p className="text-gray-600">
            This usually takes 1-2 minutes. The page will update automatically.
          </p>
        </div>
      ) : clip.status === "FAILED" ? (
        <div className="bg-red-50 rounded-lg border border-red-200 p-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Video Generation Failed
          </h3>
          <p className="text-gray-600 mb-4">
            Something went wrong while generating your video. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Video Not Generated Yet
          </h3>
          <p className="text-gray-600 mb-4">
            This clip hasn't been turned into a video yet.
          </p>
          <Link
            href={`/dashboard/jobs/${clip.jobId}`}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium inline-block"
          >
            Generate Video
          </Link>
        </div>
      )}

      {/* Job Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Source Podcast</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Filename:</span>
            <span className="font-medium text-gray-900">{clip.job.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Job ID:</span>
            <span className="font-mono text-xs text-gray-900">{clip.job.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="text-gray-900">
              {new Date(clip.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <Link
            href={`/dashboard/jobs/${clip.jobId}`}
            className="text-teal-600 hover:text-teal-700 font-medium text-sm"
          >
            View Full Job Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
