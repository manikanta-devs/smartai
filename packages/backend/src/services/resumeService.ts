import { jsPDF } from "jspdf";

interface ResumeSectionData {
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

/**
 * Generate clean, ATS-friendly HTML resume
 * - No fancy styling
 * - Standard structure
 * - Search engine optimized
 */
export const generateATSFriendlyResume = (data: ResumeSectionData): string => {
  const contactInfo = data.contactInfo || {};
  const experience = data.experience || [];
  const education = data.education || [];
  const skills = data.skills || [];
  const certifications = data.certifications || [];

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 40px;
            max-width: 850px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .contact-info {
            font-size: 11px;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
        }
        .entry {
            margin-bottom: 12px;
        }
        .entry-header {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .entry-subheader {
            font-size: 11px;
            margin-bottom: 2px;
            color: #333;
        }
        .entry-description {
            font-size: 11px;
            line-height: 1.5;
            margin-top: 2px;
        }
        .skills-list {
            font-size: 11px;
            line-height: 1.6;
        }
        .skill-item {
            display: inline-block;
            margin-right: 15px;
            margin-bottom: 5px;
        }
        ul {
            margin-left: 20px;
            font-size: 11px;
            line-height: 1.5;
        }
        li {
            margin-bottom: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${contactInfo.name || "YOUR NAME"}</div>
        <div class="contact-info">
            ${contactInfo.email ? `${contactInfo.email}` : ""}
            ${contactInfo.phone ? `| ${contactInfo.phone}` : ""}
            ${contactInfo.location ? `| ${contactInfo.location}` : ""}
            ${contactInfo.linkedin ? `| ${contactInfo.linkedin}` : ""}
            ${contactInfo.github ? `| ${contactInfo.github}` : ""}
        </div>
    </div>

    ${
      data.summary
        ? `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <p style="font-size: 11px; line-height: 1.5;">${data.summary}</p>
    </div>
    `
        : ""
    }

    ${
      skills.length > 0
        ? `
    <div class="section">
        <div class="section-title">Technical Skills</div>
        <div class="skills-list">
            ${skills.map((skill) => `<div class="skill-item">${skill}</div>`).join("")}
        </div>
    </div>
    `
        : ""
    }

    ${
      experience.length > 0
        ? `
    <div class="section">
        <div class="section-title">Professional Experience</div>
        ${experience
          .map(
            (job) => `
            <div class="entry">
                <div class="entry-header">${job.position}</div>
                <div class="entry-subheader">${job.company} | ${job.startDate} - ${job.endDate}</div>
                <div class="entry-description">${job.description}</div>
            </div>
        `
          )
          .join("")}
    </div>
    `
        : ""
    }

    ${
      education.length > 0
        ? `
    <div class="section">
        <div class="section-title">Education</div>
        ${education
          .map(
            (edu) => `
            <div class="entry">
                <div class="entry-header">${edu.degree} in ${edu.field}</div>
                <div class="entry-subheader">${edu.school} | ${edu.graduationDate}</div>
            </div>
        `
          )
          .join("")}
    </div>
    `
        : ""
    }

    ${
      certifications.length > 0
        ? `
    <div class="section">
        <div class="section-title">Certifications</div>
        ${certifications
          .map(
            (cert) => `
            <div class="entry">
                <div class="entry-header">${cert.name}</div>
                <div class="entry-subheader">${cert.issuer} | ${cert.date}</div>
            </div>
        `
          )
          .join("")}
    </div>
    `
        : ""
    }
</body>
</html>
  `;

  return html;
};

/**
 * Generate PDF from HTML resume
 */
export const generateResumePDF = (html: string, fileName: string = "resume.pdf"): Buffer => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Set up fonts
  doc.setFont("Arial");

  // For now, we'll return a simple text-based PDF
  // In production, use html2pdf or similar library

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let yPosition = margin;

  // Extract text from HTML for basic rendering
  const tempDiv = typeof document !== "undefined" ? document.createElement("div") : null;
  if (tempDiv) {
    tempDiv.innerHTML = html;
    const text = tempDiv.innerText;
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
};

/**
 * Parse resume text into structured data for ATS optimization
 */
export const parseResumeToStructuredData = (resumeText: string): ResumeSectionData => {
  const data: ResumeSectionData = {};

  // Extract name (typically at the beginning)
  const nameMatch = resumeText.match(/^([A-Z][A-Za-z\s]+)/m);
  if (nameMatch) {
    data.contactInfo = { name: nameMatch[1].trim() };
  }

  // Extract email
  const emailMatch = resumeText.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch && data.contactInfo) {
    data.contactInfo.email = emailMatch[1];
  }

  // Extract phone
  const phoneMatch = resumeText.match(/(\+?1?\s?[-.\(]?\d{3}[-.\)]?\s?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch && data.contactInfo) {
    data.contactInfo.phone = phoneMatch[1];
  }

  // Extract location
  const locationMatch = resumeText.match(/(New York|San Francisco|Los Angeles|Chicago|Boston|Seattle|Austin|Denver|Portland|Remote|[A-Za-z]+,\s*[A-Z]{2})/i);
  if (locationMatch && data.contactInfo) {
    data.contactInfo.location = locationMatch[1];
  }

  // Extract summary (usually a paragraph after contact info)
  const summaryMatch = resumeText.match(
    /(professional\s+summary|summary|objective|profile)[\s\n]+([\s\S]{50,300}?)(?=\n\n|experience|education|skills|$)/i
  );
  if (summaryMatch) {
    data.summary = summaryMatch[2].trim().substring(0, 200);
  }

  // Extract skills
  const skillsMatch = resumeText.match(
    /(?:skills?|technical\s+skills?)[\s\n]+([\s\S]{20,500}?)(?=\n\n|experience|education|$)/i
  );
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    data.skills = skillsText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 50);
  }

  return data;
};
