# CareerQuest Data Handling Notice

**Last updated:** 5 September 2026  
**Scope:** This document describes the data flow implemented in the current CareerQuest codebase. It is technical product documentation, not a legal privacy policy.

## Summary

CareerQuest is designed to analyze a resume without creating a permanent resume record in its own database or file storage. The résumé PDF is normally read in the browser, and the extracted text is sent to the server only to calculate job matches. If a browser or in-app web view cannot extract the text—such as on some iPhone configurations—the same PDF is sent transiently to a compatibility parser on the CareerQuest server. The server-managed jobs catalogue is retained as application source data. Analysis results are kept in the active browser session and are lost on a refresh or when the page is closed.

The optional **Generate AI insight** action has a separate external-processing step. The implementation sends a summary of detected resume skills, the highest-ranked job matches, and identified skill gaps to OpenAI's Responses API. It does not send the uploaded PDF file or the complete raw résumé text to OpenAI.

## Data Flow and Storage

| Data category | How it is used | CareerQuest storage behavior | External processing |
|---|---|---|---|
| Resume PDF | Selected by the user to begin an analysis. | The PDF is normally parsed in the browser. If browser extraction fails, it is sent only for a transient server-side compatibility parse; it is never written to CareerQuest file storage or the database. | None by the PDF-upload workflow. |
| Extracted résumé text | Used by the server to identify skills and calculate job matches. | Processed transiently in the server request; no résumé database table, S3 upload, or analysis-history record is created. | None unless the user separately requests an AI insight. |
| Match scores and skill gaps | Displayed in the matching dashboard. | Held in React browser memory for the active page session only; the current implementation does not save results to the database. | Included in an AI insight request only when the user activates that feature. |
| Job catalogue | Supplies the roles and requirements used for matching. | Retained as the server-side `server/data/jobs.json` application catalogue. | Not automatically sent anywhere else. |
| AI insight input | A derived list of detected skills, selected role matches, and aggregated skill gaps. | Not stored by CareerQuest after the request completes. | Sent to OpenAI only after the user clicks **Generate AI insight**. |
| OpenAI API key | Authenticates the optional AI request. | Kept server-side in an environment variable; it must not be included in client-side code, source control, or shared archives. | Used only to authenticate with OpenAI. |

## What Is and Is Not Permanently Stored

CareerQuest **does retain** the job catalogue because it is part of the backend application data. It **does not retain** an uploaded résumé PDF, extracted résumé text, uploaded file bytes, match result history, or a per-user skills profile in its own database or storage service. The iPhone compatibility parser handles a PDF in request memory only and does not create a file-storage record.

The optional **paste resume text** fallback follows the same transient matching flow. Pasted text is sent to the matching request, displayed only as the active-session analysis result, and is not written to the CareerQuest database or file storage.

## Embedded Learning Tutorials

When an AI career insight is generated, CareerQuest can show a small set of curated YouTube learning playlists that correspond to the resulting skill priorities and certification path. The embed URLs contain only a public playlist identifier; they do not include resume text, match scores, personal identifiers, or the OpenAI API key. Loading or playing an embedded tutorial connects the candidate’s browser directly to YouTube and is subject to YouTube’s applicable policies and browser settings.[2]

> Refreshing the dashboard, opening a new browser session, or closing the page clears the in-browser analysis state. A user must upload the résumé again to recreate the dashboard results.

## Optional AI Insight Processing

The AI feature is opt-in at the interaction level: no AI request is created until the user clicks **Generate AI insight**. For that request, the application sends a derived career-analysis summary rather than the PDF itself. This includes detected skills, the leading job matches, and skill gaps so that the model can suggest learning priorities, résumé refinements, and a focused application plan.

The current implementation calls OpenAI's `/v1/responses` endpoint. OpenAI states that the Responses API may retain application state for 30 days by default when `store` is omitted or set to `true`; abuse-monitoring logs may also be retained for up to 30 days under OpenAI's documented controls.[1]

This means that CareerQuest does **not** permanently store résumé data in its own infrastructure, but derived AI-insight inputs are subject to the data-handling terms and retention controls of the OpenAI account whose API key is used. Administrators who need stricter controls should configure the appropriate OpenAI data controls and update the request to explicitly set `store: false`; this change does not itself override abuse-monitoring retention.[1]

## Administrator Responsibilities

The application owner should obtain an appropriate legal basis and user consent before enabling AI insight processing for other people. The owner should also protect the OpenAI API key, avoid placing it in browser code, and update this notice if the application later adds cloud file uploads, database-backed analysis history, user profiles, or third-party integrations.

## References

[1] [OpenAI, “Data controls in the OpenAI platform”](https://developers.openai.com/api/docs/guides/your-data)

[2] [YouTube Help, “Embed videos & playlists”](https://support.google.com/youtube/answer/171780?hl=en)
