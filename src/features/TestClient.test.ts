import seedrandom from "seedrandom"
import {
  generateGameSessionDataFromParagraphs,
  generateRandomSeedString,
  getRandomInt,
  shuffleArray,
} from "./SessionGen"

import { TestClient } from "./TestClient"

test("test generated game session solvable simple", () => {
  for (let randSrc = 0; randSrc < 10000; randSrc++) {
    let s = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let data = generateGameSessionDataFromParagraphs([s], randSrc.toString())
    let rng = seedrandom(randSrc.toString())
    let tc = new TestClient(data, [s.split("")], rng)
    tc.solve()
  }
})
