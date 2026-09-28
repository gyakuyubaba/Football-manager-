import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// POST /api/press-conference endpoint
app.post('/api/press-conference', async (req: Request, res: Response) => {
  const { question, managerResponse, matchContext, clubName, managerName } = req.body;

  if (!managerResponse) {
    return res.status(400).json({ error: 'Manager response is required' });
  }

  // If Gemini API is available, generate real AI sports journalism
  if (ai) {
    try {
      const prompt = `
あなたは世界的なサッカー専門記者・スポーツアナリストです。
以下の試合直後の公式記者会見において、監督の発言を元にニュース記事と反響を生成してください。

【状況】
・クラブ: ${clubName || 'クラブ'}
・監督名: ${managerName || '監督'}
・試合状況: ${matchContext || '白熱した公式戦'}
・記者からの質問: ${question || '本日の試合についての総括をお願いします'}
・監督の生コメント（自由回答）: 「${managerResponse}」

【指示】
監督の発言のトーン（強気、選手を庇う、戦術的、審判への不満、謙虚、自信など）を深く洞察し、現実のスポーツ新聞・サッカー専門誌（The Athleticや日刊スポーツ風）のリアルな記事を作成してください。
以下のJSONスキーマで返答してください。
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: 'スポーツ新聞の目を引く見出し' },
              article: { type: Type.STRING, description: '記者会見の様子と発言を引用した150〜200文字の本文記事' },
              fanReaction: { type: Type.STRING, description: 'サポーターSNSや現地のファンの声（肯定・疑問・熱狂など）' },
              playerTrustDelta: { type: Type.INTEGER, description: '選手からの信頼度変化 (-5から+5の整数)' },
              boardConfidenceDelta: { type: Type.INTEGER, description: 'フロント・理事会からの評価変化 (-5から+5の整数)' },
              mediaGrade: { type: Type.STRING, description: 'メディアによる会見評価 (A+, A, B, C, Dなど)' }
            },
            required: ['headline', 'article', 'fanReaction', 'playerTrustDelta', 'boardConfidenceDelta', 'mediaGrade']
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text.trim());
        return res.json(parsed);
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local news generator:', err);
    }
  }

  // Realistic fallback rule-based generation
  const isPositive = !managerResponse.includes('審判') && !managerResponse.includes('最悪') && !managerResponse.includes('責任');
  const isAggressive = managerResponse.includes('勝ち点') || managerResponse.includes('優勝') || managerResponse.includes('完璧') || managerResponse.includes('自信');
  
  const headline = isAggressive
    ? `【会見詳報】${managerName}監督、強気の言葉で選手を鼓舞「${managerResponse.slice(0, 20)}…」`
    : `【会見詳報】${clubName}の${managerName}監督が語る「${managerResponse.slice(0, 20)}…」`;

  const article = `試合後のフラッシュインタビューおよび記者会見に臨んだ${managerName}監督は、「${managerResponse}」と語り、チームの現在の立ち位置と次節への決意を述べた。冷静かつ的確な現状認識に対し、報道陣からも納得の声が上がった。`;

  const fanReaction = isPositive
    ? 'サポーターからは「頼もしい監督の言葉に勇気づけられた」「次節も信じてついていく」と好意的な反応が多数。'
    : 'SNS上ではサポーターによる議論が沸騰。「厳しい言葉だが的を射ている」「次節のスタメン変更に期待」などの声が寄せられた。';

  return res.json({
    headline,
    article,
    fanReaction,
    playerTrustDelta: isPositive ? 2 : -1,
    boardConfidenceDelta: 1,
    mediaGrade: isAggressive ? 'A' : 'B+'
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
