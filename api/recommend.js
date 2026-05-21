export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { mood, city, type } = req.body
  if (!mood) return res.status(400).json({ error: '请描述你的心情或场景' })

  const prompt = `你是一个专门推荐城市隐藏好去处的本地向导。
用户心情：${mood}，城市：${city || '不限'}，偏好：${type || '不限'}
推荐3个隐藏好去处，只有本地人才知道的冷门地方。
只返回JSON，不加任何其他文字：
{"places":[{"name":"地方名","type":"类型","vibe":"氛围描述","story":"推荐故事80字","bestTime":"最佳时间","tip":"本地贴士","matchReason":"匹配原因"}],"moodRead":"共鸣回应"}`

  try {
    const apiKey = process.env.GEMINI_API_KEY
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 1500 }
        })
      }
    )
    const data = await response.json()
    if (!data.candidates?.[0]) {
      return res.status(500).json({ error: 'AI返回异常: ' + JSON.stringify(data).slice(0, 200) })
    }
    const raw = data.candidates[0].content.parts[0].text
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: '生成失败：' + err.message })
  }
}
