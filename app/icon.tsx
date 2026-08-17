import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 58%, #22D3EE 100%)",
          borderRadius: 18,
          color: "white",
          display: "flex",
          fontSize: 38,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.08em",
          width: "100%",
        }}
      >
        V
      </div>
    ),
    size,
  );
}
