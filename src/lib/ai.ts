import { OpenAI } from "openai"

const AI_MODEL = process.env.AI_MODEL || "google/gemma-4-31b-it:free"
const AI_MODEL_FALLBACK = (process.env.AI_MODEL_FALLBACK || "nvidia/nemotron-3.5-lightning:free,google/gemma-4-26b-a4b-it:free")
  .split(",").map(s => s.trim()).filter(Boolean)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Prefer OpenRouter (free-tier Gemma), fall back to OpenAI
const aiClient = OPENROUTER_API_KEY && !OPENROUTER_API_KEY.startsWith("sk-or-your")
  ? new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "InboxAI",
      },
    })
  : OPENAI_API_KEY && !OPENAI_API_KEY.startsWith("sk-your")
    ? new OpenAI({ apiKey: OPENAI_API_KEY })
    : null

async function chat(
  messages: any[],
  opts: { json?: boolean; temperature?: number; model?: string } = {}
): Promise<string> {
  if (!aiClient) throw new Error("No AI client configured")
  const models = [opts.model || AI_MODEL, ...(Array.isArray(AI_MODEL_FALLBACK) ? AI_MODEL_FALLBACK : [AI_MODEL_FALLBACK])].filter(Boolean) as string[]
  let lastErr: any
  for (const m of Array.from(new Set(models))) {
    try {
      const params: any = {
        model: m,
        temperature: opts.temperature ?? 0.3,
        messages,
      }
      if (opts.json) params.response_format = { type: "json_object" }
      const resp = await aiClient.chat.completions.create(params)
      return resp.choices[0].message.content || ""
    } catch (e: any) {
      lastErr = e
      console.warn(`[ai] model ${m} failed (${e?.status || e?.message}), trying fallback...`)
    }
  }
  throw lastErr || new Error("All models failed")
}

export type EmailAnalysis = {
  category:
    | "JOB_RECRUITMENT"
    | "PERSONAL"
    | "WORK"
    | "PROMOTIONS"
    | "SPAM"
    | "NEWSLETTER"
    | "IMPORTANT"
    | "FOLLOW_UP"
    | "REJECTION"
    | "OFFER"
    | "INTERVIEW_REQUEST"
    | "OTHER"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  summary: string
  suggestedReply: string
  tone: "professional" | "friendly" | "formal" | "casual"
  keyPoints: string[]
  needsReply: boolean
}

const SYSTEM_PROMPT = `You are an expert email assistant for a job seeker and busy professional. Analyze the given email and return ONLY a valid JSON object (no markdown, no commentary, no code fences).

The JSON must contain exactly these fields:
- category: one of JOB_RECRUITMENT, PERSONAL, WORK, PROMOTIONS, SPAM, NEWSLETTER, IMPORTANT, FOLLOW_UP, REJECTION, OFFER, INTERVIEW_REQUEST, OTHER
- priority: one of LOW, NORMAL, HIGH, URGENT
- summary: a 1-3 sentence summary of the email
- suggestedReply: a complete, well-written reply in the same language as the email. If no reply is needed, use an empty string.
- tone: one of professional, friendly, formal, casual
- keyPoints: array of 2-5 short bullet points capturing the essence
- needsReply: boolean, whether the email genuinely needs a response

Rules:
- Recruiter emails about job opportunities → JOB_RECRUITMENT
- Interview invitations → INTERVIEW_REQUEST (high priority)
- Rejection letters → REJECTION
- Offers → OFFER (urgent)
- Respond in the language the email is written in.
- Be concise but warm and human.
- Never invent facts not in the email.
- If this is a recruiter outreach, reply should express interest, highlight fit briefly, and propose next steps.
- Output STRICT JSON only — no \`\`\`json fences, no commentary before/after.`

export async function analyzeEmail(
  subject: string,
  from: string,
  bodyText: string
): Promise<EmailAnalysis> {
  if (!aiClient) return heuristicAnalyze(subject, from, bodyText)

  const userContent = `From: ${from}\nSubject: ${subject}\n\n${bodyText.slice(0, 4000)}`

  try {
    const raw = await chat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      { json: true, temperature: 0.3 }
    )
    const cleaned = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")
    // Extract first { ... } block (in case model added surrounding text)
    const firstBrace = cleaned.indexOf("{")
    const lastBrace = cleaned.lastIndexOf("}")
    const jsonStr = firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned
    return JSON.parse(jsonStr) as EmailAnalysis
  } catch (e) {
    console.warn("[ai] analyzeEmail failed, using heuristic:", (e as Error).message)
    return heuristicAnalyze(subject, from, bodyText)
  }
}

