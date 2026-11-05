// Built by Olivia — https://discord.gg/ojailbreaks
import QRCode from "qrcode";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const status = JSON.parse(
  await readFile(new URL("docs/deployment-status.json", root), "utf8"),
);
const pending = process.argv.includes("--pending");
if (
  !pending &&
  (status.status !== "verified" || !status.verifiedUrl || !status.verifiedAt)
) {
  console.error(
    "No verified deployment recorded. Verify the public site first, or use --pending for an explicitly unverified draft QR.",
  );
  process.exitCode = 1;
} else {
  const target = pending ? status.proposedUrl : status.verifiedUrl;
  if (target !== "https://whybemqd.github.io/logiclab/")
    throw new Error("Unexpected demo destination; review deployment metadata.");
  const directory = new URL("docs/portfolio-assets/", root);
  await mkdir(directory, { recursive: true });
  const file = new URL(
    pending ? "demo-qr-PENDING.png" : "demo-qr.png",
    directory,
  );
  await QRCode.toFile(fileURLToPath(file), target, {
    width: 768,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#10243c", light: "#ffffff" },
  });
  console.log(
    `${pending ? "UNVERIFIED destination draft" : "QR for recorded verified URL"}: ${target}`,
  );
  console.log(fileURLToPath(file));
}
