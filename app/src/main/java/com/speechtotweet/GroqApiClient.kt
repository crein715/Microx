package com.speechtotweet

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class GroqApiClient(private val apiKey: String) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    companion object {
        private const val API_URL = "https://api.groq.com/openai/v1/chat/completions"
        private const val MODEL = "llama-3.3-70b-versatile"
    }

    fun translateAndFormatTweet(speechText: String, sourceLanguage: String = "Ukrainian"): Result<String> {
        return try {
            val systemPrompt = """You are a social media expert and translator. Your task:
1. The user's input is spoken in $sourceLanguage and transcribed by speech recognition.
2. Translate the text from $sourceLanguage to English (if it's already English, just clean it up).
3. Format the English text as a Twitter/X post.
4. The tweet MUST be 280 characters or fewer.
5. Make it engaging, concise, and natural-sounding.
6. Add relevant hashtags (2-4 max) if appropriate.
7. Use emojis sparingly if they fit the tone.
8. Do NOT add quotes around the tweet.
9. Return ONLY the tweet text, nothing else — no explanation, no preamble, no labels."""

            val userMessage = "Convert this $sourceLanguage speech to an English tweet:\n\n\"$speechText\""

            val messagesArray = JSONArray().apply {
                put(JSONObject().apply {
                    put("role", "system")
                    put("content", systemPrompt)
                })
                put(JSONObject().apply {
                    put("role", "user")
                    put("content", userMessage)
                })
            }

            val body = JSONObject().apply {
                put("model", MODEL)
                put("messages", messagesArray)
                put("temperature", 0.7)
                put("max_tokens", 350)
            }

            val request = Request.Builder()
                .url(API_URL)
                .addHeader("Authorization", "Bearer $apiKey")
                .addHeader("Content-Type", "application/json")
                .post(body.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                val errorMsg = try {
                    JSONObject(responseBody)
                        .optJSONObject("error")
                        ?.optString("message", "Unknown error")
                        ?: "HTTP ${response.code}: $responseBody"
                } catch (e: Exception) {
                    "HTTP ${response.code}: $responseBody"
                }
                return Result.failure(Exception(errorMsg))
            }

            val json = JSONObject(responseBody)
            val tweet = json
                .getJSONArray("choices")
                .getJSONObject(0)
                .getJSONObject("message")
                .getString("content")
                .trim()
                .removeSurrounding("\"")

            Result.success(tweet)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
