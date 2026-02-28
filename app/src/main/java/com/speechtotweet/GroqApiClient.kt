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

    fun translateAndFormatTweet(speechText: String): Result<String> {
        return try {
            val systemPrompt = """You are a social media expert. Your task:
1. If the input text is NOT in English, translate it to English first.
2. Format the translated (or original English) text as a Twitter/X post.
3. The tweet MUST be 280 characters or fewer.
4. Make it engaging, concise, and natural-sounding.
5. Add relevant hashtags (2-4 max) if appropriate.
6. Use emojis sparingly if they fit the tone.
7. Do NOT add quotes around the tweet.
8. Return ONLY the tweet text, nothing else — no explanation, no preamble."""

            val userMessage = "Convert this speech to a tweet:\n\n\"$speechText\""

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
