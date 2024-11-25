import { useEffect } from "react";

export function useRemoveCover() {
  console.log("useRemoveCover()");

  useEffect(() => {
    const coverElement = document.getElementById("cover");

    if (coverElement) {
      coverElement.setAttribute("aria-hidden", "true");
    }
  }, []);
}
