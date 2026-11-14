import type { Metadata } from "next";
import manifest from "@/generated/source-manifest.json";

export const metadata: Metadata = {
  title: "Ankit Traders — source code (no ZIP)",
  description:
    "Browse and download every project file individually, or copy full source from the single-file bundle. Includes the A5 print and HD A5 PDF/JPG fixes.",
};

export const dynamic = "force-dynamic";

const files = Object.keys((manifest as { files: Record<string, string> }).files).sort();

const groups = files.reduce<Record<string, string[]>>((acc, file) => {
  const top = file.includes("/") ? file.split("/")[0] : "root files";
  acc[top] = acc[top] ? [...acc[top], file] : [file];
  return acc;
}, {});

export default function SourcePage() {
  const groupNames = Object.keys(groups).sort((a, b) => (a === "root files" ? -1 : b === "root files" ? 1 : a.localeCompare(b)));

  return (
    <main className="download-page">
      <section className="download-hero">
        <p className="topbar-eyebrow">Ankit Traders · source code access</p>
        <h1>No ZIP — get every file directly</h1>
        <p>
          If the ZIP download is blocked on your device, use these: <b>download each file
          individually</b> (plain text, no archive), or open the <b>source bundle</b> — a single
          HTML page that shows all {files.length} files with Copy / Download buttons. Both include
          the <b>A5 print</b> and <b>HD A5 PDF/JPG</b> fixes.
        </p>
        <div className="download-actions">
          <a className="primary-button download-cta" href="/ankit-traders-source-bundle.html" target="_blank" rel="noreferrer">
            Open source bundle (single HTML)
          </a>
          <a className="secondary-button" href="/ankit-traders-source-code.txt" download>
            Download all code as .txt
          </a>
          <a className="secondary-button" href="/api/source" target="_blank" rel="noreferrer">
            File list (JSON)
          </a>
        </div>
        <p className="download-hint">
          GitHub: create a repo → <b>Add file → Create new file</b> → paste the path shown below →
          paste the content. Full steps in <b>GITHUB-PUSH.md</b> (included in the bundle).
        </p>
      </section>

      <section className="panel-card download-card">
        <h2>All {files.length} files</h2>
        <div className="source-groups">
          {groupNames.map((group) => (
            <div key={group}>
              <h3>{group}</h3>
              <ul>
                {groups[group].map((file) => (
                  <li key={file}>
                    <code>{file}</code>
                    <span>
                      <a
                        className="view-link"
                        href={`/api/source/file?path=${encodeURIComponent(file)}&inline=1`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                      <a className="view-link" href={`/api/source/file?path=${encodeURIComponent(file)}`}>
                        Download
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
