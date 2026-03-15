"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { JobStatusResponse } from "@/types/api.types";
import { JobStatus as JobStatusEnum } from "@/types/job.types";

interface JobStatusProps {
  jobId: string;
}

export default function JobStatus({ jobId }: JobStatusProps) {
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [downloadingClips, setDownloadingClips] = useState<Set<string>>(new Set());
  const [detectingClips, setDetectingClips] = useState(false);
  const [generatingVideos, setGeneratingVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);

        if (!response.ok) {
          // Check if response is JSON before parsing
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch job status");
          } else {
            // HTML error page (404, 500, etc.) - don't try to parse as JSON
            throw new Error(`Request failed with status ${response.status}`);
          }
        }

        const data = await response.json();
        setJob(data);
        setError(null);
      } catch (err) {
        // Log error for debugging
        console.error("Error fetching job status:", err);

        // Only set error state on initial load or persistent failures
        // If we already have job data, this is likely a transient polling error - ignore it
        if (!job) {
          setError(err instanceof Error ? err.message : "Failed to load job");
        } else {
          // Transient error during polling - log but don't show to user
          console.warn("Transient polling error (ignored):", err instanceof Error ? err.message : err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatus();

    // Check if we should poll based on current state
    const shouldPoll =
      job?.status === JobStatusEnum.TRANSCRIBING ||
      job?.status === JobStatusEnum.DETECTING_CLIPS ||
      job?.clips?.some((clip) => clip.status === "GENERATING");

    // Only poll if there's actually work being done
    if (!shouldPoll) {
      return;
    }

    // Poll frequently for video generation (250ms) to catch progress updates, slower for transcription (5s)
    const pollInterval = job?.clips?.some((clip) => clip.status === "GENERATING") ? 250 : 5000;

    const interval = setInterval(() => {
      fetchJobStatus();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [jobId, job?.status, job?.clips]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case JobStatusEnum.TRANSCRIPTION_COMPLETE:
      case JobStatusEnum.CLIPS_DETECTED:
        return "bg-green-100 text-green-800 border-green-200";
      case JobStatusEnum.TRANSCRIBING:
      case JobStatusEnum.DETECTING_CLIPS:
      case JobStatusEnum.PENDING_UPLOAD:
        return "bg-blue-100 text-blue-800 border-teal-200";
      case JobStatusEnum.TRANSCRIPTION_FAILED:
      case JobStatusEnum.FAILED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleDetectClips = async () => {
    if (!job) return;

    setDetectingClips(true);
    setError(null);

    try {
      const response = await fetch("/api/detect-clips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to detect clips");
      }

      // Refresh job status immediately
      const statusResponse = await fetch(`/api/jobs/${jobId}`);
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setJob(data);
      }
    } catch (err) {
      console.error("Clip detection error:", err);
      setError(err instanceof Error ? err.message : "Failed to detect clips");
    } finally {
      setDetectingClips(false);
    }
  };

  const handleGenerateVideo = async (clipId: string) => {
    setGeneratingVideos((prev) => new Set(prev).add(clipId));
    setError(null);

    try {
      const response = await fetch("/api/generate-videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to generate video";

        // Show toast notification for limit errors
        if (errorMessage.includes("Free tier limit reached")) {
          toast.error(
            (t) => (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">🚫 Free Tier Limit Reached</div>
                <div className="text-sm text-gray-600">
                  You've used all 3 free clips this month. Upgrade to Pro for unlimited clips!
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="mt-1 px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-900"
                >
                  Got it
                </button>
              </div>
            ),
            { duration: 8000, position: "top-center" }
          );
        } else {
          // Show generic error toast for other errors
          toast.error(errorMessage, { duration: 5000 });
        }

        throw new Error(errorMessage);
      }

      // Refresh job status immediately
      const statusResponse = await fetch(`/api/jobs/${jobId}`);
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setJob(data);
      }
    } catch (err) {
      console.error("Video generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setGeneratingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-700">Job not found</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card with Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Processing Status</h2>
                <p className="text-sm text-gray-600">{job.filename}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-semibold ${getStatusColor(
                job.status
              )}`}
            >
              {getStatusText(job.status)}
            </span>
          </div>
        </div>

        {/* Transcription Progress Indicator */}
        {job.status === JobStatusEnum.TRANSCRIBING && (
          <div className="px-6 py-4">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 text-teal-600 mr-3"
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
                <div className="flex-1">
                  <p className="text-sm font-semibold text-teal-900">Transcribing audio...</p>
                  <p className="text-xs text-teal-700 mt-1">
                    This usually takes 3-5 minutes. We'll automatically update when it's done.
                  </p>
                </div>
              </div>
              <div className="w-full bg-teal-200 rounded-full h-2 overflow-hidden mt-3">
                <div className="h-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 rounded-full animate-pulse"
                     style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Clip Detection Progress Indicator */}
        {job.status === JobStatusEnum.DETECTING_CLIPS && (
          <div className="px-6 py-4">
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 text-cyan-600 mr-3"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-cyan-900">Detecting viral clips...</p>
                  <p className="text-xs text-cyan-700 mt-1">
                    AI is analyzing your transcript for shareable moments • Usually takes 30-60 seconds
                  </p>
                </div>
              </div>
              <div className="w-full bg-cyan-200 rounded-full h-2 overflow-hidden mt-3">
                <div className="h-2 bg-gradient-to-r from-cyan-400 via-teal-500 to-cyan-400 rounded-full animate-pulse"
                     style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        )}

        {/* File Information Grid */}
        <div className="px-6 py-4 grid md:grid-cols-3 gap-4 border-t border-gray-100">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">File Size</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {(job.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {job.duration && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {Math.floor(job.duration / 60)}:
                  {Math.floor(job.duration % 60)
                    .toString()
                    .padStart(2, "0")}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {job.error && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-600 mt-1">{job.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Section */}
      {job.transcript && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Transcript {!showFullTranscript && <span className="text-gray-500 font-normal">(Preview)</span>}
              </h3>
            </div>
            <div className="flex gap-2">
              {job.transcript.split("\n").length > 20 && (
                <button
                  onClick={() => setShowFullTranscript(!showFullTranscript)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {showFullTranscript ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show Less
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Show Full
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  const blob = new Blob([job.transcript], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `transcript-${job.id}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
          <div className={`p-6 bg-white overflow-y-auto ${showFullTranscript ? 'max-h-96' : 'max-h-64'}`}>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {showFullTranscript
                ? job.transcript
                : job.transcript.split("\n").slice(0, 20).join("\n") +
                  (job.transcript.split("\n").length > 20 ? "\n\n..." : "")}
            </pre>
          </div>
        </div>
      )}

      {/* Detect Clips Button */}
      {job.status === JobStatusEnum.TRANSCRIPTION_COMPLETE && (!job.clips || job.clips.length === 0) && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg shadow-sm border border-teal-200 p-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-3">
              <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready to Find Viral Moments</h3>
            <p className="text-sm text-gray-600">AI will analyze your transcript and identify 3-5 shareable clips</p>
          </div>
          {detectingClips ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 py-3">
                <div className="relative">
                  <svg
                    className="animate-spin h-8 w-8 text-teal-600"
                    xmlns="http://www.w3.org/2000/svg"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Analyzing transcript...</p>
                  <p className="text-xs text-gray-600">AI is finding viral moments • Usually takes 30-60 seconds</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 rounded-full animate-pulse"
                     style={{ width: '100%' }} />
              </div>
            </div>
          ) : (
            <button
              onClick={handleDetectClips}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg
                hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                transition-all shadow-md hover:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Detect Viral Clips
              </span>
            </button>
          )}
        </div>
      )}

      {/* Detected Clips */}
      {job.clips && job.clips.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detected Clips</h3>
                <p className="text-sm text-gray-600">{job.clips.length} viral moments found</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {job.clips.map((clip) => {
                const duration = clip.endTime - clip.startTime;
                const viralScore = extractViralScore(clip.description);
                const category = extractCategory(clip.description);
                const hook = extractHook(clip.description);

                return (
                  <div
                    key={clip.id}
                    className="p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg transition-all hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg flex-1">
                        {clip.title}
                      </h3>
                      <div className="flex gap-2 ml-3">
                        {/* Viral Score Badge */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            viralScore >= 8
                              ? "bg-green-100 text-green-800"
                              : viralScore >= 6
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {viralScore >= 8 ? "⭐ " : ""}{viralScore}/10
                        </span>
                        {/* Duration Badge */}
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">
                          {Math.floor(duration / 60)}:{(duration % 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    {/* Category Tag */}
                    {category && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryColor(
                          category
                        )}`}
                      >
                        {getCategoryIcon(category)} {category}
                      </span>
                    )}

                    {/* Hook/Description */}
                    {hook && (
                      <p className="text-sm text-gray-600 italic mb-3">
                        {hook}
                      </p>
                    )}

                    {/* Timestamps */}
                    <p className="text-xs text-gray-500 mb-3">
                      {Math.floor(clip.startTime / 60)}:
                      {Math.floor(clip.startTime % 60)
                        .toString()
                        .padStart(2, "0")}{" "}
                      -{" "}
                      {Math.floor(clip.endTime / 60)}:
                      {Math.floor(clip.endTime % 60)
                        .toString()
                        .padStart(2, "0")}
                    </p>

                    {/* Clip Status & Actions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        {clip.status && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              clip.status === "COMPLETE"
                                ? "bg-green-100 text-green-800"
                                : clip.status === "GENERATING"
                                ? "bg-blue-100 text-blue-800"
                                : clip.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {clip.status === "PENDING" && "⏳ Ready"}
                            {clip.status === "GENERATING" && "🎬 Generating..."}
                            {clip.status === "COMPLETE" && "✅ Complete"}
                            {clip.status === "FAILED" && "❌ Failed"}
                          </span>
                        )}

                        {/* Generate Video Button */}
                        {clip.status === "PENDING" && (
                          <button
                            onClick={() => handleGenerateVideo(clip.id)}
                            disabled={generatingVideos.has(clip.id)}
                            className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold rounded
                              hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-500
                              disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {generatingVideos.has(clip.id) ? "Generating..." : "🎥 Generate Video"}
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {clip.status === "GENERATING" && (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Rendering video...</span>
                            <span className="text-sm font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                              {clip.progress !== null && clip.progress !== undefined ? `${clip.progress}%` : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className={`h-3 rounded-full transition-all duration-200 ease-linear relative ${
                                (clip.progress || 0) < 30
                                  ? "bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500"
                                  : (clip.progress || 0) < 70
                                  ? "bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500"
                                  : "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600"
                              }`}
                              style={{ width: `${clip.progress || 0}%` }}
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
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
                        </div>
                      )}
                    </div>

                    {/* Video Player */}
                    {clip.videoUrl && clip.status === "COMPLETE" && (
                      <div className="mt-4">
                        <div className="max-w-sm mx-auto">
                          <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                            <video
                              controls
                              className="w-full h-full object-contain"
                            >
                              <source src={clip.videoUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                setDownloadingClips(prev => new Set(prev).add(clip.id));
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
                                a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Download failed:', error);
                                alert('Failed to download video. Please try again.');
                              } finally {
                                setDownloadingClips(prev => {
                                  const next = new Set(prev);
                                  next.delete(clip.id);
                                  return next;
                                });
                              }
                            }}
                            disabled={downloadingClips.has(clip.id)}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloadingClips.has(clip.id) ? (
                              <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Video
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Extract viral score from description string
 * Format: "hook text (category) - Score: 8/10"
 */
function extractViralScore(description?: string | null): number {
  if (!description) return 7; // Default score
  const match = description.match(/Score:\s*(\d+)\/10/);
  return match ? parseInt(match[1], 10) : 7;
}

/**
 * Extract category from description string
 * Format: "hook text (category) - Score: 8/10"
 */
function extractCategory(description?: string | null): string {
  if (!description) return "";
  const match = description.match(/\((\w+)\)/);
  return match ? match[1] : "";
}

/**
 * Extract hook text from description string
 * Format: "hook text (category) - Score: 8/10"
 */
function extractHook(description?: string | null): string {
  if (!description) return "";
  // Extract everything before the category parentheses
  const match = description.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : description;
}

/**
 * Get CSS classes for category badge color
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    insight: "bg-blue-100 text-blue-800",
    funny: "bg-yellow-100 text-yellow-800",
    controversial: "bg-red-100 text-red-800",
    emotional: "bg-purple-100 text-purple-800",
    story: "bg-green-100 text-green-800",
    advice: "bg-orange-100 text-orange-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
}

/**
 * Get emoji icon for category
 */
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    insight: "💡",
    funny: "😄",
    controversial: "🔥",
    emotional: "❤️",
    story: "📖",
    advice: "🧭",
  };
  return icons[category] || "📌";
}
