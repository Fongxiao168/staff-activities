const ACTIVITY_PATTERNS = [
  { key: "new_clients", patterns: ["today added new clients", "new clients", "today.*new.*client"] },
  { key: "today_trust_love", patterns: ["today.*trust.*love", "today's trust/love", "trust/love.*today"] },
  { key: "total_trust_love", patterns: ["total trust.*love", "total.*trust/love"] },
  { key: "today_hot_chat", patterns: ["today.*hot chat", "today's hot chat", "hot chat.*today"] },
  { key: "total_hot_chat", patterns: ["total hot chat", "total.*hot.*chat"] },
  { key: "today_test_size_cut", patterns: ["today.*test size cut", "test size cut.*today", "today's test size"] },
  { key: "today_size_cut", patterns: ["today.*size cut", "today's size cut", "size cut.*today"] },
  { key: "today_new_free_task", patterns: ["today.*new free task", "today's new free task", "new free task.*today"] },
  { key: "total_free_task", patterns: ["total free task", "total.*free.*task"] },
  {
    key: "today_promote_topup",
    patterns: ["today.*promote top-up", "today's promote top-up", "promote top-up.*today", "today.*promote.*topup"],
  },
  {
    key: "today_promote_success",
    patterns: ["today.*promote success", "today's promote success", "promote success.*today"],
  },
  {
    key: "today_new_interesting_clients",
    patterns: ["today.*new interesting", "today's new interesting", "new interesting.*today", "interesting client"],
  },
  { key: "total_interest_topup", patterns: ["total interest top-up", "total.*interest.*top", "total interest"] },
  { key: "today_register", patterns: ["today.*register", "today's register", "register.*today"] },
  { key: "total_register_bonus", patterns: ["total register.*bonus", "total.*register.*bonus", "register get bonus"] },
  { key: "today_send_voice", patterns: ["today send voice", "send voice", "today.*send.*voice"] },
  { key: "today_voice_call", patterns: ["today voice call", "voice call", "today.*voice.*call"] },
  { key: "today_video_call", patterns: ["today video call", "video call", "today.*video.*call"] },
  { key: "first_recharge_amount", patterns: ["first recharge", "first.*recharge.*amount"] },
  { key: "today_topup_amount", patterns: ["total top-up amount", "total.*topup.*amount", "top-up amount.*today"] },
  { key: "client_withdraw_amount", patterns: ["client withdraw", "withdraw amount", "withdrawal.*today"] },
]

function extractNumberFromLine(line: string): number {
  const cleaned = line.replace(/[$¥€£,]/g, "")
  const matches = cleaned.match(/[\d]+\.?[\d]*/g)
  if (matches && matches.length > 0) {
    return Number.parseFloat(matches[matches.length - 1]) || 0
  }
  return 0
}

function parseTextData(text: string): Record<string, number> {
  const result: Record<string, number> = {}
  const lines = text.toLowerCase().split(/[\n\r]+/)

  ACTIVITY_PATTERNS.forEach(({ key }) => {
    result[key] = 0
  })

  for (const line of lines) {
    if (!line.trim()) continue

    for (const { key, patterns } of ACTIVITY_PATTERNS) {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, "i")
        if (regex.test(line)) {
          const value = extractNumberFromLine(line)
          result[key] = value
          break
        }
      }
    }
  }

  const numberedPattern = /^(\d+)[.):\s]+.*?(\d+\.?\d*)$/
  for (const line of lines) {
    if (!line.trim()) continue

    const match = line.match(numberedPattern)
    if (match) {
      const lineNumber = Number.parseInt(match[1])
      const value = Number.parseFloat(match[2]) || 0

      const keyMap: Record<number, string> = {
        1: "new_clients",
        2: "today_trust_love",
        3: "total_trust_love",
        4: "today_hot_chat",
        5: "total_hot_chat",
        6: "today_test_size_cut",
        7: "today_size_cut",
        8: "today_new_free_task",
        9: "total_free_task",
        10: "today_promote_topup",
        11: "today_promote_success",
        12: "today_new_interesting_clients",
        13: "total_interest_topup",
        14: "today_register",
        15: "total_register_bonus",
        16: "today_send_voice",
        17: "today_voice_call",
        18: "today_video_call",
        19: "first_recharge_amount",
        20: "today_topup_amount",
        21: "client_withdraw_amount",
      }

      if (keyMap[lineNumber]) {
        result[keyMap[lineNumber]] = value
      }
    }
  }

  return result
}

function extractSequentialNumbers(text: string): Record<string, number> {
  const result: Record<string, number> = {}
  const keys = [
    "new_clients",
    "today_trust_love",
    "total_trust_love",
    "today_hot_chat",
    "total_hot_chat",
    "today_test_size_cut",
    "today_size_cut",
    "today_new_free_task",
    "total_free_task",
    "today_promote_topup",
    "today_promote_success",
    "today_new_interesting_clients",
    "total_interest_topup",
    "today_register",
    "total_register_bonus",
    "today_send_voice",
    "today_voice_call",
    "today_video_call",
    "first_recharge_amount",
    "today_topup_amount",
    "client_withdraw_amount",
  ]

  const numbers = text.match(/[\d]+\.?\d*/g) || []

  keys.forEach((key, index) => {
    result[key] = index < numbers.length ? Number.parseFloat(numbers[index]) || 0 : 0
  })

  return result
}

export async function POST(req: Request) {
  try {
    const { text, image } = await req.json()

    if (image && !text) {
      return Response.json(
        {
          error:
            "Image processing requires AI. Please paste text data instead, or add a credit card to your Vercel account to enable AI features.",
          requiresAI: true,
        },
        { status: 400 },
      )
    }

    if (!text) {
      return Response.json({ error: "No text data provided" }, { status: 400 })
    }

    let activities = parseTextData(text)

    const nonZeroCount = Object.values(activities).filter((v) => v > 0).length
    if (nonZeroCount < 3) {
      activities = extractSequentialNumbers(text)
    }

    return Response.json({ activities })
  } catch (error) {
    console.error("Error extracting activities:", error)
    return Response.json({ error: "Failed to extract activities" }, { status: 500 })
  }
}
