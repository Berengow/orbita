import { useEffect, useState } from "react";
import { viewThumbUrl } from "@/lib/tour/view-thumb";

export function ViewThumb({
  src,
  yaw,
  pitch,
  hfov,
  custom,
}: {
  src: string;
  yaw: number;
  pitch: number;
  hfov: number;
  custom?: boolean;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!src) {
      setUrl("");
      return;
    }
    if (custom) {
      setUrl(src);
      return;
    }
    let cancel = false;
    viewThumbUrl(src, yaw, pitch, hfov)
      .then((next) => {
        if (!cancel) setUrl(next);
      })
      .catch(() => {
        if (!cancel) setUrl("");
      });
    return () => {
      cancel = true;
    };
  }, [src, yaw, pitch, hfov, custom]);
  if (!url) return null;
  return <img src={url} alt="" />;
}
