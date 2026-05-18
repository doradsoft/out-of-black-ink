import { jsPDF } from "jspdf";
import type { PDFPageProxy } from "pdfjs-dist";
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  hexToRgb,
  normalizeHexColor,
  parsePages,
  recolorImageData,
  type RgbColor,
} from "@doradsoft/out-of-black-ink";
import "./styles.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const mustQuery = <ElementType extends Element>(
  selector: string,
): ElementType => {
  const element = document.querySelector<ElementType>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
};

type RecoloredPage = {
  height: number;
  image: string;
  width: number;
};

const fileInput = mustQuery<HTMLInputElement>("#pdf-file");
const dropzone = mustQuery<HTMLLabelElement>("#dropzone");
const fileName = mustQuery<HTMLParagraphElement>("#file-name");
const form = mustQuery<HTMLFormElement>("#settings-form");
const convertButton = mustQuery<HTMLButtonElement>("#convert-button");
const statusText = mustQuery<HTMLParagraphElement>("#status");
const progress = mustQuery<HTMLProgressElement>("#progress");
const colorInput = mustQuery<HTMLInputElement>("#ink-color");
const colorText = mustQuery<HTMLInputElement>("#ink-color-text");
const scaleInput = mustQuery<HTMLInputElement>("#scale");
const thresholdInput = mustQuery<HTMLInputElement>("#threshold");
const saturationInput = mustQuery<HTMLInputElement>("#saturation");
const pagesInput = mustQuery<HTMLInputElement>("#pages");

let selectedFile: File | null = null;

const setStatus = (
  message: string,
  progressValue: number | null = null,
): void => {
  statusText.textContent = message;
  if (progressValue === null) {
    progress.hidden = true;
    progress.value = 0;
    return;
  }
  progress.hidden = false;
  progress.value = progressValue;
};

const setSelectedFile = (file: File | null): void => {
  selectedFile = file;
  fileName.textContent = file ? file.name : "No file selected";
  convertButton.disabled = !file;
  setStatus(file ? "Ready to convert." : "Select a PDF to begin.");
};

const syncColorText = () => {
  colorText.value = colorInput.value.toLowerCase();
};

const syncColorInput = () => {
  const normalized = normalizeHexColor(colorText.value);
  colorInput.value = normalized;
  colorText.value = normalized;
};

const renderRecoloredPage = async ({
  page,
  renderScale,
  targetColor,
  threshold,
  maxSaturation,
}: {
  maxSaturation: number;
  page: PDFPageProxy;
  renderScale: number;
  targetColor: RgbColor;
  threshold: number;
}): Promise<RecoloredPage> => {
  const viewport = page.getViewport({ scale: renderScale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  context.putImageData(
    recolorImageData(imageData, targetColor, threshold, maxSaturation),
    0,
    0,
  );

  return {
    image: canvas.toDataURL("image/jpeg", 0.92),
    width: viewport.width / renderScale,
    height: viewport.height / renderScale,
  };
};

const addPageToPdf = (
  outputPdf: InstanceType<typeof jsPDF> | null,
  pageImage: RecoloredPage,
): InstanceType<typeof jsPDF> => {
  const orientation =
    pageImage.width > pageImage.height ? "landscape" : "portrait";
  const nextPdf =
    outputPdf ??
    new jsPDF({
      orientation,
      unit: "pt",
      format: [pageImage.width, pageImage.height],
    });

  if (outputPdf) {
    nextPdf.addPage([pageImage.width, pageImage.height], orientation);
  }

  nextPdf.addImage(
    pageImage.image,
    "JPEG",
    0,
    0,
    pageImage.width,
    pageImage.height,
  );
  return nextPdf;
};

const convertPdf = async (): Promise<void> => {
  if (!selectedFile) {
    return;
  }

  const targetColor = hexToRgb(colorText.value);
  const renderScale = Number.parseFloat(scaleInput.value);
  const threshold = Number.parseInt(thresholdInput.value, 10);
  const maxSaturation = Number.parseInt(saturationInput.value, 10);
  const bytes = await selectedFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const selectedPages = parsePages(pagesInput.value, pdf.numPages);
  let outputPdf: InstanceType<typeof jsPDF> | null = null;

  for (const [pageIndex, pageNumber] of selectedPages.entries()) {
    setStatus(
      `Rendering page ${pageIndex + 1} of ${selectedPages.length}...`,
      pageIndex / selectedPages.length,
    );

    const page = await pdf.getPage(pageNumber);
    const pageImage = await renderRecoloredPage({
      page,
      renderScale,
      targetColor,
      threshold,
      maxSaturation,
    });
    outputPdf = addPageToPdf(outputPdf, pageImage);
  }

  const baseName = selectedFile.name.replace(/\.pdf$/i, "");
  if (!outputPdf) {
    throw new Error("No pages selected.");
  }
  outputPdf.save(`${baseName}-color-ink.pdf`);
  setStatus(
    `Converted ${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"}.`,
  );
};

fileInput.addEventListener("change", () => {
  setSelectedFile(fileInput.files?.[0] ?? null);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("is-dragging");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragging");
  const transfer = event.dataTransfer;
  if (!transfer) {
    setStatus("Please choose a PDF file.");
    return;
  }

  const file = transfer.files?.[0];
  if (
    file?.type === "application/pdf" ||
    file?.name.toLowerCase().endsWith(".pdf")
  ) {
    fileInput.files = transfer.files;
    setSelectedFile(file);
  } else {
    setStatus("Please choose a PDF file.");
  }
});

colorInput.addEventListener("input", syncColorText);
colorText.addEventListener("change", () => {
  try {
    syncColorInput();
    setStatus(selectedFile ? "Ready to convert." : "Select a PDF to begin.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Invalid color.");
  }
});

scaleInput.addEventListener("input", () => {
  mustQuery<HTMLOutputElement>("#scale-value").textContent = scaleInput.value;
});

thresholdInput.addEventListener("input", () => {
  mustQuery<HTMLOutputElement>("#threshold-value").textContent =
    thresholdInput.value;
});

saturationInput.addEventListener("input", () => {
  mustQuery<HTMLOutputElement>("#saturation-value").textContent =
    saturationInput.value;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  convertButton.disabled = true;
  try {
    await convertPdf();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Conversion failed.");
  } finally {
    convertButton.disabled = !selectedFile;
  }
});
