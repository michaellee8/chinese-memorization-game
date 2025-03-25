import {
  AppBar,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Toolbar,
  Typography,
  styled,
} from "@mui/material"
import { Component, ReactNode, createRef, useEffect, useState } from "react"
import {
  Article,
  GameSession,
  GameSessionStatus,
} from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_types_pb"
import CloseIcon from "@mui/icons-material/Close"
import articlesData from "../articles-data.json"
import {
  generateGameSessionDataFromParagraphs,
  generateRandomSeedString,
} from "./SessionGen"

const Offset = styled("div")(({ theme }) => theme.mixins.toolbar)

function swapArrayElement<T>(arr: T[], i1: number, i2: number) {
  const tmp = arr[i1]
  arr[i1] = arr[i2]
  arr[i2] = tmp
}

function* chunks<T>(arr: T[], n: number): Generator<T[], void> {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n)
  }
}

interface GameProps {}

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

  slots = Array(12).fill("-") as string[]
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

  randomSeed = ""

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

  textRef = createRef<HTMLDivElement>()

  fetchArticles = async () => {
    this.setState({
      articlesList: articlesData.map((article) => ({
        id: article.name,
        name: article.name,
        isOwnUnlisted: false,
        isUnlisted: false,
      })),
    })
  }

  resetContent = () => {
    this.isLoading = true
    this.textParagraphs = []
    this.slots = Array(12).fill("-")
    this.colorOnSlots = Array(12).fill("white")

    this.currentTime = new Date()
    this.startTime = new Date()
    this.showTimer = false
    this.showFreezedTimeTaken = false
    this.freezedTimeTaken = 0.0

    this.freezeGame = false
    this.numOfIncorrectChosen = 0
    this.randomSeed = ""
  }

  handleSelectArticleId = (evt: SelectChangeEvent<string>) => {
    const articleId = evt.target.value
    if (!articleId || this.articleId === articleId) {
      return
    }
    this.state.articleId = articleId
    const fetchGameSession = async () => {
      this.resetContent()
      const article = articlesData.find(
        (article) => article.name === articleId,
      )!
      this.randomSeed = generateRandomSeedString()
      const gameSessionData = generateGameSessionDataFromParagraphs(
        article.paragraphs,
        this.randomSeed,
      )
      this.currentGameSession = {
        articleId: articleId,
        id: "game-session-id",
        status: GameSessionStatus.GAME_SESSION_STATUS_ACTIVE,
        data: gameSessionData,
      }
      this.paragraphIdx = 0
      this.startTime = new Date()
      this.loadParagraph()
      this.isLoading = false
      this.showTimer = true
      this.forceUpdate()
    }
    fetchGameSession()
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
    this.slots = Array(numOfSlots).fill("-")
    this.colorOnSlots = Array(numOfSlots).fill("white")
    this.optionToSlotMap = Array(12).fill(-1) as number[]
    this.slotToOptionMap = Array(12).fill(-1) as number[]
    for (let i = 0; i < numOfSlots; i++) {
      this.optionToSlotMap[i] = i
      this.slotToOptionMap[i] = i
    }
    while (this.optionSequenceIdx < numOfSlots) {
      let option = paragraph.optionsSequenceList[this.optionSequenceIdx]
      console.assert(this.slots[option.position] === "-")
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

  render(): ReactNode {
    return (
      <Container sx={{ padding: 0 }}>
        <AppBar position="sticky" color="transparent">
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Stack direction={"column"}>
              <Typography variant="body1">
                {this.randomSeed ? this.randomSeed : "-"}
              </Typography>
              <Typography variant="body1">
                {this.articleId ? this.score : "-"}
              </Typography>
            </Stack>
            <FormControl>
              <Select
                sx={{ m: 1 }}
                value={this.articleId}
                onChange={(evt) => {
                  this.handleSelectArticleId(evt)
                  this.forceUpdate()
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>請選擇文章</em>
                </MenuItem>
                {this.state.articlesList.map((article) => (
                  <MenuItem value={article.id} key={article.id}>
                    {article.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => {
                this.handleGetTipsButtonTapped()
                this.forceUpdate()
              }}
            >
              獲取提示
            </Button>
          </Toolbar>
        </AppBar>
        <Stack direction="column">
          <Offset />
          <Container sx={{ flexGrow: 1 }} ref={this.textRef}>
            {this.textParagraphs.map((text, idx) => (
              <Typography variant="body1" key={idx}>
                {text}
              </Typography>
            ))}
          </Container>
          <Offset />
          <Offset />
        </Stack>
        <AppBar
          position="fixed"
          color="transparent"
          sx={{ top: "auto", bottom: 0 }}
        >
          <Toolbar sx={{ paddingX: 0 }}>
            <Stack
              direction={"column"}
              flexWrap={"nowrap"}
              sx={{ width: "100%" }}
            >
              {Array.from(chunks(
                this.slots.map((_, idx) => (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      this.handleChoiceClick(idx)
                      this.forceUpdate()
                      if (this.textRef.current) {
                        this.textRef.current.scrollTop =
                          this.textRef.current.scrollHeight
                      }
                    }}
                    sx={{
                      backgroundColor: this.colorOnSlots[idx],
                      borderColor: "black",
                      color: "black",
                      fontWeight: "bold",
                      paddingX: 0,
                      minWidth: 0,
                      flexGrow: 1,
                    }}
                    disabled={this.freezeGame}
                  >
                    {this.slots[idx]}
                  </Button>
                )),
                6,
              ))
                .map((buttons) => (
                  <Stack direction={"row"} spacing={0.5} flexWrap={"nowrap"}>
                    {buttons}
                  </Stack>
                ))}
            </Stack>
          </Toolbar>
        </AppBar>
        <Dialog
          open={this.showEndGameModal}
          onClose={() => {
            this.showEndGameModal = false
            this.forceUpdate()
            window.location.reload()
          }}
          fullScreen
        >
          {" "}
          <AppBar sx={{ position: "relative" }}>
            <Toolbar>
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => {
                  this.showEndGameModal = false
                  this.forceUpdate()
                  window.location.reload()
                }}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                遊戲結果
              </Typography>
            </Toolbar>
          </AppBar>
          <DialogContent>
            <DialogContentText>分數： {this.score}</DialogContentText>
            <DialogContentText>
              用時：{" "}
              {Math.round(
                (this.currentTime.getTime() - this.startTime.getTime()) / 1000,
              )}{" "}
              秒
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </Container>
    )
  }
}
