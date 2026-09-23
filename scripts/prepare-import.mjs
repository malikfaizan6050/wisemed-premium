// Cleans a calling-list spreadsheet into a file the CRM importer can read.
//
//   node scripts/prepare-import.mjs "C:\path\to\list.xlsx"
//
// Writes <name>-ready.xlsx beside the original, plus <name>-rejected.xlsx for
// rows the importer would refuse, so nothing disappears silently. Reads the
// first worksheet only, which is all the importer reads.
//
// What it fixes, all of it observed in a real list:
//   - "-" and "#NAME?" used as empty, which would import as literal text
//   - "Dr Name" split into First/Last, credentials and titles removed
//   - two columns both called "Remarks"; a spreadsheet keys rows by header, so
//     the second silently overwrites the first
//   - several addresses sitting in the Website column and vice versa
//   - multiple email addresses crammed into one cell
//   - files over the importer's 2,000-row limit, split into parts
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import * as XLSX from "xlsx";
import {
    cleanImportCell, correctWebsiteAddress, disambiguateHeaders, firstEmailIn, splitFullName
} from "../src/lib/crmImport.ts";

// Every repair below comes from src/lib/crmImport.ts, which is the same code
// the upload screen runs. The screen now cleans a sheet on its own, so this
// script is only needed to split a file past the importer's row limit or to
// see the rejected rows before uploading.
const MAX_ROWS = 2000;
const source = process.argv[2];
if (!source) {
    console.error("Usage: node scripts/prepare-import.mjs <path to .xlsx or .csv>");
    process.exit(1);
}
const clean = cleanImportCell;

const workbook = XLSX.read(await readFile(source), { type: "buffer", cellDates: false });
const sheetName = workbook.SheetNames[0];
console.log(`Reading "${sheetName}" from ${basename(source)}`);
if (workbook.SheetNames.length > 1) {
    console.log(`  note: ${workbook.SheetNames.length - 1} further worksheet(s) ignored, as the importer reads only the first`);
}

// Read as rows of cells, so two columns sharing a header both survive. Reading
// as objects would let the later one overwrite the earlier.
const grid = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1, defval: "", raw: false, blankrows: false
});
if (grid.length < 2) {
    console.error("No data rows found.");
    process.exit(1);
}

const namedHeaders = disambiguateHeaders(grid[0].map((cell) => clean(cell)));
const headers = namedHeaders.map((header) => header.toLowerCase());
const at = (...names) => {
    for (const name of names) {
        const index = headers.indexOf(name);
        if (index !== -1) return index;
    }
    return -1;
};
// The first "Remarks" is the general note; a second one is the call remark.
const remarksColumns = headers
    .map((header, index) => (header === "remarks" || /^remarks \(\d+\)$/.test(header) ? index : -1))
    .filter((index) => index !== -1);

const column = {
    ser: at("ser", "sr", "s no", "#"),
    name: at("dr name", "doctor name", "name"),
    clinic: at("clinic name", "organization", "practice"),
    phone1: at("phone 1", "phone", "phone1"),
    phone2: at("phone 2", "phone2"),
    fax: at("fax"),
    email: at("email", "e-mail"),
    website: at("website"),
    address: at("address"),
    specialist: at("specialist", "specialty"),
    notes: remarksColumns[0] ?? -1,
    callStatus: at("call status"),
    authorization: at("authorization", "authorizatio n"),
    faxConfirmed: at("faxed number confirmed"),
    receptionist: at("receptionist name"),
    officeManager: at("office manager name"),
    callDate: at("date of call"),
    callTime: at("time of call"),
    willJoin: at("will doctor join?", "will doctor join"),
    callRemarks: remarksColumns.length > 1 ? remarksColumns[1] : at("call remarks"),
    transcripts: at("transcripts", "transcript"),
    followUp: at("follow up", "followup")
};
for (const [key, index] of Object.entries(column)) {
    if (index === -1) console.log(`  note: no column matched "${key}"`);
}
if (remarksColumns.length > 1) {
    console.log("  two \"Remarks\" columns found; the second is treated as Call Remarks");
}

