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

  // Initialize contact info
  data.contactInfo = {};

  // Extract name (typically at the beginning)
  const nameMatch = resumeText.match(/^([A-Z][A-Za-z\s]+)/m);
  if (nameMatch) {
    data.contactInfo.name = nameMatch[1].trim();
  }

  // Extract email
  const emailMatch = resumeText.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    data.contactInfo.email = emailMatch[1];
  }

  // Extract phone
  const phoneMatch = resumeText.match(/(\+?1?\s?[-.\(]?\d{3}[-.\)]?\s?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) {
    data.contactInfo.phone = phoneMatch[1];
  }

  // Extract location
  const locationMatch = resumeText.match(/(New York|San Francisco|Los Angeles|Chicago|Boston|Seattle|Austin|Denver|Portland|Remote|[A-Za-z]+,\s*[A-Z]{2})/i);
  if (locationMatch) {
    data.contactInfo.location = locationMatch[1];
  }

  // Extract LinkedIn
  const linkedinMatch = resumeText.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  if (linkedinMatch) {
    data.contactInfo.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // Extract GitHub
  const githubMatch = resumeText.match(/github\.com\/([a-zA-Z0-9-]+)/i);
  if (githubMatch) {
    data.contactInfo.github = `https://github.com/${githubMatch[1]}`;
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
    /(?:skills?|technical\s+skills?)[\s\n]+([\s\S]{20,500}?)(?=\n\n|experience|education|certification|$)/i
  );
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    data.skills = skillsText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 50);
  }

  // Extract experience
  const experienceMatch = resumeText.match(
    /(?:professional\s+experience|work\s+history|experience|employment)[\s\n]+([\s\S]{50,2000}?)(?=\n\n|education|certification|skills|$)/i
  );
  if (experienceMatch) {
    const expText = experienceMatch[1];
    // Split by likely job entry patterns (dates, company names in caps, etc.)
    const jobEntries = expText.split(/\n(?=[A-Z])/);
    data.experience = [];
    
    jobEntries.forEach((entry) => {
      const trimmed = entry.trim();
      if (trimmed.length > 20) {
        // Try to extract position and company
        const positionMatch = trimmed.match(/^([A-Za-z\s]+)\s*(?:at|,)/i);
        const companyMatch = trimmed.match(/(?:at|,|\|)\s*([A-Za-z\s&.,]+?)(?:\n|$)/i);
        const dateMatch = trimmed.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}\s*-\s*\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
        
        if (positionMatch || companyMatch) {
          data.experience!.push({
            position: positionMatch?.[1]?.trim() || "Position",
            company: companyMatch?.[1]?.trim() || "Company",
            description: trimmed.substring(0, 150),
            startDate: dateMatch?.[1] || "2020-01",
            endDate: "Present"
          });
        }
      }
    });
  }

  // Extract education
  const educationMatch = resumeText.match(
    /(?:education|academic\s+background)[\s\n]+([\s\S]{50,1000}?)(?=\n\n|experience|certification|skills|$)/i
  );
  if (educationMatch) {
    const eduText = educationMatch[1];
    const eduEntries = eduText.split(/\n(?=[A-Z])/);
    data.education = [];
    
    eduEntries.forEach((entry) => {
      const trimmed = entry.trim();
      if (trimmed.length > 10) {
        const degreeMatch = trimmed.match(/(Bachelor|Master|Associate|PhD|Diploma|Certificate|BSc|MSc|BA|BS|MA|MS)/i);
        const fieldMatch = trimmed.match(/(?:in|of)\s+([A-Za-z\s&]+?)(?:,|\n|$)/i);
        const schoolMatch = trimmed.match(/(?:\n|,|\|)\s*([A-Za-z\s&.,'-]+?)(?:\n|$)/i);
        const yearMatch = trimmed.match(/(\d{4})/);
        
        if (degreeMatch) {
          data.education!.push({
            degree: degreeMatch[1] || "Degree",
            field: fieldMatch?.[1]?.trim() || "Field of Study",
            school: schoolMatch?.[1]?.trim() || "Institution",
            graduationDate: yearMatch?.[1] || "2020"
          });
        }
      }
    });
  }

  // Extract certifications
  const certMatch = resumeText.match(
    /(?:certification|certifications|credentials)[\s\n]+([\s\S]{20,500}?)(?=\n\n|experience|education|skills|$)/i
  );
  if (certMatch) {
    const certText = certMatch[1];
    const certEntries = certText.split(/\n/).filter((line) => line.trim().length > 5);
    data.certifications = [];
    
    certEntries.forEach((entry) => {
      const trimmed = entry.trim();
      if (trimmed.length > 5) {
        const dateMatch = trimmed.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
        
        data.certifications!.push({
          name: trimmed.substring(0, 100),
          issuer: "Issuer",
          date: dateMatch?.[1] || "2020"
        });
      }
    });
  }

  return data;
};
