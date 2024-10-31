import { GameSessionData } from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_types_pb"
import {
  generateGameSessionDataFromParagraphs,
  generateRandomSeedString,
  getRandomInt,
  shuffleArray,
} from "./SessionGen"

// ported from https://gitlab.com/hkdse-practice/chinese/backend/core/-/blob/main/pkg/gamesession/testclient.go?ref_type=heads

// Handling of duplicated options should be handled by the client-side. For example if the word "Y" is
// pickable in both option 3 and 5, and the next option "X" has a designated index of 5, but the user chose
// slot 3, the game client should reassign the option 3 to actual slot 5 and option 5 to actual slot 3, which
// means that now the actual slot of option 3 and option 5 is swapped, and "X" is populated into the virtual
// option 3, which can be remapped to actual slot 5.

const errMsgNoMatchingSlot = "no matching slot to pick"
const errMsgStartTipNotMatching = "start tips does not match"
const errMsgIncorrectStartSequencePosition =
  "start sequence have incorrect position"
const errMsgInvalidOptionSequenceTail =
  "end of option sequence should be all empty space"

function swapMapValueOfTwoKey<K, V>(m: Map<K, V>, k1: K, k2: K): void {
  let tmp = m.get(k1)!
  m.set(k1, m.get(k2)!)
  m.set(k2, tmp)
}

export class TestClient {
  sessionData: GameSessionData.AsObject
  solutions: string[][]
  rng: () => number

  // per paragraph state
  // options are for data and slots are for real ui
  slots: string[]
  optionToSlotMap: Map<number, number>
  slotToOptionMap: Map<number, number>

  constructor(
    sessionData: GameSessionData.AsObject,
    solutions: string[][],
    rng: () => number,
  ) {
    this.sessionData = sessionData
    this.solutions = solutions
    this.rng = rng

    this.slots = []
    this.optionToSlotMap = new Map()
    this.slotToOptionMap = new Map()
  }

  setupParagraphState(sequenceSize: number): void {
    this.slots = Array(sequenceSize).map(() => "")
    this.optionToSlotMap = new Map()
    this.slotToOptionMap = new Map()
    for (let i = 0; i < sequenceSize; i++) {
      this.optionToSlotMap.set(i, i)
      this.slotToOptionMap.set(i, i)
    }
  }

  swapOptions(o1: number, o2: number): void {
    let s1 = this.optionToSlotMap.get(o1)!
    let s2 = this.optionToSlotMap.get(o2)!

    swapMapValueOfTwoKey(this.optionToSlotMap, o1, o2)
    swapMapValueOfTwoKey(this.slotToOptionMap, s1, s2)
  }

  swapSlots(s1: number, s2: number): void {
    let o1 = this.slotToOptionMap.get(s1)!
    let o2 = this.slotToOptionMap.get(s2)!

    swapMapValueOfTwoKey(this.optionToSlotMap, o1, o2)
    swapMapValueOfTwoKey(this.slotToOptionMap, s1, s2)
  }

  getOption(idx: number): string {
    return this.slots[this.optionToSlotMap.get(idx)!]
  }

  setOption(idx: number, value: string): void {
    this.slots[this.optionToSlotMap.get(idx)!] = value
  }

  solve(): void {
    this.sessionData.paragraphsList.forEach((paragraph, paragraphIdx) => {
      this.setupParagraphState(paragraph.sequenceSize)
      let solution = this.solutions[paragraphIdx]
      let solutionIdx = 0
      let optionSequenceIdx = 0
      paragraph.startTipsList.forEach((tip) => {
        if (tip !== solution[solutionIdx]) {
          throw new Error(errMsgStartTipNotMatching)
        }
        solutionIdx++
      })
      for (
        optionSequenceIdx = 0;
        optionSequenceIdx < paragraph.sequenceSize;
        optionSequenceIdx++
      ) {
        let option = paragraph.optionsSequenceList[optionSequenceIdx]
        if (this.slots[option.position] !== "") {
          throw new Error(errMsgIncorrectStartSequencePosition)
        }
        this.slots[option.position] = option.content
      }
      for (; solutionIdx < solution.length; solutionIdx++) {
        // randomly picking a possible solution
        let possibleChoices: number[] = []
        this.slots.forEach((slot, slotIdx) => {
          if (slot === solution[solutionIdx]) {
            possibleChoices.push(slotIdx)
          }
        })
        if (possibleChoices.length === 0) {
          throw new Error(errMsgNoMatchingSlot)
        }
        let chosenSlotIndex =
          possibleChoices[getRandomInt(0, possibleChoices.length, this.rng)]
        let nextOption = paragraph.optionsSequenceList[optionSequenceIdx]

        // swap the slots if the projected slot of the next option's position
        // does not match the picked slot
        if (
          this.optionToSlotMap.get(nextOption.position)! !== chosenSlotIndex
        ) {
          this.swapSlots(
            this.optionToSlotMap.get(nextOption.position)!,
            chosenSlotIndex,
          )
        }

        // We have swapped if required, so now we can simply replace according to the next option's position
        this.setOption(nextOption.position, nextOption.content)

        optionSequenceIdx++
      }

      this.slots.forEach((e) => {
        if (e !== "") {
          throw new Error(errMsgInvalidOptionSequenceTail)
        }
      })
    })
  }
}