const OUT_HEADERS = [
    "Ser", "First Name", "Last Name", "Organization", "Email", "Phone", "Phone 2", "Fax", "Website", "Address",
    "Specialty", "Call Status", "Date of Call", "Time of Call", "Receptionist Name", "Office Manager Name",
    "Authorization", "Faxed Number Confirmed", "Will Doctor Join?", "Notes", "Call Remarks", "Transcripts", "Follow Up"
];

const ready = [];
const rejected = [];
let swappedWebsite = 0;

for (const row of grid.slice(1)) {
    const cell = (index) => (index === -1 ? "" : clean(row[index]));
    const { firstName, lastName } = splitFullName(cell(column.name));

    const corrected = correctWebsiteAddress(cell(column.website), cell(column.address));
    if (corrected.swapped) swappedWebsite++;

    const record = {
        "Ser": cell(column.ser),
        "First Name": firstName,
        "Last Name": lastName,
        "Organization": cell(column.clinic),
        "Email": firstEmailIn(cell(column.email)),
        "Phone": cell(column.phone1),
        "Phone 2": cell(column.phone2),
        "Fax": cell(column.fax),
        "Website": corrected.website,
        "Address": corrected.address,
        "Specialty": cell(column.specialist),
        "Call Status": cell(column.callStatus),
        "Date of Call": cell(column.callDate),
        "Time of Call": cell(column.callTime),
        "Receptionist Name": cell(column.receptionist),
        "Office Manager Name": cell(column.officeManager),
        "Authorization": cell(column.authorization),
        "Faxed Number Confirmed": cell(column.faxConfirmed),
        "Will Doctor Join?": cell(column.willJoin),
        "Notes": cell(column.notes),
        "Call Remarks": cell(column.callRemarks),
        "Transcripts": cell(column.transcripts),
        "Follow Up": cell(column.followUp)
    };

    if (Object.values(record).every((value) => !value)) continue;

    const reasons = [];
    if (!record["First Name"] && !record["Last Name"] && !record.Organization) {
        reasons.push("no provider name and no organization");
    }
    if (!record.Email && !record.Phone) reasons.push("no email and no phone");

    if (reasons.length) rejected.push({ ...record, "Why rejected": reasons.join("; ") });
    else ready.push(record);
}

const target = join(dirname(source), basename(source, extname(source)));
const write = async (rows, path, headerRow) => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows, { header: headerRow }), "Leads");
    await writeFile(path, XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
};

const parts = [];
for (let index = 0; index < ready.length; index += MAX_ROWS) parts.push(ready.slice(index, index + MAX_ROWS));
for (const [index, part] of parts.entries()) {
    const suffix = parts.length > 1 ? `-part${index + 1}` : "";
    const path = `${target}-ready${suffix}.xlsx`;
    await write(part, path, OUT_HEADERS);
    console.log(`\nWrote ${part.length} row(s): ${basename(path)}`);
}
if (rejected.length) {
    const path = `${target}-rejected.xlsx`;
    await write(rejected, path, [...OUT_HEADERS, "Why rejected"]);
    console.log(`Wrote ${rejected.length} rejected row(s): ${basename(path)}`);
}

const named = ready.filter((record) => record["First Name"] || record["Last Name"]).length;
console.log(`\nTotal data rows      : ${ready.length + rejected.length}`);
console.log(`Ready to import      : ${ready.length}`);
console.log(`Rejected             : ${rejected.length}`);
if (swappedWebsite) console.log(`Website/Address swapped back on ${swappedWebsite} row(s)`);
console.log(`With a provider name : ${named}`);
console.log(`Organization only    : ${ready.length - named}`);
console.log("\nImport the -ready file at /admin/import-leads.");
console.log("Choose \"Import anyway\" for duplicates: doctors at one clinic share a phone number.");