function heuristicAnalyze(subject: string, from: string, body: string): EmailAnalysis {
  const text = `${subject} ${body}`.toLowerCase()
  let category: EmailAnalysis["category"] = "OTHER"
  let priority: EmailAnalysis["priority"] = "NORMAL"

  if (/interview|entretien/i.test(text)) { category = "INTERVIEW_REQUEST"; priority = "HIGH" }
  else if (/offer|proposition d'emploi|job offer/i.test(text)) { category = "OFFER"; priority = "URGENT" }
  else if (/reject|declined|malheureusement|not moving forward/i.test(text)) { category = "REJECTION" }
  else if (/recruit|hiring|position|role|opportunity|candidat|emploi|offre/i.test(text)) { category = "JOB_RECRUITMENT"; priority = "HIGH" }
  else if (/unsubscribe|newsletter|promotion|sale|discount/i.test(text)) { category = "NEWSLETTER" as any; priority = "LOW" }
  else if (/follow[ -]?up|relance/i.test(text)) { category = "FOLLOW_UP"; priority = "HIGH" }
  else if (/spam|unwanted/i.test(text)) { category = "SPAM" as any }

  const summary = subject ? `Email about: ${subject}` : "New email received."
  const suggestedReply = (category === "JOB_RECRUITMENT" || category === "INTERVIEW_REQUEST")
    ? `Hi,\n\nThank you for reaching out regarding this opportunity. I am very interested and would be happy to discuss further. Please let me know what times work best for a quick call.\n\nBest regards`
    : ""

  return {
    category,
    priority,
    summary,
    suggestedReply,
    tone: "professional",
    keyPoints: [subject || "New message"],
    needsReply: (category as string) !== "NEWSLETTER" && (category as string) !== "SPAM" && (category as string) !== "PROMOTIONS",
  }
}

export type CoverLetterInput = {
  company: string
  position: string
  recruiterName?: string
  jobDescription?: string
  candidateName: string
  cvSummary?: string
}

export async function generateCoverLetter(input: CoverLetterInput): Promise<string> {
  const { company, position, recruiterName, jobDescription, candidateName, cvSummary } = input

  if (!aiClient) return defaultCoverLetter(input)

  try {
    const content = await chat(
      [
        {
          role: "system",
          content:
            "You write compelling, concise, human-sounding cover letters in plain text (no markdown, no JSON). Keep to ~3 short paragraphs, ~200-300 words total. Match language to the job posting (default to English). Do not use clichés. Start with a proper greeting. End with a sign-off including the candidate's name.",
        },
        {
          role: "user",
          content: `Candidate name: ${candidateName}\nCompany: ${company}\nPosition: ${position}\nRecruiter: ${recruiterName || "Hiring Manager"}\n${jobDescription ? `Job description:\n${jobDescription.slice(0, 2000)}` : ""}\n${cvSummary ? `Candidate CV highlights:\n${cvSummary.slice(0, 1500)}` : ""}`,
        },
      ],
      { temperature: 0.7 }
    )
    return (content || defaultCoverLetter(input)).trim()
  } catch (e) {
    console.warn("[ai] generateCoverLetter failed:", (e as Error).message)
    return defaultCoverLetter(input)
  }
}

function defaultCoverLetter({ company, position, recruiterName, candidateName }: CoverLetterInput): string {
  const greeting = recruiterName ? `Dear ${recruiterName},` : "Dear Hiring Manager,"
  return `${greeting}

I am writing to express my strong interest in the ${position} role at ${company}. With my background and passion for building great products, I am confident I would be a strong addition to your team.

Throughout my career I have developed a blend of technical skills and problem-solving abilities that align well with this position. I thrive in fast-paced environments, collaborate effectively across functions, and take pride in delivering high-quality work on time.

I have attached my CV for your consideration and would welcome the opportunity to discuss how my experience can contribute to ${company}'s continued success. Thank you for your time and consideration — I look forward to hearing from you.

Best regards,
${candidateName}`
}

export async function generateReply(
  emailSubject: string,
  emailFrom: string,
  emailBody: string,
  tone: "professional" | "friendly" | "formal" | "casual" = "professional",
  extraInstructions?: string
): Promise<string> {
  if (!aiClient) {
    return `Hi,\n\nThank you for your message. I'll get back to you shortly.\n\nBest regards`
  }
  try {
    const content = await chat(
      [
        {
          role: "system",
          content: `Write a ${tone} email reply. Keep it concise, natural, and human. Use plain text. Sign off appropriately. Respond in the same language as the original email. Do not include subject lines.`,
        },
        {
          role: "user",
          content: `Original email from ${emailFrom}:\nSubject: ${emailSubject}\n\n${emailBody.slice(0, 3000)}\n\n${extraInstructions ? `Instructions: ${extraInstructions}` : ""}`,
        },
      ],
      { temperature: 0.6 }
    )
    return (content || "").trim()
  } catch (e) {
    console.warn("[ai] generateReply failed:", (e as Error).message)
    return `Hi,\n\nThank you for your message. I'll get back to you shortly.\n\nBest regards`
  }
}

export async function rewriteText(text: string, action: "polish" | "shorten" | "formal" | "friendly" = "polish"): Promise<string> {
  if (!aiClient) return text.trim()

  const instructions: Record<string, string> = {
    polish: "Polish the following email text to be clear, professional, concise, and warm. Fix grammar. Keep the original meaning and language:",
    shorten: "Make this email shorter and more direct while keeping the tone and meaning. Keep the same language:",
    formal: "Rewrite this email to be more formal and professional. Keep same language:",
    friendly: "Rewrite this email to be more friendly and casual but still professional. Keep same language:",
  }
  try {
    const content = await chat(
      [
        { role: "system", content: instructions[action] + " Return only the rewritten text, no explanation, no quotes, no subject line." },
        { role: "user", content: text },
      ],
      { temperature: 0.5 }
    )
    return (content || text).trim()
  } catch (e) {
    console.warn("[ai] rewriteText failed:", (e as Error).message)
    return text.trim()
  }
}
