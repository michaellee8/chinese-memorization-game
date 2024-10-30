import { GameSessionData } from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_types_pb"
import * as config from "./Config"

function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled) // The maximum is exclusive and the minimum is inclusive
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
): GameSessionData.AsObject {
  const data: GameSessionData.AsObject = {
    paragraphsList: [],
  }
  return data
  for (const pText of paragraphs) {
    const pWords = pText.split("")
    if (pWords.length < config.startTipsSize + config.optionSequenceSize) {
      throw new GameSessionGenerationError("invalid option sequence size")
    }
    const ontputP: GameSessionData.Paragraph.AsObject = {
      segmentsList: pWords.slice(config.startTipsSize),
      optionsSequenceList: pWords.slice(0, config.startTipsSize),
      startTipsList: [],
      sequenceSize: config.optionSequenceSize,
    }
  }
}
