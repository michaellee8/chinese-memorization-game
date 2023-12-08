import { User, getAuth } from "firebase/auth"
import { useCoreServiceClient } from "./CoreService"
import { useAuthState } from "react-firebase-hooks/auth"
import {
  AppBar,
  Container,
  FormControl,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Toolbar,
  Typography,
  colors,
} from "@mui/material"
import { Component, useEffect, useState } from "react"
import {
  Article,
  CreateGameSessionRequest,
  GameSession,
  GameSessionResult,
  ListArticlesRequest,
  SubmitGameSessionResultRequest,
} from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_types_pb"
import { CoreServicePromiseClient } from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_service_grpc_web_pb"
import * as google_protobuf_duration_pb from "google-protobuf/google/protobuf/duration_pb"
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb"

function swapArrayElement<T>(arr: T[], i1: number, i2: number) {
  const tmp = arr[i1]
  arr[i1] = arr[i2]
  arr[i2] = tmp
}

interface GameProps {
  coreServiceClient: CoreServicePromiseClient
  user?: User
}

interface GameState {
  articleId: string
  articlesList: Article.AsObject[]
}

// bad react code, just want to copy SwiftUI logic, don't learn from his
export class Game extends Component<GameProps, GameState> {
  state = { articleId: "", articlesList: [] as Article.AsObject[] }

  gameSessionTimeSeconds = 20 * 60
  numOfTipsPerParagraph = 5
  numOfChoicesInTip = 3

  isLoading = true
  currentTimeRefresherHandler?: NodeJS.Timeout
  get coreServiceClient() {
    return this.props.coreServiceClient
  }
  get articleId() {
    return this.state.articleId
  }
  get articleTitle() {
    if (!this.state.articleId) {
      return ""
    }
    return this.state.articlesList.find((a) => a.id)?.name ?? ""
  }
  textParagraphs = [] as string[]

  slots = Array(12).fill(" ") as string[]
  colorOnSlots = Array(12).fill("white") as string[]

  optionToSlotMap = Array(12).fill(-1) as number[]
  slotToOptionMap = Array(12).fill(-1) as number[]
  optionSequenceIdx = 0
  paragraphIdx = 0

  currentTime = new Date()
  startTime = new Date()
  showTimer = false
  showFreezedTimeTaken = false
  freezedTimeTaken = 0.0 // seconds

  freezeGame = false
  showEndGameModal = false

  remainingTips = 0

  numOfIncorrectChosen = 0

  get score(): number {
    const wordsAnswered = this.textParagraphs
      .map((p) => p.length)
      .reduce((a, b) => a + b, 0)
    const timeTaken = this.showFreezedTimeTaken
      ? this.freezedTimeTaken
      : (this.currentTime.getTime() - this.startTime.getTime()) / 1000
    return Math.round(
      wordsAnswered * 500 - timeTaken * 10 - this.numOfIncorrectChosen * 150,
    )
  }

  currentGameSession: GameSession.AsObject | null = null

  fetchArticles = async () => {
    const req = new ListArticlesRequest()
    const res = await this.props.coreServiceClient.listArticles(req)
    this.setState({ articlesList: res.toObject().articlesList })
  }

  resetContent = () => {
    this.isLoading = true
    this.textParagraphs = []
    this.slots = Array(12).fill(" ")
    this.colorOnSlots = Array(12).fill("white")

    this.currentTime = new Date()
    this.startTime = new Date()
    this.showTimer = false
    this.showFreezedTimeTaken = false
    this.freezedTimeTaken = 0.0

    this.freezeGame = false
    this.numOfIncorrectChosen = 0
  }

  handleGetTipsButtonTapped() {
    if (this.freezeGame) {
      return
    }
    if (this.remainingTips <= 0) {
      return
    }
    const paragraph =
      this.currentGameSession!.data!.paragraphsList[this.paragraphIdx]
    const solutionIdx = this.optionSequenceIdx - paragraph.sequenceSize
    const solution = paragraph.segmentsList[solutionIdx]
    const correctSlotIdx = this.slots.indexOf(solution)
    if (correctSlotIdx === -1) {
      return
    }
    const tipsIdx = [correctSlotIdx]
    for (let i = 2; i <= this.numOfChoicesInTip; i++) {
      while (true) {
        const tipIdx = Math.floor(Math.random() * paragraph.sequenceSize)
        if (tipsIdx.indexOf(tipIdx) === -1) {
          tipsIdx.push(tipIdx)
          break
        }
      }
    }
    for (let tipIdx of tipsIdx) {
      this.setSlotColor(tipIdx, "yellow")
    }
    this.remainingTips -= 1
  }

  loadGameSession = async () => {
    this.isLoading = true
    this.showTimer = false

    const req = new CreateGameSessionRequest()
    req.setArticleId(this.state.articleId)
    const res = await this.coreServiceClient.createGameSession(req)
    const gameSession = res.getGameSession()?.toObject() ?? null
    this.currentGameSession = gameSession
    this.paragraphIdx = 0
    this.startTime = new Date()
    this.loadParagraph()
    this.isLoading = false
    this.showTimer = true
  }

  swapOptions = (o1: number, o2: number) => {
    const s1 = this.optionToSlotMap[o1]
    const s2 = this.optionToSlotMap[o2]
    swapArrayElement(this.optionToSlotMap, o1, o2)
    swapArrayElement(this.slotToOptionMap, s1, s2)
  }

