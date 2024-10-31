import { GameSessionData } from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_types_pb"
import * as config from "./Config"
import { PQValuer, PriorityQueue } from "./PriorityQueue"
import seedrandom from "seedrandom"

export function getRandomInt(min: number, max: number, rng: () => number) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(rng() * (maxFloored - minCeiled) + minCeiled) // The maximum is exclusive and the minimum is inclusive
}

export function shuffleArray<T>(array: T[], rng: () => number) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(rng() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

export function generateRandomSeedString(): string {
  return Math.random().toString(36).substring(2, 7)
}

class GameSessionGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GameSessionGenerationError"
  }
}

// ported from https://gitlab.com/hkdse-practice/chinese/backend/core/-/blob/92e44e535dd02fb607aef3b4f15551a02909f00e/pkg/gamesession/sessiongen.go
export function generateGameSessionDataFromParagraphs(
  paragraphs: string[],
  randomSeed: string,
): GameSessionData.AsObject {
  const rng = seedrandom(randomSeed)
  const data: GameSessionData.AsObject = {
    paragraphsList: [],
  }
  for (const pText of paragraphs) {
    const pWords = pText.split("")
    if (pWords.length < config.startTipsSize + config.optionSequenceSize) {
      throw new GameSessionGenerationError("invalid option sequence size")
    }
    const outputP: GameSessionData.Paragraph.AsObject = {
      segmentsList: pWords.slice(config.startTipsSize),
      optionsSequenceList: [],
      startTipsList: pWords.slice(0, config.startTipsSize),
      sequenceSize: config.optionSequenceSize,
    }
    let pWordsIdx = config.startTipsSize
    let optionBucket = new PriorityQueue<OptionBucketEntry>([])

    let headOptionsPositions = Array(config.optionSequenceSize).map((_, i) => i)
    shuffleArray(headOptionsPositions, rng)

    for (let i = pWordsIdx; i < pWordsIdx + config.optionSequenceSize; i++) {
      optionBucket.gPush(new OptionBucketEntry(pWords[i], i))
    }

    const getPositionForOptionAtIdx = (idx: number): number => {
      if (idx < 0) {
        return headOptionsPositions[idx + config.optionSequenceSize]
      }
      return outputP.optionsSequenceList[idx].position
    }

    /**
		n slots = 4

		ABCDE E = 4
		must be scheduled, last chance, at 7 = 4 + slots - 1
		ABCDEGHIJK (no F, skipped since it would exceed 10)

		ADCBHIJEGK
		0123456789

		A D C B
		H D C B
		H D C I
		H D J I
		H K J I -> H E J I
		H G J I
		H K J I
		*/

    for (; pWordsIdx < pWords.length; pWordsIdx++) {
      let replacingOptionPos = getPositionForOptionAtIdx(
        pWordsIdx - config.startTipsSize - config.optionSequenceSize,
      )
      let ob: OptionBucketEntry
      if (
        pWordsIdx ===
        optionBucket.gTop().idx + config.optionSequenceSize - 1
      ) {
        ob = optionBucket.gPop()
      } else {
        ob = optionBucket.gPopAt(getRandomInt(0, optionBucket.gLen(), rng))
      }
      outputP.optionsSequenceList.push({
        content: ob.c,
        position: replacingOptionPos,
      })
      if (pWordsIdx + config.optionSequenceSize < pWords.length) {
        optionBucket.gPush(
          new OptionBucketEntry(
            pWords[pWordsIdx + config.optionSequenceSize],
            pWordsIdx + config.optionSequenceSize,
          ),
        )
      }
    }

    for (let i = 0; i < config.optionSequenceSize; i++) {
      outputP.optionsSequenceList.push({
        content: "",
        position:
          outputP.optionsSequenceList[
            pWords.length - config.optionSequenceSize + i
          ].position,
      })
    }

    data.paragraphsList.push(outputP)
  }
  return data
}

class OptionBucketEntry implements PQValuer {
  c: string
  idx: number

  constructor(c: string, idx: number) {
    this.c = c
    this.idx = idx
  }

  pqValue(): number {
    return this.idx
  }
}
