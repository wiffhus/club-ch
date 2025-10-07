import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {
  const { request, env } = context;

  // CORSヘッダー設定
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // OPTIONSリクエスト（プリフライト）への対応
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // POSTリクエストのみ処理
  if (request.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // リクエストボディを取得
    const { contents } = await request.json();

    // ★環境変数からAPIキーを取得（GEMINI_API_KEY_CHLOE）
    const apiKey = env.GEMINI_API_KEY_CHLOE;
    
    if (!apiKey) {
      throw new Error("APIキーが設定されていません");
    }

    // Google Generative AIの初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro"
    });

    // チャットセッションの開始
    const chat = model.startChat({
      history: contents.slice(0, -1),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.9,
      },
    });

    // メッセージ送信
    const lastMessage = contents[contents.length - 1].parts[0].text;
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    // レスポンスを返す
    return new Response(
      JSON.stringify({ response: responseText }), 
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "エラーが発生しました",
        details: error.message 
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}
