/**
 * Time conversion utilities for handling different time formats
 */

/**
 * Converts a time string (MM:SS or HH:MM:SS) to seconds
 * @param timeString - Time in "MM:SS" or "HH:MM:SS" format
 * @returns Total seconds as a number
 */
export function timeStringToSeconds(timeString: string): number {
  const parts = timeString.split(":").map(Number);

  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  throw new Error(`Invalid time format: ${timeString}`);
}

/**
 * Converts seconds to MM:SS format
 * @param seconds - Total seconds
 * @returns Time string in "MM:SS" format
 */
export function secondsToMMSS(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Converts seconds to HH:MM:SS format
 * @param seconds - Total seconds
 * @returns Time string in "HH:MM:SS" format
 */
export function secondsToHHMMSS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Validates if a time string matches the expected format
 * @param timeString - Time string to validate
 * @param format - Expected format ("MM:SS" or "HH:MM:SS")
 * @returns true if valid, false otherwise
 */
export function isValidTimeFormat(timeString: string, format: "MM:SS" | "HH:MM:SS"): boolean {
  if (format === "MM:SS") {
    return /^\d{1,2}:\d{2}$/.test(timeString);
  } else if (format === "HH:MM:SS") {
    return /^\d{1,2}:\d{2}:\d{2}$/.test(timeString);
  }
  return false;
}
