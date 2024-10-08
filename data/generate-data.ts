import { promises as fs } from "node:fs"
import path from "node:path"

async function main() {
  const dirs = await fs.readdir("data/input")
  dirs.sort()
  const articles = await Promise.all(
    dirs.map(async (dir) => {
      const original = await fs.readFile(
        path.join("data", "input", dir, "original.txt"),
        { encoding: "utf8" },
      )
      const metadataRaw = await fs.readFile(
        path.join("data", "input", dir, "metadata.json"),
        { encoding: "utf-8" },
      )
      const metadata = JSON.parse(metadataRaw)
      return { name: metadata.name, paragraphs: original.trim().split("\n") }
    }),
  )
  const outputRaw = JSON.stringify(articles)
  await fs.writeFile(path.join("src", "articles-data.json"), outputRaw, {
    encoding: "utf-8",
  })
}

main()
