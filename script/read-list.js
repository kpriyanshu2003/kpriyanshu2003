import fs from "fs";
import path from "path";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY || "",
});
const databaseId = process.env.NOTION_DATABASE_ID || "";

const readmePath = "../README.md";

async function fetchDatabase() {
  try {
    const response = await notion.databases.query({ database_id: databaseId });
    return response.results;
  } catch (error) {
    console.error("Error fetching Notion database:", error);
    return [];
  }
}

function generateReadme(databaseEntries) {
  let readmeContent = ``;
  databaseEntries.forEach((entry) => {
    if (!entry.properties.Private.checkbox && !entry.properties[""].checkbox) {
      const title = entry.properties.Title.title[0].plain_text;
      const url = entry.properties.URL.url;
      readmeContent += `- [${title}](${url})\n`;
    }
  });

  return readmeContent;
}

function updateReadme(
  newContent,
  sectionStart = "### I'm Reading",
  sectionEnd = "# <!-- Social -->"
) {
  let existingContent = "";

  if (fs.existsSync(readmePath))
    existingContent = fs.readFileSync(readmePath, "utf-8");

  const sectionStartIndex = existingContent.indexOf(sectionStart);
  const sectionEndIndex = existingContent.indexOf(sectionEnd);

  if (sectionStartIndex !== -1 && sectionEndIndex !== -1) {
    const beforeSection = existingContent.slice(
      0,
      sectionStartIndex + sectionStart.length
    );
    const afterSection = existingContent.slice(sectionEndIndex);
    const updatedContent =
      beforeSection + "\n\n" + newContent + "\n" + afterSection;

    if (existingContent !== updatedContent) {
      fs.writeFileSync(readmePath, updatedContent, "utf-8");
      return true;
    } else return false;
  } else {
    console.error(
      `Section "${sectionStart}" or "${sectionEnd}" not found in README.md`
    );
    return false;
  }
}

(async () => {
  const databaseEntries = await fetchDatabase();

  const entryMessage =
    databaseEntries.length === 0
      ? "No entries found in the Notion database."
      : "Entries found in the Notion database.";
  const readmeContent =
    databaseEntries.length === 0
      ? "Nothing here yet!"
      : generateReadme(databaseEntries);

  const updated = updateReadme(readmeContent);
  const updateMessage = updated
    ? "README.md has been updated with new content from Notion!"
    : "No changes in content, README.md was not updated.";

  console.log(entryMessage);
  console.log(updateMessage);
  process.exit(updated ? 0 : 1);
})();
