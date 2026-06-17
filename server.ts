import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { XMLParser } from "fast-xml-parser";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch and parse BigQuery Release notes XML
  app.get("/api/release-notes", async (req, res) => {
    try {
      const feedUrl = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml";
      console.log(`Fetching feed from: ${feedUrl}`);
      
      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/xml, text/xml, */*"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch BigQuery feed. Status: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true
      });

      const parsedData = parser.parse(xmlText);
      
      if (!parsedData || !parsedData.feed) {
        throw new Error("Invalid or empty XML feed structured received from Google Cloud.");
      }

      const feed = parsedData.feed;
      const feedTitle = typeof feed.title === "object" ? (feed.title["#text"] || feed.title["text"] || "BigQuery Release Notes") : (feed.title || "BigQuery Release Notes");
      const feedUpdated = feed.updated || "";

      let rawEntries = feed.entry || [];
      if (!Array.isArray(rawEntries)) {
        rawEntries = [rawEntries];
      }

      const parsedEntries = rawEntries.map((entry: any) => {
        // Safe title extraction
        let title = "BigQuery Update";
        if (entry.title) {
          if (typeof entry.title === "object") {
            title = entry.title["#text"] || entry.title["text"] || entry.title["@_type"] || "BigQuery Update";
          } else {
            title = entry.title;
          }
        }

        // Safe ID extraction
        const id = entry.id || String(Math.random());

        // Date / Updated extraction
        const updated = entry.updated || entry.published || "";

        // Raw HTML Content / Summary extraction
        let content = "";
        if (entry.content) {
          if (typeof entry.content === "object") {
            content = entry.content["#text"] || entry.content["text"] || "";
          } else {
            content = entry.content;
          }
        } else if (entry.summary) {
          if (typeof entry.summary === "object") {
            content = entry.summary["#text"] || entry.summary["text"] || "";
          } else {
            content = entry.summary;
          }
        }

        // Extract Link
        let link = "https://cloud.google.com/bigquery/docs/release-notes";
        if (entry.link) {
          if (Array.isArray(entry.link)) {
            const alternate = entry.link.find((l: any) => l["@_rel"] === "alternate" || l["@_rel"] === "self");
            if (alternate) {
              link = alternate["@_href"];
            } else if (entry.link[0]) {
              link = entry.link[0]["@_href"] || link;
            }
          } else if (typeof entry.link === "object") {
            link = entry.link["@_href"] || link;
          }
        }

        // Determine Category badge based on keywords or tags within the content html
        let category: "feature" | "changed" | "fixed" | "deprecated" | "announcement" = "announcement";
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes("<strong>feature</strong>") || contentLower.includes("feature:") || contentLower.includes("new feature")) {
          category = "feature";
        } else if (contentLower.includes("<strong>deprecation</strong>") || contentLower.includes("deprecated") || contentLower.includes("deprecation notice")) {
          category = "deprecated";
        } else if (contentLower.includes("<strong>fix</strong>") || contentLower.includes("resolved") || contentLower.includes("bug fix") || contentLower.includes("fixed:")) {
          category = "fixed";
        } else if (contentLower.includes("<strong>change</strong>") || contentLower.includes("changed:") || contentLower.includes("breaking change") || contentLower.includes("update:")) {
          category = "changed";
        } else {
          // Additional fallback detection
          if (contentLower.includes("feature")) {
            category = "feature";
          } else if (contentLower.includes("fix")) {
            category = "fixed";
          } else if (contentLower.includes("change") || contentLower.includes("update")) {
            category = "changed";
          }
        }

        return {
          id,
          title,
          updated,
          content,
          link,
          category
        };
      });

      return res.json({
        success: true,
        feedTitle,
        feedUpdated,
        entries: parsedEntries
      });

    } catch (err: any) {
      console.error("Error fetching release notes:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to fetch and parse BigQuery release notes"
      });
    }
  });

  // Handle client-side routing & Dev asset bundler configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