  swapSlots = (s1: number, s2: number) => {
    const o1 = this.slotToOptionMap[s1]
    const o2 = this.slotToOptionMap[s2]
    swapArrayElement(this.optionToSlotMap, o1, o2)
    swapArrayElement(this.slotToOptionMap, s1, s2)
  }

  getOption = (idx: number): string => {
    return this.slots[this.optionToSlotMap[idx]]
  }

  setOption = (idx: number, value: string) => {
    this.slots[this.optionToSlotMap[idx]] = value
  }

  resetColorOfSlots = () => {
    const paragraph =
      this.currentGameSession!.data!.paragraphsList[this.paragraphIdx]
    const numOfSlots = paragraph.sequenceSize
    this.colorOnSlots = Array(numOfSlots).fill("white")
  }

  loadParagraph = () => {
    const paragraph =
      this.currentGameSession!.data!.paragraphsList[this.paragraphIdx]
    this.textParagraphs.push(paragraph.startTipsList.join(""))
    this.optionSequenceIdx = 0
    const numOfSlots = paragraph.sequenceSize
    this.slots = Array(numOfSlots).fill(" ")
    this.colorOnSlots = Array(numOfSlots).fill("white")
    this.optionToSlotMap = Array(12).fill(-1) as number[]
    this.slotToOptionMap = Array(12).fill(-1) as number[]
    for (let i = 0; i < numOfSlots; i++) {
      this.optionToSlotMap[i] = i
      this.slotToOptionMap[i] = i
    }
    while (this.optionSequenceIdx < numOfSlots) {
      let option = paragraph.optionsSequenceList[this.optionSequenceIdx]
      console.assert(this.slots[option.position] === " ")
      this.slots[option.position] = option.content
      this.optionSequenceIdx += 1
    }
    this.remainingTips = this.numOfTipsPerParagraph
  }

  handleChoiceClick = (chosenSlotIdx: number) => {
    if (this.freezeGame) {
      return
    }
    const paragraph =
      this.currentGameSession!.data!.paragraphsList[this.paragraphIdx]
    const solutionIdx = this.optionSequenceIdx - paragraph.sequenceSize
    const solution = paragraph.segmentsList[solutionIdx]
    if (solution !== this.slots[chosenSlotIdx]) {
      this.handleChosenWrongOption(chosenSlotIdx)
      return
    }
    this.resetColorOfSlots()
    this.flashSlotColor(chosenSlotIdx, "green")
    const nextOption = paragraph.optionsSequenceList[this.optionSequenceIdx]
    if (this.optionToSlotMap[nextOption.position] !== chosenSlotIdx) {
      this.swapSlots(this.optionToSlotMap[nextOption.position], chosenSlotIdx)
    }
    this.setOption(nextOption.position, nextOption.content)
    this.textParagraphs[this.textParagraphs.length - 1] += solution
    this.optionSequenceIdx += 1

    // handle paragraph is finished
    if (
      this.optionSequenceIdx - paragraph.sequenceSize >=
      paragraph.segmentsList.length
    ) {
      this.finishParagraph()
    }
  }

  handleChosenWrongOption = (chosenSlotIdx: number) => {
    this.numOfIncorrectChosen += 1
    this.flashSlotColor(chosenSlotIdx, "red")
  }

  flashSlotColor = (chosenSlotIdx: number, color: string) => {
    const period = 0.2 * 1000
    this.colorOnSlots[chosenSlotIdx] = color
    setTimeout(() => {
      this.colorOnSlots[chosenSlotIdx] = "white"
      this.forceUpdate()
    }, period)
  }

  setSlotColor = (chosenSlotIdx: number, color: string) => {
    this.colorOnSlots[chosenSlotIdx] = color
  }

  finishParagraph = () => {
    this.paragraphIdx += 1
    if (
      this.paragraphIdx >= this.currentGameSession!.data!.paragraphsList.length
    ) {
      this.finishGame()
      return
    }
    this.loadParagraph()
  }

  finishGame = () => {
    this.freezeGame = true
    this.showEndGameModal = true
    this.freezedTimeTaken =
      (this.currentTime.getTime() - this.startTime.getTime()) / 1000
    this.showFreezedTimeTaken = true

    const submitResult = async () => {
      try {
        const req = new SubmitGameSessionResultRequest()
        req.setSessionId(this.currentGameSession?.id ?? "")
        const result = new GameSessionResult()
        result.setScore(this.score)
        result.setSuccess(true)
        const timeTakem = new google_protobuf_duration_pb.Duration()
        timeTakem.setSeconds(this.freezedTimeTaken)
        result.setTimeTaken(timeTakem)
        const submittedAt = new google_protobuf_timestamp_pb.Timestamp()
        submittedAt.setSeconds(new Date().getTime() / 1000)
        result.setSubmittedAt(submittedAt)
        await this.coreServiceClient.submitGameSessionResult(req)
      } catch (err) {
        console.error("submitGameSessionResult", err)
      }
    }
  }

  componentDidMount(): void {
    this.fetchArticles()
    this.currentTimeRefresherHandler = setInterval(() => {
      this.currentTime = new Date()
      this.forceUpdate()
    }, 0.1 * 1000)
  }

  componentWillUnmount(): void {
    if (this.currentTimeRefresherHandler) {
      clearInterval(this.currentTimeRefresherHandler)
    }
  }
}
