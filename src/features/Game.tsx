import { getAuth } from "firebase/auth"
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
import { useEffect, useState } from "react"
import {
  Article,
  CreateGameSessionRequest,
  GameSession,
  ListArticlesRequest,
} from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_types_pb"

function swapKeyOfMap<K, V>(m: Map<K, V>, k1: K, k2: K) {
  const v1 = m.get(k1)
  const v2 = m.get(k2)
  m.set(k1, v2!!)
  m.set(k2, v1!!)
}

export function Game() {
  const coreServiceClient = useCoreServiceClient()
  const auth = getAuth()
  const [user] = useAuthState(auth)
  const [articles, setArticles] = useState([] as Article.AsObject[])
  useEffect(() => {
    async function fetchArticles() {
      const req = new ListArticlesRequest()
      const res = await coreServiceClient.listArticles(req)
      setArticles(res.toObject().articlesList)
    }
    fetchArticles()
  }, [])

  const gameSessionTimeSeconds = 20 * 60
  const numOfTipsPerParagraph = 5
  const numOfChoicesInTip = 3

  const [articleId, setArticleId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const articleTitle =
    articles.find((article) => article.id === articleId)?.name ?? null
  const [textParagraphs, setTextParagraphs] = useState([] as string[])
  const [slots, setSlots] = useState(Array(12).fill(" "))
  const [colorOnSlots, setColorOnSlots] = useState(Array(12).fill("white"))
  const [optionToSlotMap, setOptionToSlotMap] = useState(
    new Map<number, number>(),
  )
  const [slotToOptionMap, setSlotToOptionMap] = useState(
    new Map<number, number>(),
  )
  const [optionSequenceIdx, setOptionSequenceIdx] = useState(0)
  const [paragraphIdx, setParagraphIdx] = useState(0)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [startTime, setStartTime] = useState(new Date())
  const [showTimer, setShowTimer] = useState(false)
  const [showFreezedTimeTaken, setShowFreezedTimeTaken] = useState(false)
  const [freezedTimeTaken, setFreezedTimeTaken] = useState(0.0) // seconds
  const [freezeGame, setFreezeGame] = useState(false)
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  const [remainingTips, setRemainingTips] = useState(0)
  const [numOfIncorrectChosen, setNumOfIncorrectChosen] = useState(0)

  // calculate score
  const wordsAnswered = textParagraphs
    .map((s) => s.length)
    .reduce((a, b) => a + b, 0)
  const timeTaken = showFreezedTimeTaken
    ? freezedTimeTaken
    : (currentTime.getTime() - currentTime.getTime()) / 1000
  const score = Math.round(
    wordsAnswered * 500 - timeTaken * 10 - numOfIncorrectChosen * 150,
  )

  const [currentGameSession, setCurrentGameSession] =
    useState<GameSession.AsObject | null>(null)

  function resetContent() {
    setIsLoading(true)
    setTextParagraphs([])
    setSlots(Array(12).fill(" "))
    setColorOnSlots(Array(12).fill("white"))

    setCurrentTime(new Date())
    setStartTime(new Date())
    setShowTimer(false)
    setShowFreezedTimeTaken(false)
    setFreezedTimeTaken(0.0)

    setFreezeGame(false)

    setNumOfIncorrectChosen(0)
  }

  function handleSelectArticleId(evt: SelectChangeEvent<string>) {
    const articleId = evt.target.value
    if (!articleId) {
      return
    }
    async function fetchGameSession() {
      const req = new CreateGameSessionRequest()
      req.setArticleId(articleId)
      const res = await coreServiceClient.createGameSession(req)
      setCurrentGameSession(res.getGameSession()?.toObject() ?? null)
      setParagraphIdx(0)
      setStartTime(new Date())
      loadParagraph()
      setIsLoading(false)
      setShowTimer(true)
    }
    fetchGameSession()
  }

  function swapOptions(o1: number, o2: number) {
    const s1 = optionToSlotMap.get(o1)
    const s2 = optionToSlotMap.get(o2)
    setOptionToSlotMap((om) => {
      const nm = new Map(om)
      swapKeyOfMap(nm, o1, o2)
      return nm
    })
    setSlotToOptionMap((om) => {
      const nm = new Map(om)
      swapKeyOfMap(nm, s1, s2)
      return nm
    })
  }

  function swapSlots(s1: number, s2: number) {
    const o1 = slotToOptionMap.get(s1)
    const o2 = slotToOptionMap.get(s2)
    setOptionToSlotMap((om) => {
      const nm = new Map(om)
      swapKeyOfMap(nm, o1, o2)
      return nm
    })
    setSlotToOptionMap((om) => {
      const nm = new Map(om)
      swapKeyOfMap(nm, s1, s2)
      return nm
    })
  }

  function getOption(idx: number): string {
    return slots[optionToSlotMap.get(idx)!!]
  }

  function setOption(idx: number, value: string) {
    slots[optionToSlotMap.get(idx)!!] = value
  }

  function resetColorOfSlots() {
    const paragraph = currentGameSession!.data!.paragraphsList[paragraphIdx]
    const numOfSlots = paragraph.sequenceSize
    setColorOnSlots(Array(numOfSlots).fill("white"))
  }

  function loadParagraph() {
    const paragraph = currentGameSession!.data!.paragraphsList[paragraphIdx]
    setTextParagraphs((tp) => [...tp, paragraph.startTipsList.join("")])
    setOptionSequenceIdx(0)
    const numOfSlots = paragraph.sequenceSize
    setSlots(Array(numOfSlots).fill(" "))
    setColorOnSlots(Array(numOfSlots).fill("white"))
    const otsm = new Map<number, number>()
    const stom = new Map<number, number>()
    while (optionSequenceIdx < numOfSlots) {
      const option = paragraph.optionsSequenceList[optionSequenceIdx]
      console.assert(slots[option.position] === " ")
      const newSlots = [...slots]
      newSlots[option.position] = option.content
      setSlots(newSlots)
      setOptionSequenceIdx((i) => i + 1)
    }
    setRemainingTips(numOfTipsPerParagraph)
  }

  function handleChoiceClick(chosenSlotIdx: number) {
    if (freezeGame) {
      return
    }
    const paragraph = currentGameSession!.data!.paragraphsList[paragraphIdx]
    const solutionIdx = optionSequenceIdx - paragraph.sequenceSize
    const solution = paragraph.segmentsList[solutionIdx]
    if (solution !== slots[chosenSlotIdx]) {
      handleChosenWrongOption(chosenSlotIdx)
      return
    }
    resetColorOfSlots()
    flashSlotColor(chosenSlotIdx, "green")
    let nextOption = paragraph.optionsSequenceList[optionSequenceIdx]
    if (optionToSlotMap.get(nextOption.position) !== chosenSlotIdx) {
      swapSlots(optionToSlotMap.get(nextOption.position)!, chosenSlotIdx)
    }
    setOption(nextOption.position, nextOption.content)
    setTextParagraphs((oldTextParagraphs) => {
      const ret = [...oldTextParagraphs]
      ret[ret.length - 1] += solution
      return ret
    })
    setOptionSequenceIdx((idx) => idx + 1)
    if (
      optionSequenceIdx - paragraph.sequenceSize >=
      paragraph.segmentsList.length
    ) {
      finishParagraph()
    }
  }

  function handleChosenWrongOption(chosenSlotIdx: number) {
    setNumOfIncorrectChosen((i) => i + 1)
    flashSlotColor(chosenSlotIdx, "red")
  }

  function flashSlotColor(chosenSlotIdx: number, color: string) {
    setColorOnSlots((arr) => [
      ...arr.slice(0, chosenSlotIdx),
      color,
      ...arr.slice(chosenSlotIdx + 1),
    ])
    setTimeout(() => {
      setColorOnSlots((arr) => [
        ...arr.slice(0, chosenSlotIdx),
        "white",
        ...arr.slice(chosenSlotIdx + 1),
      ])
    }, 200)
  }

  function setSlotColor(chosenSlotIdx: number, color: string) {
    setColorOnSlots((arr) => [
      ...arr.slice(0, chosenSlotIdx),
      color,
      ...arr.slice(chosenSlotIdx + 1),
    ])
  }

  function  finishParagraph() {
    setParagraphIdx(idx => idx + 1)
    if (paragraphIdx >= curr)
  }

  if (!user) {
    return (
      <>
        <Container sx={{ width: "100%", height: "100%" }}>
          <Typography align="center">
            如長時間未跳轉，請重新整理頁面。
          </Typography>
        </Container>
      </>
    )
  }
  return (
    <>
      <AppBar position="fixed" color="transparent">
        <Toolbar>
          <FormControl>
            <Select
              sx={{ m: 1, minWidth: 120 }}
              value={articleId}
              onChange={handleSelectArticleId}
              displayEmpty
            >
              <MenuItem value="">
                <em>請選擇文章</em>
              </MenuItem>
              {articles.map((article) => (
                <MenuItem value={article.id}>{article.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>
    </>
  )
}
