type DownloadProfileQrInput = {
  displayName: string;
  username: string;
  publicUrl: string;
};

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

export async function downloadProfileQr({ displayName, username, publicUrl }: DownloadProfileQrInput) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  const qrCanvas = document.createElement("canvas");
  const { toCanvas } = await import("qrcode");
  await toCanvas(qrCanvas, publicUrl, {
    width: 580,
    margin: 4,
    errorCorrectionLevel: "H",
    color: {
      dark: "#090912",
      light: "#FFFFFF",
    },
  });

  if (document.fonts?.ready) await document.fonts.ready;
  drawPoster(context, qrCanvas, displayName, username);

  const blob = await canvasToBlob(canvas);
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = `dilink-${safeFilename(username)}-qr.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function drawPoster(
  context: CanvasRenderingContext2D,
  qrCanvas: HTMLCanvasElement,
  displayName: string,
  username: string,
) {
  const background = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  background.addColorStop(0, "#FCFBFF");
  background.addColorStop(0.52, "#F1EDFA");
  background.addColorStop(1, "#E4DDF1");
  context.fillStyle = background;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.save();
  context.globalAlpha = 0.11;
  context.fillStyle = "#7C3AED";
  context.beginPath();
  context.arc(970, 80, 280, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#111827";
  context.beginPath();
  context.arc(40, 1260, 230, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.save();
  context.shadowColor = "rgba(15, 9, 35, 0.26)";
  context.shadowBlur = 70;
  context.shadowOffsetY = 28;
  roundedRectangle(context, 100, 105, 880, 1140, 64);
  context.fillStyle = "#0B0A14";
  context.fill();
  context.restore();

  const frameGlow = context.createLinearGradient(140, 140, 940, 1190);
  frameGlow.addColorStop(0, "rgba(124, 58, 237, 0.34)");
  frameGlow.addColorStop(0.48, "rgba(37, 99, 235, 0.08)");
  frameGlow.addColorStop(1, "rgba(34, 211, 238, 0.14)");
  roundedRectangle(context, 100, 105, 880, 1140, 64);
  context.fillStyle = frameGlow;
  context.fill();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#FFFFFF";
  context.font = fitFont(context, displayName.trim() || username, 62, 42, 720, "700");
  context.fillText(displayName.trim() || username, CANVAS_WIDTH / 2, 205);

  context.fillStyle = "rgba(255, 255, 255, 0.62)";
  context.font = "500 28px Inter, Arial, sans-serif";
  context.fillText(`DiLink/${username}`, CANVAS_WIDTH / 2, 272);

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.24)";
  context.shadowBlur = 32;
  context.shadowOffsetY = 14;
  roundedRectangle(context, 170, 350, 740, 740, 50);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.restore();

  context.drawImage(qrCanvas, 250, 430, 580, 580);

  context.fillStyle = "#FFFFFF";
  context.font = "700 31px Inter, Arial, sans-serif";
  context.fillText("Escanea para abrir mi página", CANVAS_WIDTH / 2, 1155);

  context.fillStyle = "rgba(255, 255, 255, 0.5)";
  context.font = "600 21px Inter, Arial, sans-serif";
  context.fillText("Creado con DiLink", CANVAS_WIDTH / 2, 1202);
}

function fitFont(
  context: CanvasRenderingContext2D,
  value: string,
  maximumSize: number,
  minimumSize: number,
  maximumWidth: number,
  weight: string,
) {
  let size = maximumSize;
  while (size > minimumSize) {
    context.font = `${weight} ${size}px Inter, Arial, sans-serif`;
    if (context.measureText(value).width <= maximumWidth) break;
    size -= 2;
  }
  return `${weight} ${size}px Inter, Arial, sans-serif`;
}

function roundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.arcTo(x + width, y, x + width, y + height, corner);
  context.arcTo(x + width, y + height, x, y + height, corner);
  context.arcTo(x, y + height, x, y, corner);
  context.arcTo(x, y, x + width, y, corner);
  context.closePath();
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("image_generation_failed"));
    }, "image/png");
  });
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "perfil";
}
