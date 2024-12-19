import type { DecodedTag } from "~api/modules/sign/tags";

export const TIMESTAMP_TAGS = ["Expires-At", "X-Timestamp"] as const;
type TimestampTag = (typeof TIMESTAMP_TAGS)[number];

const TIMESTAMP_TAG_SET = Object.freeze(new Set(TIMESTAMP_TAGS));

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const isTimestampTag = (tag: string): tag is TimestampTag =>
  TIMESTAMP_TAG_SET.has(tag as TimestampTag);

export const humanizeTimestamp = (
  timestamp: string | number | Date | undefined
): string => {
  if (!timestamp) return "";

  try {
    const date = timestamp instanceof Date ? timestamp : new Date(+timestamp);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    return timestampFormatter.format(date);
  } catch {
    return String(timestamp);
  }
};

export const humanizeTimestampTags = (tags: DecodedTag[]): DecodedTag[] => {
  return tags.map(({ name, ...rest }) =>
    isTimestampTag(name)
      ? { name, ...rest, value: humanizeTimestamp(rest.value) }
      : { name, ...rest }
  );
};
