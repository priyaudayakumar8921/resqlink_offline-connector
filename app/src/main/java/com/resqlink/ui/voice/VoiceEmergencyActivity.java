package com.resqlink.ui.voice;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.ViewModelProvider;

import com.resqlink.databinding.ActivityVoiceEmergencyBinding;
import com.resqlink.ui.citizen.SOSStatusActivity;
import com.resqlink.viewmodel.CitizenViewModel;
import com.resqlink.voice.VoiceEmergencyViewModel;
import com.resqlink.voice.VoiceRecognitionManager;
import com.resqlink.location.LocationHelper;

/**
 * Pure Offline Speech-to-Text Voice Emergency Activity.
 * Spoken English text appears in the editable text area.
 * No automated classification, no keyword triggers, no priority alteration.
 */
public class VoiceEmergencyActivity extends AppCompatActivity
        implements VoiceRecognitionManager.VoiceRecognitionCallback {

    private ActivityVoiceEmergencyBinding binding;
    private VoiceRecognitionManager voiceManager;
    private VoiceEmergencyViewModel voiceViewModel;
    private CitizenViewModel citizenViewModel;

    /** Accumulates confirmed (final) speech segments. */
    private final StringBuilder confirmedSpeech = new StringBuilder();

    /** The transcript the citizen will send — kept in sync with the EditText. */
    private String currentTranscription = "";

    /**
     * True when the citizen tapped STOP & SEND while recording was active.
     * We wait for onFinalDelivered() before actually dispatching the emergency.
     */
    private boolean pendingSend = false;

    private static final int PERMISSIONS_REQUEST_RECORD_AUDIO = 1;
    private static final int PERMISSIONS_REQUEST_LOCATION      = 2;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityVoiceEmergencyBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        voiceViewModel   = new ViewModelProvider(this).get(VoiceEmergencyViewModel.class);
        citizenViewModel = new ViewModelProvider(this).get(CitizenViewModel.class);

        voiceManager = new VoiceRecognitionManager(this, this);

        binding.btnCancel.setOnClickListener(v -> finish());
        binding.btnSend.setOnClickListener(v -> handleSend());
        binding.btnMic.setOnClickListener(v -> toggleRecording());

        setupTextWatcher();
        checkAudioPermission();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (voiceManager != null) {
            voiceManager.destroy();
        }
    }

    // ─── Permission ───────────────────────────────────────────────────────────

    private void checkAudioPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    PERMISSIONS_REQUEST_RECORD_AUDIO);
        } else {
            initSpeechEngine();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
            @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSIONS_REQUEST_RECORD_AUDIO) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                initSpeechEngine();
            } else {
                Toast.makeText(this,
                        "Microphone permission is required for voice recognition.",
                        Toast.LENGTH_LONG).show();
                binding.tvStatus.setText("Microphone permission denied.");
                binding.progressListening.setVisibility(View.INVISIBLE);
            }
        } else if (requestCode == PERMISSIONS_REQUEST_LOCATION) {
            sendEmergencyWithLocation();
        }
    }

    // ─── Speech engine ────────────────────────────────────────────────────────

    private void initSpeechEngine() {
        binding.tvStatus.setText("Loading offline English voice model...");
        binding.progressListening.setVisibility(View.VISIBLE);
        voiceManager.initModel();
    }

    private void toggleRecording() {
        if (voiceManager == null) return;

        if (voiceManager.isListening()) {
            // User tapped mic to pause — stop and wait for final result flush
            voiceManager.stopListening();
            binding.tvStatus.setText("Processing last words...");
        } else {
            confirmedSpeech.setLength(0); // fresh session
            currentTranscription = "";
            binding.tvTranscription.setText("");
            binding.tvStatus.setText("🔴 Listening... Speak naturally in English");
            binding.progressListening.setVisibility(View.VISIBLE);
            voiceManager.startListening();
        }
    }

    private void setupTextWatcher() {
        binding.tvTranscription.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                String text = s != null ? s.toString().trim() : "";
                currentTranscription = text;
                // If citizen manually edits, keep confirmed buffer in sync
                if (binding.tvTranscription.isFocused()) {
                    confirmedSpeech.setLength(0);
                    confirmedSpeech.append(text);
                }
            }
        });
    }

    // ─── VoiceRecognitionManager.VoiceRecognitionCallback ────────────────────

    @Override
    public void onReady() {
        runOnUiThread(() -> {
            Toast.makeText(this, "Speech engine ready. Tap 🎙 to speak.", Toast.LENGTH_SHORT).show();
            binding.tvStatus.setText("Tap the microphone to start speaking");
            binding.progressListening.setVisibility(View.INVISIBLE);
        });
    }

    @Override
    public void onResult(String text) {
        // Called for each utterance segment (sentence / pause) AND for onFinalResult
        runOnUiThread(() -> {
            if (text != null && !text.trim().isEmpty()) {
                if (confirmedSpeech.length() > 0) confirmedSpeech.append(" ");
                confirmedSpeech.append(text.trim());
                updateTranscription(confirmedSpeech.toString());
            }
        });
    }

    @Override
    public void onPartialResult(String text) {
        // Live preview — show confirmed + in-progress partial
        runOnUiThread(() -> {
            if (text != null && !text.trim().isEmpty()) {
                String combined = confirmedSpeech.length() > 0
                        ? confirmedSpeech + " " + text.trim()
                        : text.trim();
                updateTranscription(combined);
            }
        });
    }

    @Override
    public void onError(Exception e) {
        runOnUiThread(() -> {
            String msg = e != null && e.getMessage() != null ? e.getMessage() : "Unknown voice error";
            binding.tvStatus.setText("Voice error: " + msg);
            binding.progressListening.setVisibility(View.INVISIBLE);
            Toast.makeText(this, "Voice error: " + msg, Toast.LENGTH_LONG).show();
        });
    }

    @Override
    public void onStateChanged(String state) {
        runOnUiThread(() -> {
            switch (state) {
                case "LISTENING":
                    binding.tvStatus.setText("🔴 Listening... Speak into microphone");
                    binding.progressListening.setVisibility(View.VISIBLE);
                    break;
                case "INITIALIZING":
                    binding.tvStatus.setText("Loading speech recognition engine...");
                    binding.progressListening.setVisibility(View.VISIBLE);
                    break;
                default:
                    // IDLE / TIMEOUT
                    binding.progressListening.setVisibility(View.INVISIBLE);
                    if (!pendingSend) {
                        binding.tvStatus.setText("Tap microphone to speak again or tap SEND");
                    }
                    break;
            }
        });
    }

    /**
     * Called by VoiceRecognitionManager AFTER onFinalResult() has been delivered
     * and the engine has been shut down. If a send was pending, dispatch it now.
     */
    @Override
    public void onFinalDelivered() {
        runOnUiThread(() -> {
            if (pendingSend) {
                pendingSend = false;
                dispatchEmergency();
            }
        });
    }

    // ─── UI helpers ───────────────────────────────────────────────────────────

    private void updateTranscription(String text) {
        if (text != null && !text.trim().isEmpty()) {
            currentTranscription = text.trim();
            if (!binding.tvTranscription.isFocused()) {
                binding.tvTranscription.setText(currentTranscription);
                binding.tvTranscription.setSelection(currentTranscription.length());
            }
        }
    }

    // ─── Send flow ────────────────────────────────────────────────────────────

    private void handleSend() {
        if (voiceManager != null && voiceManager.isListening()) {
            // Still recording — stop first, then send after onFinalDelivered() fires
            pendingSend = true;
            binding.tvStatus.setText("Processing final words...");
            binding.btnSend.setText("SENDING...");
            binding.btnSend.setEnabled(false);
            voiceManager.stopListening();
            // dispatchEmergency() will be called from onFinalDelivered()
        } else {
            // Already idle — send immediately
            dispatchEmergency();
        }
    }

    private void dispatchEmergency() {
        // Always read the final text from the EditText (respects manual edits)
        String finalTranscript = binding.tvTranscription.getText() != null
                ? binding.tvTranscription.getText().toString().trim()
                : "";

        // Also check the confirmed buffer as a fallback
        if (finalTranscript.isEmpty() && confirmedSpeech.length() > 0) {
            finalTranscript = confirmedSpeech.toString().trim();
        }

        if (finalTranscript.isEmpty()) {
            Toast.makeText(this,
                    "No voice transcript detected. Please speak or type your emergency message before sending.",
                    Toast.LENGTH_LONG).show();
            binding.tvStatus.setText("Transcript is empty. Tap mic to speak.");
            binding.progressListening.setVisibility(View.INVISIBLE);
            binding.btnSend.setText("STOP & SEND SOS");
            binding.btnSend.setEnabled(true);
            pendingSend = false;
            return;
        }

        binding.tvStatus.setText("Dispatching emergency signal...");
        binding.btnSend.setText("SENDING...");
        binding.btnSend.setEnabled(false);

        currentTranscription = finalTranscript;

        proceedWithLocationAndSend();
    }

    private void proceedWithLocationAndSend() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                    PERMISSIONS_REQUEST_LOCATION);
        } else {
            sendEmergencyWithLocation();
        }
    }

    private void sendEmergencyWithLocation() {
        LocationHelper.getCurrentLocation(this, location -> {
            Double lat = null, lng = null;
            Float  acc = null;

            if (location != null) {
                lat = location.getLatitude();
                lng = location.getLongitude();
                acc = location.getAccuracy();
            }

            final Double fLat = lat;
            final Double fLng = lng;
            final Float  fAcc = acc;

            citizenViewModel.getProfile().observe(this, profile -> {
                if (profile != null) {
                    citizenViewModel.getProfile().removeObservers(this);

                    // Standard Voice Emergency: send exact transcript,
                    // no AI classification, no automatic priority change.
                    String sosId = voiceViewModel.createAndSaveVoiceEmergency(
                            profile.citizenId,
                            fLat, fLng, fAcc,
                            currentTranscription,
                            "VOICE",
                            "NORMAL");

                    Toast.makeText(this,
                            "Emergency voice alert dispatched.", Toast.LENGTH_LONG).show();

                    Intent intent = new Intent(this, SOSStatusActivity.class);
                    intent.putExtra("SOS_ID", sosId);
                    startActivity(intent);
                    finish();
                }
            });
        });
    }
}
