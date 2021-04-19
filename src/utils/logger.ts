import { getStoreData } from "./background";
import dayjs from "dayjs";
import manifest from "../../public/manifest.json";

/**
 * Log something to the console, if loggin is enabled
 */
export async function log(
  msg: string,
  filename: string,
  line: number,
  type: "error" | "warn" | "log" = "log",
  error?: any
) {
  const date = dayjs().format("YYYY-MM-DD");
  const loggingEnabled: boolean =
    (await getStoreData())?.settings?.logging ?? false;
  const prefix =
    type === "error" ? "Error" : type === "warn" ? "Warning" : "Info";
  const errorText = error && type === "error" ? `\n  Error: ${error}` : "";

  if (!loggingEnabled) return;
  console[type](
    `[ArConnect ${manifest.version}] ${prefix}:\n  ${msg}\n  File: ${filename}\n  Line: ${line}\n  Time: ${date}` +
      errorText
  );
}
