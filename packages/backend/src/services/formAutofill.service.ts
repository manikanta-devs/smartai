/**
 * Form Autofill Service - Detect and populate job application forms
 * Handles LinkedIn, Indeed, Lever, Greenhouse, custom forms
 */

export interface FormField {
  name: string;
  id?: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "radio" | "file" | "hidden";
  label?: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  value?: string;
}

export interface DetectedForm {
  platform: "linkedin" | "indeed" | "lever" | "greenhouse" | "custom";
  url: string;
  fields: FormField[];
  submitButton?: { selector: string; text: string };
}

export interface AutofillData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    position: string;
    description: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
  }>;
}

/**
 * Detect form fields in job application
 */
export function detectFormFields(htmlContent: string): FormField[] {
  const fields: FormField[] = [];

  // Parse all form inputs
  const inputRegex = /<input[^>]*>/gi;
  const matches = htmlContent.matchAll(inputRegex);

  for (const match of matches) {
    const tag = match[0];
    const type =
      (tag.match(/type=["']([^"']+)["']/i)?.[1] || "text").toLowerCase();

    if (["hidden", "submit", "button"].includes(type)) continue;

    const name = tag.match(/name=["']([^"']+)["']/i)?.[1] || "";
    const id = tag.match(/id=["']([^"']+)["']/i)?.[1];
    const placeholder = tag.match(/placeholder=["']([^"']+)["']/i)?.[1];
    const required = tag.includes("required");

    fields.push({
      name,
      id,
      type: (type as any) || "text",
      required,
      placeholder
    });
  }

  // Parse textareas
  const textareaRegex = /<textarea[^>]*name=["']([^"']+)["'][^>]*>/gi;
  const textareaMatches = htmlContent.matchAll(textareaRegex);
  for (const match of textareaMatches) {
    fields.push({
      name: match[1],
      type: "textarea",
      required: htmlContent.includes(`required`) && htmlContent.includes(match[0])
    });
  }

  // Parse selects
  const selectRegex = /<select[^>]*name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
  const selectMatches = htmlContent.matchAll(selectRegex);
  for (const match of selectMatches) {
    const options = (match[2].match(/<option[^>]*>([^<]+)<\/option>/g) || []).map(
      (opt) => opt.replace(/<[^>]*>/g, "").trim()
    );

    fields.push({
      name: match[1],
      type: "select",
      required: htmlContent.includes(`required`) && htmlContent.includes(match[0]),
      options
    });
  }

  return fields;
}

/**
 * FIXED: Map resume data to form fields intelligently
 */
export function mapDataToFields(
  data: AutofillData,
  fields: FormField[]
): Map<string, string | string[]> {
  const mapping = new Map<string, string | string[]>();

  fields.forEach((field) => {
    const fieldNameLower = field.name.toLowerCase();

    // Name fields
    if (fieldNameLower.includes("first") || fieldNameLower === "fname") {
      const firstName = data.name?.split(" ")[0] || "";
      if (firstName) mapping.set(field.name, firstName);
    } else if (fieldNameLower.includes("last") || fieldNameLower === "lname") {
      const lastName = data.name?.split(" ").slice(1).join(" ") || "";
      if (lastName) mapping.set(field.name, lastName);
    } else if (fieldNameLower.includes("name")) {
      if (data.name) mapping.set(field.name, data.name);
    }
    
    // Email
    else if (fieldNameLower.includes("email")) {
      if (data.email) mapping.set(field.name, data.email);
    }
    
    // Phone
    else if (fieldNameLower.includes("phone") || fieldNameLower.includes("mobile") || fieldNameLower.includes("tel")) {
      if (data.phone) mapping.set(field.name, data.phone);
    }
    
    // Location
    else if (fieldNameLower.includes("location") || fieldNameLower.includes("city") || fieldNameLower.includes("address")) {
      if (data.location) mapping.set(field.name, data.location);
    }
    
    // Skills
    else if (fieldNameLower.includes("skill")) {
      if (data.skills && data.skills.length > 0) {
        mapping.set(field.name, data.skills.slice(0, 10).join(", "));
      }
    }
    
    // Summary/about
    else if (fieldNameLower.includes("summary") || fieldNameLower.includes("about") || fieldNameLower.includes("bio")) {
      if (data.summary) mapping.set(field.name, data.summary);
    }
    
    // Experience
    else if (fieldNameLower.includes("experience") || fieldNameLower.includes("work")) {
      if (data.experience && data.experience.length > 0) {
        const exp = data.experience[0];
        const text = `${exp.position} at ${exp.company}: ${exp.description}`;
        mapping.set(field.name, text);
      }
    }
    
    // Education
    else if (fieldNameLower.includes("education") || fieldNameLower.includes("school") || fieldNameLower.includes("university")) {
      if (data.education && data.education.length > 0) {
        const edu = data.education[0];
        const text = `${edu.degree} in ${edu.field} from ${edu.school}`;
        mapping.set(field.name, text);
      }
    }
  });

  return mapping;
}

