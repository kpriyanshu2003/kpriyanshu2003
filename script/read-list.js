import fs from "fs";
import { Client } from "@notionhq/client";

const readmePath = "../README.md";
const databaseId = process.env.NOTION_DATABASE_ID || "";
const notion = new Client({ auth: process.env.NOTION_API_KEY || "" });

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
  let outerBlogs = ``;
  let innerBlogs = ``;

  databaseEntries.forEach((entry) => {
    if (!entry.properties.Private.checkbox && !entry.properties[""].checkbox) {
      const title = entry.properties.Title.title[0].plain_text;
      const url = entry.properties.URL.url;

      const blogEntry = `- [${title}](${url})${
        entry.properties.Paywall.checkbox ? "🔒" : ""
      }\n`;
      if (entry.properties.Priority.checkbox) outerBlogs += blogEntry;
      else innerBlogs += blogEntry;
    }
  });

  // return `${outerBlogs}\n\n#### Other Blogs\n${innerBlogs}`;
  return `${outerBlogs}<details><summary>\n<h4>More to read</h4></summary>\n\n${innerBlogs}</details>\n`;
}

function updateReadme(
  newContent,
  sectionStart = "### I'm Reading",
  sectionEnd = "<!-- Social -->"
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
})();
