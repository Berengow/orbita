/** Perspective thumbnail of an equirectangular panorama at a yaw/pitch. */

const cache = new Map<string, string>();
const pixels = new Map<string, ImageData>();

export function viewThumbUrl(src: string, yaw: number, pitch: number, hfov: number): Promise<string> {
  const key = `${src}|${Math.round(yaw)}|${Math.round(pitch)}|${Math.round(hfov)}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  return paint(src, yaw, pitch, hfov).then((url) => {
    cache.set(key, url);
    return url;
  });
}

async function paint(src: string, yaw: number, pitch: number, hfov: number): Promise<string> {
  const sample = await sourcePixels(src);
  const outW = 360;
  const outH = 202;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  const out = ctx.createImageData(outW, outH);
  project(sample, yaw, pitch, hfov, out);
  ctx.putImageData(out, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function sourcePixels(src: string): Promise<ImageData> {
  const hit = pixels.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 960;
      const scale = Math.min(1, max / img.width);
      const w = Math.max(2, Math.round(img.width * scale));
      const h = Math.max(2, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      pixels.set(src, data);
      resolve(data);
    };
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

export function project(sample: ImageData, yaw: number, pitch: number, hfov: number, out: ImageData) {
  const sw = sample.width;
  const sh = sample.height;
  const src = sample.data;
  const dst = out.data;
  const ow = out.width;
  const oh = out.height;
  const yawR = (yaw * Math.PI) / 180;
  const pitchR = (pitch * Math.PI) / 180;
  const cosY = Math.cos(yawR);
  const sinY = Math.sin(yawR);
  const cosP = Math.cos(pitchR);
  const sinP = Math.sin(pitchR);
  const tanH = Math.tan(((Math.min(120, Math.max(50, hfov)) * Math.PI) / 180) / 2);
  const aspect = ow / oh;
  for (let y = 0; y < oh; y++) {
    const ny = 1 - ((y + 0.5) / oh) * 2;
    const vy = (ny * tanH) / aspect;
    for (let x = 0; x < ow; x++) {
      const nx = ((x + 0.5) / ow) * 2 - 1;
      let vx = nx * tanH;
      let vz = 1;
      const len = Math.hypot(vx, vy, vz);
      vx /= len;
      const vyN = vy / len;
      vz /= len;
      const y1 = vyN * cosP + vz * sinP;
      const z1 = -vyN * sinP + vz * cosP;
      const x2 = vx * cosY + z1 * sinY;
      const z2 = -vx * sinY + z1 * cosY;
      const lon = Math.atan2(x2, z2);
      const lat = Math.asin(Math.max(-1, Math.min(1, y1)));
      const u = (lon / (Math.PI * 2) + 0.5) * sw;
      const v = (0.5 - lat / Math.PI) * sh;
      const i = (y * ow + x) * 4;
      sampleBilinear(src, sw, sh, u, v, dst, i);
    }
  }
}

function sampleBilinear(src: Uint8ClampedArray, sw: number, sh: number, u: number, v: number, dst: Uint8ClampedArray, i: number) {
  let uu = u % sw;
  if (uu < 0) uu += sw;
  const vv = Math.max(0, Math.min(sh - 1.001, v));
  const x0 = Math.floor(uu);
  const y0 = Math.floor(vv);
  const x1 = (x0 + 1) % sw;
  const y1 = Math.min(sh - 1, y0 + 1);
  const tx = uu - x0;
  const ty = vv - y0;
  const i00 = (y0 * sw + x0) * 4;
  const i10 = (y0 * sw + x1) * 4;
  const i01 = (y1 * sw + x0) * 4;
  const i11 = (y1 * sw + x1) * 4;
  for (let c = 0; c < 3; c++) {
    const a = src[i00 + c] * (1 - tx) + src[i10 + c] * tx;
    const b = src[i01 + c] * (1 - tx) + src[i11 + c] * tx;
    dst[i + c] = a * (1 - ty) + b * ty;
  }
  dst[i + 3] = 255;
}