/**
 * Generate autofill script for JavaScript-based form filling
 */
export function generateAutofillScript(
  mapping: Map<string, string | string[]>,
  fields: FormField[]
): string {
  const fieldValues: Record<string, string | string[]> = {};

  mapping.forEach((value, key) => {
    fieldValues[key] = value;
  });

  return `
(function() {
  const fieldValues = ${JSON.stringify(fieldValues, null, 2)};
  
  // Fill form fields
  Object.entries(fieldValues).forEach(([fieldName, value]) => {
    // Try multiple selectors
    const selectors = [
      \`input[name="\${fieldName}"]\`,
      \`textarea[name="\${fieldName}"]\`,
      \`select[name="\${fieldName}"]\`,
      \`#\${fieldName}\`,
      \`[data-field-name="\${fieldName}"]\`
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = value === 'true';
        } else if (element.tagName === 'SELECT') {
          element.value = String(value);
        } else {
          element.value = Array.isArray(value) ? value.join(', ') : String(value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  
  console.log('✓ Form autofill complete');
})();
`;
}

/**
 * Detect job board platform from URL
 */
export function detectPlatform(
  url: string
): "linkedin" | "indeed" | "lever" | "greenhouse" | "custom" {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("linkedin.com")) return "linkedin";
  if (urlLower.includes("indeed.com")) return "indeed";
  if (urlLower.includes("jobs.lever.co") || urlLower.includes("lever.co")) return "lever";
  if (
    urlLower.includes("greenhouse.io") ||
    urlLower.includes("boards.greenhouse.io")
  )
    return "greenhouse";

  return "custom";
}

/**
 * Generate CSS selectors for common patterns
 */
export function generateSelectors(platform: string): string[] {
  const commonSelectors: Record<string, string[]> = {
    linkedin: [
      "form[id*='application']",
      "[data-component-id*='form']",
      ".form-component",
      ".application-form"
    ],
    indeed: [
      "form[id*='applyForm']",
      "[data-testid*='form']",
      ".jobsearch-apply-form"
    ],
    lever: [
      "form.application-form",
      "[data-component='applicationForm']"
    ],
    greenhouse: [
      "form[action*='greenhouse']",
      "[data-component-type='application_form']"
    ],
    custom: [
      "form[role='form']",
      "form[class*='application']",
      "form[class*='apply']",
      "[role='form']"
    ]
  };

  return commonSelectors[platform] || commonSelectors.custom;
}

/**
 * Build complete autofill package
 */
export function buildAutofillPackage(
  data: AutofillData,
  htmlContent: string,
  url: string
): {
  platform: "linkedin" | "indeed" | "lever" | "greenhouse" | "custom";
  fields: FormField[];
  mapping: Record<string, string | string[]>;
  script: string;
  coverage: { filled: number; total: number; percentage: number };
} {
  const platform = detectPlatform(url);
  const fields = detectFormFields(htmlContent);
  const mapping = mapDataToFields(data, fields);

  const filledCount = mapping.size;
  const totalCount = fields.filter((f) => f.required).length;
  const percentage =
    totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  const mappingObj: Record<string, string | string[]> = {};
  mapping.forEach((value, key) => {
    mappingObj[key] = value;
  });

  return {
    platform,
    fields,
    mapping: mappingObj,
    script: generateAutofillScript(mapping, fields),
    coverage: {
      filled: filledCount,
      total: totalCount,
      percentage
    }
  };
}

/**
 * Validate autofill readiness
 */
export function validateAutofillReadiness(
  data: AutofillData,
  requiredFields: string[]
): {
  isReady: boolean;
  missingFields: string[];
  readinessScore: number;
} {
  const missingFields: string[] = [];

  // Check required fields
  if (!data.name) missingFields.push("name");
  if (!data.email) missingFields.push("email");
  if (!data.phone) missingFields.push("phone");
  if (!data.headline) missingFields.push("headline");

  // Check against specific requirements
  requiredFields.forEach((field) => {
    if (!data[field as keyof AutofillData]) {
      missingFields.push(field);
    }
  });

  const readinessScore = Math.round(
    ((Object.keys(data).length - missingFields.length) / Object.keys(data).length) * 100
  );

  return {
    isReady: missingFields.length === 0,
    missingFields,
    readinessScore
  };
}
