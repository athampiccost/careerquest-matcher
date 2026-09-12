# iPhone Resume Upload Troubleshooting

## Why an iPhone Upload May Fail

CareerQuest first attempts to extract selectable text from the PDF in the browser. On iPhone, especially inside in-app browsers such as WhatsApp, the browser may limit file access or prevent the PDF text-processing worker from running. This can cause a text-based PDF to display a parsing error even though the same document opens correctly in a desktop browser.

The application includes a transient server-side parsing fallback. However, an in-app browser can still block file reading before the file reaches that fallback. This behavior is controlled by the browser container, not by permanent storage in CareerQuest.

## Reliable Recovery Steps

| Situation | Recommended action |
|---|---|
| The PDF upload works | Continue with the normal **Upload resume PDF** flow. |
| The PDF shows a parsing error | Use a searchable, text-based PDF and retry the **Upload resume PDF** flow. |
| File selection is blocked in WhatsApp | Open the CareerQuest link in **Safari** using the browser menu, then try the PDF upload again. |
| The PDF is scanned or image-only | Export the résumé as a searchable/text-based PDF before uploading. |

CareerQuest accepts PDF résumés only. The server-side compatibility parser remains transient and does not save uploaded files in the CareerQuest database or file storage.
