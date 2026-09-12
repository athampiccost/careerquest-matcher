import { readFile } from "node:fs/promises";

const cataloguePath = process.argv[2];

if (!cataloguePath) {
  throw new Error("Usage: node scripts/validate_job_catalogue.mjs <jobs.json path>");
}

const catalogue = JSON.parse(await readFile(cataloguePath, "utf8"));

if (!Array.isArray(catalogue) || catalogue.length === 0) {
  throw new Error("The job catalogue must be a non-empty JSON array.");
}

const validRecords = catalogue.filter(job =>
  Number.isInteger(job.id) &&
  typeof job.job_title === "string" && job.job_title.trim().length > 0 &&
  typeof job.job_description === "string" && job.job_description.trim().length > 0,
);
const approvedRecords = validRecords.filter(job => job.status === "APPROVED");
const uniqueIds = new Set(validRecords.map(job => job.id));

if (uniqueIds.size !== validRecords.length) {
  throw new Error("The valid job records contain duplicate job IDs.");
}

if (approvedRecords.length === 0) {
  throw new Error("The job catalogue does not contain any valid approved jobs for matching.");
}

console.log(JSON.stringify({
  totalRecords: catalogue.length,
  validRecords: validRecords.length,
  incompleteRecords: catalogue.length - validRecords.length,
  approvedRecords: approvedRecords.length,
  uniqueValidIds: uniqueIds.size,
}));
