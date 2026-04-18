import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type TextItem = {
  str?: string;
};

const parsePdfWithPdfJs = async (buffer: Buffer): Promise<string> => {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer)
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = (content.items as TextItem[])
      .map((item) => item.str || "")
      .join(" ")
      .trim();

    if (text) {
      pageTexts.push(text);
    }
  }

  return pageTexts.join("\n");
};

export const parseResumeFile = async (buffer: Buffer, filename: string): Promise<string> => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return parsePdfWithPdfJs(buffer);
  } else if (ext === "docx" || ext === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (ext === "txt") {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file format");
};

export const extractResumeInfo = (text: string) => {
  const emailMatch = text.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = text.match(/(\+?1?\s?[-.\(]?\d{3}[-.\)]?\s?\d{3}[-.\s]?\d{4})/);

  const skills: string[] = [];
  const skillKeywords = [
    "javascript",
    "typescript",
    "react",
    "node",
    "express",
    "python",
    "java",
    "sql",
    "postgresql",
    "mongodb",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "git",
    "rest",
    "graphql",
    "html",
    "css",
    "tailwind",
    "webpack",
    "vite",
    "jest",
    "testing",
    "agile",
    "scrum",
    "leadership",
    "communication",
    "problem-solving"
  ];

  skillKeywords.forEach((skill) => {
    if (text.toLowerCase().includes(skill)) {
      skills.push(skill);
    }
  });

  return {
    email: emailMatch?.[0] || null,
    phone: phoneMatch?.[0] || null,
    skills: [...new Set(skills)],
    wordCount: text.split(/\s+/).length
  };
};
