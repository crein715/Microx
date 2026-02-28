package com.speechtotweet

import android.Manifest
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.speechtotweet.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private var pulseAnimator: AnimatorSet? = null

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
        private const val PREFS_NAME = "speech_to_tweet_prefs"
        private const val KEY_API_KEY = "groq_api_key"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        loadApiKey()
        setupListeners()
        checkPermissions()
    }

    private fun loadApiKey() {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val savedKey = prefs.getString(KEY_API_KEY, "") ?: ""
        if (savedKey.isNotEmpty()) {
            binding.etApiKey.setText(savedKey)
        }
    }

    private fun saveApiKey(key: String) {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .edit()
            .putString(KEY_API_KEY, key)
            .apply()
    }

    private fun setupListeners() {
        binding.btnRecord.setOnClickListener {
            if (isListening) {
                stopListening()
            } else {
                startListening()
            }
        }

        binding.btnCopy.setOnClickListener {
            val tweet = binding.tvTweet.text.toString()
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("tweet", tweet))
            Toast.makeText(this, "Copied to clipboard!", Toast.LENGTH_SHORT).show()
        }

        binding.btnShare.setOnClickListener {
            val tweet = binding.tvTweet.text.toString()
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, tweet)
            }
            startActivity(Intent.createChooser(shareIntent, "Share tweet via"))
        }
    }

    private fun checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isEmpty() || grantResults[0] != PackageManager.PERMISSION_GRANTED) {
                showError("Microphone permission is required for speech recognition.")
            }
        }
    }

    private fun startListening() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            checkPermissions()
            return
        }

        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            showError("Speech recognition is not available on this device.")
            return
        }

        hideError()
        binding.layoutTweet.visibility = View.GONE

        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)

        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                runOnUiThread {
                    isListening = true
                    binding.tvRecordStatus.text = "Listening… speak now"
                    binding.tvRecordStatus.setTextColor(
                        ContextCompat.getColor(this@MainActivity, R.color.red_record)
                    )
                    binding.btnRecord.setBackgroundResource(R.drawable.bg_record_button_active)
                    startPulseAnimation()
                }
            }

            override fun onBeginningOfSpeech() {}

            override fun onRmsChanged(rmsdB: Float) {}

            override fun onBufferReceived(buffer: ByteArray?) {}

            override fun onEndOfSpeech() {
                runOnUiThread {
                    stopRecordingUI()
                    binding.tvRecordStatus.text = "Processing…"
                }
            }

            override fun onError(error: Int) {
                runOnUiThread {
                    stopRecordingUI()
                    val message = when (error) {
                        SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                        SpeechRecognizer.ERROR_CLIENT -> "Client error"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                        SpeechRecognizer.ERROR_NETWORK -> "Network error"
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                        SpeechRecognizer.ERROR_NO_MATCH -> "No speech detected. Try again."
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
                        SpeechRecognizer.ERROR_SERVER -> "Server error"
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected. Try again."
                        else -> "Unknown error ($error)"
                    }
                    showError(message)
                    binding.tvRecordStatus.text = "Tap to speak"
                }
            }

            override fun onResults(results: Bundle?) {
                runOnUiThread {
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val text = matches?.firstOrNull() ?: ""

                    if (text.isEmpty()) {
                        showError("No speech detected. Try again.")
                        binding.tvRecordStatus.text = "Tap to speak"
                        return@runOnUiThread
                    }

                    binding.layoutRawText.visibility = View.VISIBLE
                    binding.tvRawText.text = text
                    binding.tvRecordStatus.text = "Tap to speak"

                    processWithGroq(text)
                }
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val text = matches?.firstOrNull() ?: ""
                if (text.isNotEmpty()) {
                    runOnUiThread {
                        binding.layoutRawText.visibility = View.VISIBLE
                        binding.tvRawText.text = text
                    }
                }
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        speechRecognizer?.startListening(intent)
    }

    private fun stopListening() {
        speechRecognizer?.stopListening()
        stopRecordingUI()
    }

    private fun stopRecordingUI() {
        isListening = false
        binding.btnRecord.setBackgroundResource(R.drawable.bg_record_button)
        binding.tvRecordStatus.setTextColor(
            ContextCompat.getColor(this, R.color.text_secondary)
        )
        stopPulseAnimation()
    }

    private fun startPulseAnimation() {
        val pulse = binding.viewPulse
        pulse.alpha = 0.4f

        val scaleX = ObjectAnimator.ofFloat(pulse, "scaleX", 1f, 1.5f).apply {
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
        }
        val scaleY = ObjectAnimator.ofFloat(pulse, "scaleY", 1f, 1.5f).apply {
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
        }
        val alpha = ObjectAnimator.ofFloat(pulse, "alpha", 0.4f, 0f).apply {
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
        }

        pulseAnimator = AnimatorSet().apply {
            playTogether(scaleX, scaleY, alpha)
            duration = 1000
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    private fun stopPulseAnimation() {
        pulseAnimator?.cancel()
        binding.viewPulse.alpha = 0f
        binding.viewPulse.scaleX = 1f
        binding.viewPulse.scaleY = 1f
    }

    private fun processWithGroq(speechText: String) {
        val apiKey = binding.etApiKey.text.toString().trim()
        if (apiKey.isEmpty()) {
            showError("Please enter your Groq API key first.")
            return
        }

        saveApiKey(apiKey)

        binding.layoutLoading.visibility = View.VISIBLE
        binding.layoutTweet.visibility = View.GONE
        hideError()

        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                GroqApiClient(apiKey).translateAndFormatTweet(speechText)
            }

            binding.layoutLoading.visibility = View.GONE

            result.onSuccess { tweet ->
                binding.layoutTweet.visibility = View.VISIBLE
                binding.tvTweet.text = tweet
                binding.tvCharCount.text = "${tweet.length}/280"

                val countColor = if (tweet.length <= 280) R.color.green_success else R.color.red_record
                binding.tvCharCount.setTextColor(ContextCompat.getColor(this@MainActivity, countColor))
            }

            result.onFailure { error ->
                showError("Groq API Error: ${error.message}")
            }
        }
    }

    private fun showError(message: String) {
        binding.tvError.text = message
        binding.tvError.visibility = View.VISIBLE
    }

    private fun hideError() {
        binding.tvError.visibility = View.GONE
    }

    override fun onDestroy() {
        speechRecognizer?.destroy()
        pulseAnimator?.cancel()
        super.onDestroy()
    }
}
